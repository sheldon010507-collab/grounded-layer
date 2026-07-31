import { EventSchemas, EventType } from "@ag-ui/core";
import type { EventEnvelope, HarnessEvent } from "@grounded/protocol";
import { describe, expect, it } from "vitest";
import { encodeSSE, toAGUIEvent } from "../src/bridge.js";

const runId = "run_abc123";
const now = "2026-07-24T12:00:00.000Z";

function envelope(seq: number, event: HarnessEvent): EventEnvelope {
  return { seq, at: now, actor: "system", event };
}

// Part B.2 黄金路径①–⑦ 用到的全部事件类型 + 其余 HarnessEvent 变体,逐一覆盖。
const cases: EventEnvelope[] = [
  envelope(0, { t: "run.created", runId, goal: "test" }),
  envelope(1, { t: "step.planned", runId, stepId: "step_1", toolRef: "hours.query" }),
  envelope(2, {
    t: "fact.observed",
    runId,
    fact: {
      id: "fact_a1b2c3d4e5f6",
      runId,
      key: "closing_time",
      value: "18:00",
      kind: "observed",
      riskClass: "normal",
      source: { system: "hours.query", retrievedAt: now },
      observedAt: now,
    },
  }),
  envelope(3, {
    t: "intent.proposed",
    runId,
    intent: {
      intentId: "int_a1b2c3d4e5f6",
      runId,
      toolRef: "gmail.send",
      args: [{ type: "fact", param: "to", factId: "fact_a1b2c3d4e5f6" }],
      idempotencyKey: "idem_1",
      proposedBy: "model",
      checkpoint: "confirm",
      status: "proposed",
      version: 0,
    },
  }),
  envelope(4, {
    t: "batch.proposed",
    runId,
    batch: {
      batchId: "bat_a1b2c3d4e5f6",
      runId,
      toolRef: "email.remind",
      templateDesc: "batch",
      itemIntentIds: ["int_1", "int_2"],
      checkpoint: "confirm",
    },
  }),
  envelope(5, {
    t: "checkpoint.raised",
    runId,
    intentId: "int_a1b2c3d4e5f6",
    policy: "confirm",
    escalatedByModel: false,
  }),
  envelope(6, { t: "run.suspended", runId, reason: "confirm checkpoint" }),
  envelope(7, {
    t: "user.decided",
    runId,
    intentId: "int_a1b2c3d4e5f6",
    decision: "approve",
    decidedBy: "user_1",
  }),
  envelope(8, {
    t: "revalidation",
    runId,
    intentId: "int_a1b2c3d4e5f6",
    result: "pass",
  }),
  envelope(9, {
    t: "execution.started",
    runId,
    intentId: "int_a1b2c3d4e5f6",
    idempotencyKey: "idem_1",
  }),
  envelope(10, {
    t: "receipt.recorded",
    runId,
    receipt: {
      intentId: "int_a1b2c3d4e5f6",
      status: "confirmed",
      externalRef: "msg_18a",
      rawHash: "sha256:deadbeef",
      recordedAt: now,
      signature: "sig",
    },
  }),
  envelope(11, {
    t: "audit.finding",
    runId,
    finding: {
      claimText: "已发送",
      claimType: "status_assertion",
      verdict: "matched",
      channel: "chat",
    },
  }),
  envelope(12, {
    t: "audit.summary",
    runId,
    summary: {
      outputRef: "out_1",
      counts: { matched: 1, mismatch: 0, unsupported_inference: 0 },
      noCheckableClaims: false,
    },
  }),
  envelope(13, { t: "run.resumed", runId }),
  envelope(14, { t: "run.completed", runId }),
  envelope(15, { t: "run.failed", runId, reason: "planner exhausted retries" }),
];

describe("toAGUIEvent: every HarnessEvent variant produces a schema-valid AGUIEvent", () => {
  it.each(cases.map((e) => [e.event.t, e] as const))(
    "%s validates against @ag-ui/core's own EventSchemas",
    (_t, env) => {
      const aguiEvent = toAGUIEvent(env);
      // 这不是我们自己造的断言——是拿协议方的真实 Zod schema 校验我们的输出,
      // 这就是"标准 AG-UI 客户端不会因为这个事件报错"的实证,而不是我们自己说了算。
      expect(() => EventSchemas.parse(aguiEvent)).not.toThrow();
    },
  );
});

describe("lifecycle mapping (Part E.8: 生命周期事件 → 标准 RUN_STARTED/RUN_FINISHED/RUN_ERROR)", () => {
  it("run.created -> RUN_STARTED", () => {
    const out = toAGUIEvent(envelope(0, { t: "run.created", runId }));
    expect(out).toMatchObject({ type: EventType.RUN_STARTED, runId, threadId: runId });
  });

  it("run.resumed -> RUN_STARTED (a fresh run.created is only sent once)", () => {
    const out = toAGUIEvent(envelope(0, { t: "run.resumed", runId }));
    expect(out).toMatchObject({ type: EventType.RUN_STARTED, runId, threadId: runId });
  });

  it("run.completed -> RUN_FINISHED{outcome: success}", () => {
    const out = toAGUIEvent(envelope(0, { t: "run.completed", runId }));
    expect(out).toMatchObject({
      type: EventType.RUN_FINISHED,
      runId,
      outcome: { type: "success" },
    });
  });

  it("run.suspended -> RUN_FINISHED{outcome: interrupt} — not a failure, a pause-for-human", () => {
    const out = toAGUIEvent(envelope(0, { t: "run.suspended", runId, reason: "confirm" }));
    expect(out).toMatchObject({
      type: EventType.RUN_FINISHED,
      runId,
      outcome: { type: "interrupt", interrupts: [{ id: runId, reason: "confirm" }] },
    });
  });

  it("run.failed -> RUN_ERROR", () => {
    const out = toAGUIEvent(envelope(0, { t: "run.failed", runId, reason: "boom" }));
    expect(out).toMatchObject({ type: EventType.RUN_ERROR, message: "boom" });
  });
});

describe("everything else -> CUSTOM, untouched (Part E.8: 原样透传)", () => {
  it("wraps the full HarnessEvent as value, name prefixed grounded.<t>", () => {
    const finding = {
      claimText: "已发送",
      claimType: "status_assertion" as const,
      verdict: "matched" as const,
      channel: "chat" as const,
    };
    const original: HarnessEvent = { t: "audit.finding", runId, finding };
    const out = toAGUIEvent(envelope(0, original));
    expect(out).toMatchObject({
      type: EventType.CUSTOM,
      name: "grounded.audit.finding",
      value: original,
    });
  });

  it("an unrecognized AG-UI client can still safely ignore CUSTOM events (schema only requires name+value)", () => {
    const out = toAGUIEvent(
      envelope(0, {
        t: "checkpoint.raised",
        runId,
        intentId: "int_1",
        policy: "confirm",
        escalatedByModel: false,
      }),
    );
    const parsed = EventSchemas.parse(out);
    expect(parsed.type).toBe(EventType.CUSTOM);
  });
});

describe("encodeSSE", () => {
  it("produces a standard `data: <json>\\n\\n` line", () => {
    const out = toAGUIEvent(envelope(0, { t: "run.created", runId }));
    const line = encodeSSE(out);
    expect(line.startsWith("data: ")).toBe(true);
    expect(line.endsWith("\n\n")).toBe(true);
    expect(JSON.parse(line.slice("data: ".length).trim())).toMatchObject({ runId });
  });

  it("prefixes an `id: <seq>` line when opts.id is passed (Last-Event-ID resume)", () => {
    const out = toAGUIEvent(envelope(7, { t: "run.created", runId }));
    const line = encodeSSE(out, { id: 7 });
    expect(line.startsWith("id: 7\n")).toBe(true);
    expect(line).toContain("data: ");
    expect(line.endsWith("\n\n")).toBe(true);
  });
});
