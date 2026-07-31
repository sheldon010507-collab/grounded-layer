import type { ConfirmationDecisionDraft } from "@grounded/protocol";
import { describe, expect, it } from "vitest";
import { type ConformanceTarget, runProtocolConformance } from "../src/index.js";

function target(result: "confirmed" | "failed"): ConformanceTarget {
  return {
    name: "fixture",
    async createRun() {
      return { runId: "run_fixture" };
    },
    async observeFact() {
      return { fact: { id: "fact_1", key: "to" } };
    },
    async submitIntent() {
      return {
        kind: "awaiting_confirmation" as const,
        confirmation: {
          schemaVersion: "grounded.confirmation.v1" as const,
          runId: "run_fixture",
          intentId: "intent_fixture",
          intentVersion: 0,
          toolRef: "fixture.echo",
          parameterSetDigest: "a".repeat(64),
          cardDigest: "b".repeat(64),
          issuedAt: "2026-07-31T00:00:00.000Z",
          confirmationToken: "opaque",
          card: {
            type: "action-confirmation-card" as const,
            toolTitle: "Fixture",
            args: [
              {
                param: "to",
                label: "To",
                binding: { type: "fact" as const, param: "to", factId: "fact_1" },
                editable: true,
                valueType: "string" as const,
                requiresRatification: false,
              },
            ],
          },
        },
      };
    },
    async decide(_runId: string, _draft: ConfirmationDecisionDraft) {
      return {
        kind: "settled" as const,
        receipt: {
          intentId: "intent_fixture",
          status: result,
          rawHash: "hash",
          recordedAt: "2026-07-31T00:00:00.000Z",
          signature: "sig",
        },
      };
    },
  };
}

describe("public protocol conformance", () => {
  it("accepts a confirmed Receipt without requiring private packages", async () => {
    const report = await runProtocolConformance(target("confirmed"), {
      goal: "fixture",
      facts: [
        {
          key: "to",
          value: "person@example.com",
          riskClass: "normal",
          source: { system: "fixture", retrievedAt: "2026-07-31T00:00:00.000Z" },
        },
      ],
      toolRef: "fixture.echo",
      bindings: [{ param: "to", factKey: "to" }],
    });
    expect(report.failCount).toBe(0);
    expect(report.passCount).toBe(5);
  });

  it("does not treat failed Receipt as a schema failure or success claim", async () => {
    const report = await runProtocolConformance(target("failed"), {
      goal: "fixture",
      facts: [],
      toolRef: "fixture.echo",
      bindings: [],
    });
    expect(report.failCount).toBe(0);
    expect(
      report.checks.find((check) => check.name === "receipt_status_honesty")?.evidence,
    ).toContain("status=failed");
  });
});
