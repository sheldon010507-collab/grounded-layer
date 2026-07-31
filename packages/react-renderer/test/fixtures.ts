import type { AuditFinding, AuditSummary, Fact, Receipt } from "@grounded/protocol";

const now = new Date().toISOString();

export const observedFact: Fact = {
  id: "fact_a1b2c3d4e5f6",
  runId: "run_demo1",
  key: "closing_time",
  value: "18:00",
  kind: "observed",
  riskClass: "normal",
  source: { system: "tenant_hours_api", retrievedAt: now },
  observedAt: now,
};

export const derivedFact: Fact = {
  id: "fact_b2c3d4e5f6a1",
  runId: "run_demo1",
  key: "closing_time_msg",
  value: "Peaches 今天下午六点关门。",
  kind: "derived",
  derivedFrom: [observedFact.id],
  riskClass: "low",
  source: { system: "model:planner", retrievedAt: now },
  observedAt: now,
};

export const receiptFact: Fact = {
  id: "fact_c3d4e5f6a1b2",
  runId: "run_demo1",
  key: "send_receipt",
  value: "msg_18a2f",
  kind: "receipt",
  riskClass: "normal",
  source: { system: "gmail.send", retrievedAt: now },
  observedAt: now,
};

export const priceFact: Fact = {
  id: "fact_d4e5f6a1b2c3",
  runId: "run_demo1",
  key: "room_price",
  entityRef: "room:1204",
  value: 189,
  unit: "GBP",
  kind: "observed",
  riskClass: "high",
  source: { system: "hotel_pms", retrievedAt: now },
  observedAt: now,
  etag: "etag-1",
};

export const oldPriceFact: Fact = {
  ...priceFact,
  id: "fact_h1i2j3k4l5m6",
  value: 199,
  etag: "price-199",
  supersededBy: "fact_i2j3k4l5m6n7",
};

export const newPriceFact: Fact = {
  ...priceFact,
  id: "fact_i2j3k4l5m6n7",
  value: 249,
  etag: "price-249",
};

export const staleFact: Fact = {
  ...observedFact,
  id: "fact_e5f6a1b2c3d4",
  expiresAt: "2020-01-01T00:00:00.000Z",
};

export const collectionFact: Fact = {
  id: "fact_f6a1b2c3d4e5",
  runId: "run_demo1",
  key: "search_results",
  value: [{ id: 1 }, { id: 2 }, { id: 3 }],
  itemSchema: { type: "object" },
  kind: "observed",
  riskClass: "low",
  source: { system: "hotel_search_api", retrievedAt: now },
  observedAt: now,
};

export const recipientCandidateFact: Fact = {
  id: "fact_g1a2b3c4d5e6",
  runId: "run_demo1",
  key: "email_recipient",
  value: "robert@example.com",
  kind: "derived",
  derivedFrom: [observedFact.id],
  riskClass: "low",
  source: { system: "model:planner", retrievedAt: now },
  observedAt: now,
};

export const confirmedReceipt: Receipt = {
  intentId: "int_a1b2c3d4e5f6",
  status: "confirmed",
  externalRef: "msg_18a2f",
  rawHash: "sha256:deadbeef",
  recordedAt: now,
  signature: "sig-placeholder",
};

export const failedReceipt: Receipt = {
  ...confirmedReceipt,
  status: "failed",
  externalRef: undefined,
  errorCode: "FATAL_BOUNCE",
};

export const unknownReceipt: Receipt = {
  ...confirmedReceipt,
  status: "unknown",
  externalRef: undefined,
  errorCode: "TIMEOUT",
};

export const pendingReceipt: Receipt = {
  ...confirmedReceipt,
  status: "pending",
  externalRef: undefined,
};

export const batchRecipientFacts: Fact[] = ["Robert", "Alice", "Chen"].map((name, i) => ({
  id: `fact_batch${i}recipient0000`,
  runId: "run_demo1",
  key: "email_recipient",
  entityRef: `customer:${i}`,
  value: `${name.toLowerCase()}@example.com`,
  kind: "derived",
  derivedFrom: [observedFact.id],
  riskClass: "low",
  source: { system: "model:planner", retrievedAt: now },
  observedAt: now,
}));

export const cleanAuditSummary: AuditSummary = {
  outputRef: "out_demo1",
  counts: { matched: 2, mismatch: 0, unsupported_inference: 0 },
  noCheckableClaims: false,
};

export const mismatchAuditSummary: AuditSummary = {
  outputRef: "out_demo2",
  counts: { matched: 0, mismatch: 1, unsupported_inference: 1 },
  noCheckableClaims: false,
};

export const noCheckableAuditSummary: AuditSummary = {
  outputRef: "out_demo3",
  counts: { matched: 0, mismatch: 0, unsupported_inference: 0 },
  noCheckableClaims: true,
};

export const mismatchFindings: AuditFinding[] = [
  {
    claimText: "19:00",
    claimType: "datetime",
    verdict: "mismatch",
    factId: observedFact.id,
    channel: "chat",
  },
  {
    claimText: "已经帮您预订好了",
    claimType: "status_assertion",
    verdict: "unsupported_inference",
    channel: "chat",
  },
];

export const batchItems = batchRecipientFacts.map((fact, i) => ({
  intentId: `int_batch${i}0000000000`,
  label: ["Robert", "Alice", "Chen"][i] ?? `customer ${i}`,
  fields: [
    {
      param: "to",
      label: "收件人",
      binding: { type: "fact" as const, param: "to", factId: fact.id },
      fact,
    },
  ],
}));
