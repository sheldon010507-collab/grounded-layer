import { describe, expect, it } from "vitest";
import { BatchIntent, Intent } from "../src/index.js";
import { batchIntent, intent } from "./fixtures.js";

describe("Intent", () => {
  it("parses a valid intent", () => {
    expect(Intent.parse(intent)).toEqual(intent);
  });

  it("rejects malformed intentId", () => {
    expect(Intent.safeParse({ ...intent, intentId: "bad-id" }).success).toBe(false);
  });

  it("requires a nonnegative integer version (optimistic concurrency, Part L.2.7)", () => {
    expect(Intent.safeParse({ ...intent, version: -1 }).success).toBe(false);
    expect(Intent.safeParse({ ...intent, version: 1.5 }).success).toBe(false);
  });
});

describe("BatchIntent (Part L.1.4)", () => {
  it("parses a valid batch", () => {
    expect(BatchIntent.parse(batchIntent)).toEqual(batchIntent);
  });

  it("requires at least 2 items (a batch of one is not a batch)", () => {
    expect(BatchIntent.safeParse({ ...batchIntent, itemIntentIds: ["int_1"] }).success).toBe(false);
  });

  it("locks checkpoint to confirm — batches cannot be show/notify", () => {
    expect(BatchIntent.safeParse({ ...batchIntent, checkpoint: "show" }).success).toBe(false);
  });
});
