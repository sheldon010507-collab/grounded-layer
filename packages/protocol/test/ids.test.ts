import { describe, expect, it } from "vitest";
import { newBatchId, newFactId, newIntentId, newOpaqueId } from "../src/index.js";
import { BatchIntent, Fact, Intent } from "../src/index.js";

describe("id generators match their schema's regex", () => {
  it("newFactId matches Fact.id", () => {
    for (let i = 0; i < 20; i++) {
      expect(newFactId()).toMatch(/^fact_[a-z0-9]{12}$/);
    }
  });

  it("newIntentId matches Intent.intentId", () => {
    for (let i = 0; i < 20; i++) {
      expect(newIntentId()).toMatch(/^int_[a-z0-9]{12}$/);
    }
  });

  it("newBatchId matches BatchIntent.batchId", () => {
    for (let i = 0; i < 20; i++) {
      expect(newBatchId()).toMatch(/^bat_[a-z0-9]{12}$/);
    }
  });

  it("generated ids are unique across many calls", () => {
    const ids = new Set(Array.from({ length: 500 }, () => newFactId()));
    expect(ids.size).toBe(500);
  });

  it("newOpaqueId prefixes arbitrary identifiers (runId, idempotencyKey, ...)", () => {
    expect(newOpaqueId("run")).toMatch(/^run_[a-z0-9]{16}$/);
  });
});

// 引用 Fact/Intent/BatchIntent 只是为了让本文件的用途读起来自洽(生成的 ID 实际喂给谁),
// 不做额外断言 —— schema 层面的校验已在各自的 test 文件里。
void Fact;
void Intent;
void BatchIntent;
