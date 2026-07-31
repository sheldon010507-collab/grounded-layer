import type {
  BatchIntent,
  Fact,
  HarnessEvent,
  Intent,
  Receipt,
  ToolManifest,
} from "../src/index.js";

// 共用的最小合法样例,供 refine/roundtrip/discriminated-union 测试复用。
export const now = "2026-07-24T12:00:00.000Z";

export const observedFact: Fact = {
  id: "fact_a1b2c3d4e5f6",
  runId: "run_abc123",
  key: "closing_time",
  value: "18:00",
  kind: "observed",
  riskClass: "normal",
  source: { system: "tenant_hours_api", retrievedAt: now },
  observedAt: now,
};

export const derivedFact: Fact = {
  id: "fact_b2c3d4e5f6a1",
  runId: "run_abc123",
  key: "closing_time_msg",
  value: "Peaches 今天下午六点关门。",
  kind: "derived",
  derivedFrom: [observedFact.id],
  riskClass: "low",
  source: { system: "model:planner", retrievedAt: now },
  observedAt: now,
};

export const collectionFact: Fact = {
  id: "fact_c3d4e5f6a1b2",
  runId: "run_abc123",
  key: "search_results",
  value: [{ id: 1 }, { id: 2 }],
  itemSchema: { type: "object" },
  kind: "observed",
  riskClass: "low",
  source: { system: "hotel_search_api", retrievedAt: now },
  observedAt: now,
  etag: "etag-1",
};

export const intent: Intent = {
  intentId: "int_a1b2c3d4e5f6",
  runId: "run_abc123",
  toolRef: "gmail.send",
  args: [
    { type: "fact", param: "to", factId: observedFact.id },
    { type: "user", param: "subject", userValue: "Hi", decidedBy: "user_1" },
  ],
  idempotencyKey: "idem_1",
  proposedBy: "model",
  checkpoint: "confirm",
  status: "proposed",
  version: 0,
};

export const batchIntent: BatchIntent = {
  batchId: "bat_a1b2c3d4e5f6",
  runId: "run_abc123",
  toolRef: "email.remind",
  templateDesc: "给 12 位客户发账单提醒",
  itemIntentIds: ["int_1", "int_2"],
  checkpoint: "confirm",
};

export const receipt: Receipt = {
  intentId: intent.intentId,
  status: "confirmed",
  externalRef: "msg_18a",
  rawHash: "sha256:deadbeef",
  recordedAt: now,
  signature: "sig-placeholder",
};

export const toolManifest: ToolManifest = {
  ref: "gmail.send",
  title: "Send Gmail",
  inputSchema: { type: "object" },
  reversibility: "irreversible",
  externality: "external",
  producesReceipt: true,
  paramPolicy: { to: { allowKinds: ["observed", "user"] } },
  revalidate: null,
  providerIdempotencySupport: false,
  conditionalExecution: false,
  settlement: "sync",
  ap2: false,
};

export const runCreatedEvent: HarnessEvent = {
  t: "run.created",
  runId: "run_abc123",
  goal: "email closing time",
};

export const events: HarnessEvent[] = [
  runCreatedEvent,
  { t: "step.planned", runId: "run_abc123", stepId: "step_1", toolRef: "hours.query" },
  { t: "fact.observed", runId: "run_abc123", fact: observedFact },
  { t: "intent.proposed", runId: "run_abc123", intent },
  { t: "batch.proposed", runId: "run_abc123", batch: batchIntent },
  {
    t: "checkpoint.raised",
    runId: "run_abc123",
    intentId: intent.intentId,
    policy: "confirm",
    escalatedByModel: false,
  },
  {
    t: "user.decided",
    runId: "run_abc123",
    intentId: intent.intentId,
    decision: "approve",
    decidedBy: "user_1",
  },
  {
    t: "revalidation",
    runId: "run_abc123",
    intentId: intent.intentId,
    result: "pass",
  },
  {
    t: "execution.started",
    runId: "run_abc123",
    intentId: intent.intentId,
    idempotencyKey: "idem_1",
  },
  { t: "receipt.recorded", runId: "run_abc123", receipt },
  {
    t: "receipt.settled",
    runId: "run_abc123",
    intentId: intent.intentId,
    finalStatus: "confirmed",
  },
  {
    t: "model.output",
    runId: "run_abc123",
    outputRef: "out_1",
    text: "闭馆时间是18:00,已经帮您发邮件通知了。",
    channel: "chat",
  },
  {
    t: "audit.finding",
    runId: "run_abc123",
    finding: {
      claimText: "已发送",
      claimType: "status_assertion",
      verdict: "matched",
      channel: "chat",
    },
  },
  {
    t: "audit.summary",
    runId: "run_abc123",
    summary: {
      outputRef: "out_1",
      counts: { matched: 1, mismatch: 0, unsupported_inference: 0 },
      noCheckableClaims: false,
    },
  },
  { t: "run.suspended", runId: "run_abc123", reason: "confirm checkpoint" },
  { t: "run.resumed", runId: "run_abc123" },
  { t: "run.completed", runId: "run_abc123" },
  { t: "run.failed", runId: "run_abc123", reason: "planner exhausted retries" },
];
