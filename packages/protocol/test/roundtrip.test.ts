import { describe, expect, it } from "vitest";
import { BatchIntent, Fact, HarnessEvent, Intent, Receipt, ToolManifest } from "../src/index.js";
import {
  events,
  batchIntent,
  collectionFact,
  derivedFact,
  intent,
  observedFact,
  receipt,
  toolManifest,
} from "./fixtures.js";

// E.1 验收标准:"所有 schema 有 roundtrip 测试(parse→serialize→parse 相等)"。
// JSON.stringify/parse 是事件真正的传输形态(SSE/Postgres JSONB),所以 roundtrip 走 JSON,不是 zod 内部克隆。
function roundtrip<T>(schema: { parse: (v: unknown) => T }, value: T) {
  const parsedOnce = schema.parse(value);
  const wire = JSON.parse(JSON.stringify(parsedOnce));
  const parsedTwice = schema.parse(wire);
  expect(parsedTwice).toEqual(parsedOnce);
}

describe("roundtrip: parse -> JSON.stringify -> parse", () => {
  it("Fact (observed)", () => roundtrip(Fact, observedFact));
  it("Fact (derived)", () => roundtrip(Fact, derivedFact));
  it("Fact (collection, v2.3)", () => roundtrip(Fact, collectionFact));
  it("Intent", () => roundtrip(Intent, intent));
  it("BatchIntent", () => roundtrip(BatchIntent, batchIntent));
  it("Receipt", () => roundtrip(Receipt, receipt));
  it("ToolManifest", () => roundtrip(ToolManifest, toolManifest));

  for (const evt of events) {
    it(`HarnessEvent: ${evt.t}`, () => roundtrip(HarnessEvent, evt));
  }
});
