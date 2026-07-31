import { z } from "zod";
import { AuditFinding, AuditSummary } from "./audit.js";
import { Fact, ResolvedBinding } from "./fact.js";
import { BatchIntent, Intent } from "./intent.js";
import { Receipt } from "./receipt.js";

// ── 事件(全系统唯一事实来源)──────────────────────────
// 写入纪律(Part D):所有状态变更必须经 appendEvent;facts/intents/runs 表是同事务投影,
// 直接写投影表在 code review 中一票否决。
const runId = z.string();
const stepId = z.string();
const intentId = z.string();

export const HarnessEvent = z.discriminatedUnion("t", [
  z.object({
    t: z.literal("run.created"),
    runId,
    goal: z.string().optional(),
    sopRef: z.string().optional(),
  }),
  z.object({
    t: z.literal("step.planned"),
    runId,
    stepId,
    toolRef: z.string().optional(),
    plannerRationale: z.string().optional(), // descriptive model output; not a verified fact
  }),
  z.object({ t: z.literal("fact.observed"), runId, fact: Fact }),
  z.object({ t: z.literal("intent.proposed"), runId, intent: Intent }),
  z.object({ t: z.literal("batch.proposed"), runId, batch: BatchIntent }), // 【v2.3】
  z.object({
    t: z.literal("checkpoint.raised"),
    runId,
    intentId,
    policy: z.enum(["show", "notify", "confirm"]),
    escalatedByModel: z.boolean(),
  }),
  z.object({
    t: z.literal("user.decided"),
    runId,
    intentId,
    decision: z.enum(["approve", "edit", "reject"]),
    decidedBy: z.string(), // 【v2.2】批准者身份,审计必需
    editedArgs: z.array(ResolvedBinding).optional(),
  }),
  z.object({
    t: z.literal("revalidation"),
    runId,
    intentId,
    result: z.enum(["pass", "stale"]),
    changedFactIds: z.array(z.string()).optional(),
  }),
  z.object({
    t: z.literal("execution.started"),
    runId,
    intentId,
    idempotencyKey: z.string(),
  }),
  z.object({ t: z.literal("receipt.recorded"), runId, receipt: Receipt }),
  z.object({
    t: z.literal("receipt.settled"), // pending → 终态
    runId,
    intentId,
    finalStatus: z.enum(["confirmed", "failed"]),
  }),
  z.object({
    t: z.literal("model.output"),
    runId,
    outputRef: z.string(), // audit.finding/audit.summary 的 outputRef 指回这里
    text: z.string(),
    channel: z.enum(["chat", "voice"]),
  }),
  z.object({ t: z.literal("audit.finding"), runId, finding: AuditFinding }),
  z.object({ t: z.literal("audit.summary"), runId, summary: AuditSummary }), // 【v2.3】
  z.object({ t: z.literal("run.suspended"), runId, reason: z.string() }),
  z.object({ t: z.literal("run.resumed"), runId }),
  z.object({ t: z.literal("run.completed"), runId }),
  z.object({ t: z.literal("run.failed"), runId, reason: z.string() }),
]);
export type HarnessEvent = z.infer<typeof HarnessEvent>;

export const EventActor = z.enum(["model", "user", "system"]);
export type EventActor = z.infer<typeof EventActor>;

// 信封:events 表一行 = 一个 EventEnvelope。
// seq 对应 DB 的 BIGSERIAL;线上(SSE/JSON)表示用 number 而非 bigint——
// bigint 不可 JSON.stringify,且事件量级在 Number.MAX_SAFE_INTEGER(9e15)内无需迁移。
export const EventEnvelope = z.object({
  seq: z.number().int().nonnegative(),
  at: z.string().datetime(),
  actor: EventActor,
  event: HarnessEvent,
});
export type EventEnvelope = z.infer<typeof EventEnvelope>;
