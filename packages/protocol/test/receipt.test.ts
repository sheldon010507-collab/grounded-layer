import { describe, expect, it } from "vitest";
import { Receipt, receiptSigningPayload } from "../src/index.js";
import { receipt } from "./fixtures.js";

describe("Receipt", () => {
  it("parses a valid receipt", () => {
    expect(Receipt.parse(receipt)).toEqual(receipt);
  });

  it("accepts the pending/unknown states distinctly (Part L.1.3)", () => {
    expect(Receipt.parse({ ...receipt, status: "pending", signature: "s" }).status).toBe("pending");
    expect(Receipt.parse({ ...receipt, status: "unknown", signature: "s" }).status).toBe("unknown");
  });
});

describe("receiptSigningPayload (Part C.3, v2.3 errorCode)", () => {
  it("is deterministic for the same input", () => {
    const { signature, ...rest } = receipt;
    expect(receiptSigningPayload(rest)).toBe(receiptSigningPayload(rest));
  });

  it("changes when errorCode changes — failed receipts cannot have their error silently edited", () => {
    const { signature, ...rest } = receipt;
    const a = receiptSigningPayload({ ...rest, status: "failed", errorCode: "TIMEOUT" });
    const b = receiptSigningPayload({ ...rest, status: "failed", errorCode: "FATAL" });
    expect(a).not.toBe(b);
  });

  it("changes when any signed field changes", () => {
    const { signature, ...rest } = receipt;
    const base = receiptSigningPayload(rest);
    expect(receiptSigningPayload({ ...rest, externalRef: "msg_other" })).not.toBe(base);
    expect(receiptSigningPayload({ ...rest, rawHash: "sha256:other" })).not.toBe(base);
  });
});
