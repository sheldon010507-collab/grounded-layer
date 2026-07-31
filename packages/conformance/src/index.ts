import {
  ConfirmationDecisionDraft,
  ConfirmationEnvelopeSchema,
  GroundedConfirmResultSchema,
  GroundedSubmitResultSchema,
} from "@grounded/protocol";
import type {
  ConfirmationEnvelope,
  GroundedConfirmResult,
  GroundedSubmitResult,
  ProposedBinding,
} from "@grounded/protocol";

export interface ConformanceTarget {
  name: string;
  createRun(goal: string): Promise<{ runId: string }>;
  observeFact(
    runId: string,
    input: {
      key: string;
      value: string | number | boolean | null | unknown[];
      riskClass: "low" | "normal" | "high" | "critical";
      entityRef?: string;
      source: { system: string; retrievedAt: string };
    },
  ): Promise<{ fact: Record<string, unknown> }>;
  submitIntent(
    runId: string,
    input: { toolRef: string; bindings: ProposedBinding[] },
  ): Promise<GroundedSubmitResult>;
  decide(runId: string, draft: ConfirmationDecisionDraft): Promise<GroundedConfirmResult>;
}

export interface ConformanceScenario {
  goal: string;
  facts: Array<{
    key: string;
    value: string | number | boolean | null | unknown[];
    riskClass: "low" | "normal" | "high" | "critical";
    entityRef?: string;
    source: { system: string; retrievedAt: string };
  }>;
  toolRef: string;
  bindings: ProposedBinding[];
}

export interface ConformanceCheckResult {
  name: string;
  status: "pass" | "fail" | "not_applicable";
  evidence: string;
}

export interface ConformanceReport {
  target: string;
  checks: ConformanceCheckResult[];
  passCount: number;
  failCount: number;
  notApplicableCount: number;
}

function result(name: string, ok: boolean, evidence: string): ConformanceCheckResult {
  return { name, status: ok ? "pass" : "fail", evidence };
}

export async function runProtocolConformance(
  target: ConformanceTarget,
  scenario: ConformanceScenario,
): Promise<ConformanceReport> {
  const checks: ConformanceCheckResult[] = [];
  const run = await target.createRun(scenario.goal);
  for (const fact of scenario.facts) await target.observeFact(run.runId, fact);

  const submitted = await target.submitIntent(run.runId, {
    toolRef: scenario.toolRef,
    bindings: scenario.bindings,
  });
  const parsedSubmit = GroundedSubmitResultSchema.safeParse(submitted);
  checks.push(
    result(
      "submit_response_schema",
      parsedSubmit.success,
      parsedSubmit.success ? `submitIntent kind=${submitted.kind}` : parsedSubmit.error.message,
    ),
  );

  if (submitted.kind !== "awaiting_confirmation") {
    checks.push({
      name: "confirmation_envelope_schema",
      status: "not_applicable",
      evidence: `runtime returned ${submitted.kind}; no confirmation envelope was issued`,
    });
    checks.push({
      name: "decision_response_schema",
      status: "not_applicable",
      evidence: "decision was not attempted because no confirmation envelope was issued",
    });
  } else {
    const envelope = submitted.confirmation as ConfirmationEnvelope;
    const parsedEnvelope = ConfirmationEnvelopeSchema.safeParse(envelope);
    checks.push(
      result(
        "confirmation_envelope_schema",
        parsedEnvelope.success,
        parsedEnvelope.success ? `intent=${envelope.intentId}` : parsedEnvelope.error.message,
      ),
    );

    const decision = {
      confirmationToken: envelope.confirmationToken,
      decision: "approve" as const,
    };
    checks.push(
      result(
        "confirmation_decision_schema",
        ConfirmationDecisionDraft.safeParse(decision).success,
        "approve sends only the opaque confirmation token and decision",
      ),
    );

    const decided = await target.decide(run.runId, decision);
    const parsedDecision = GroundedConfirmResultSchema.safeParse(decided);
    checks.push(
      result(
        "decision_response_schema",
        parsedDecision.success,
        parsedDecision.success ? `decide kind=${decided.kind}` : parsedDecision.error.message,
      ),
    );
    if (decided.kind === "settled") {
      checks.push(
        result(
          "receipt_status_honesty",
          decided.receipt.status === "confirmed" ||
            decided.receipt.status === "failed" ||
            decided.receipt.status === "unknown" ||
            decided.receipt.status === "pending",
          `settled receipt status=${decided.receipt.status}`,
        ),
      );
    } else {
      checks.push({
        name: "receipt_status_honesty",
        status: "not_applicable",
        evidence: `decide returned ${decided.kind}; no Receipt was returned`,
      });
    }
  }

  return {
    target: target.name,
    checks,
    passCount: checks.filter((check) => check.status === "pass").length,
    failCount: checks.filter((check) => check.status === "fail").length,
    notApplicableCount: checks.filter((check) => check.status === "not_applicable").length,
  };
}
