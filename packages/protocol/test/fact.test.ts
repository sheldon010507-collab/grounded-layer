import { describe, expect, it } from "vitest";
import { Fact, ResolvedBinding } from "../src/index.js";
import { collectionFact, derivedFact, now, observedFact } from "./fixtures.js";

describe("Fact hard rule: derived must declare derivedFrom", () => {
  it("accepts a valid derived fact", () => {
    expect(Fact.parse(derivedFact)).toEqual(derivedFact);
  });

  it("rejects derived without derivedFrom", () => {
    const bad = { ...derivedFact, derivedFrom: undefined };
    const result = Fact.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["derivedFrom"]);
    }
  });

  it("rejects derived with empty derivedFrom array", () => {
    const bad = { ...derivedFact, derivedFrom: [] };
    expect(Fact.safeParse(bad).success).toBe(false);
  });

  it("does not require derivedFrom for observed facts", () => {
    expect(Fact.parse(observedFact)).toEqual(observedFact);
  });
});

describe("Fact: id format", () => {
  it("rejects malformed ids", () => {
    const bad = { ...observedFact, id: "not-a-fact-id" };
    expect(Fact.safeParse(bad).success).toBe(false);
  });
});

describe("Fact: 集合 Fact(v2.3)", () => {
  it("accepts an array value with itemSchema", () => {
    expect(Fact.parse(collectionFact)).toEqual(collectionFact);
  });
});

describe("ResolvedBinding: model has no raw-value write path", () => {
  it("accepts a fact binding", () => {
    const b = { type: "fact" as const, param: "to", factId: observedFact.id };
    expect(ResolvedBinding.parse(b)).toEqual(b);
  });

  it("requires decidedBy on the user branch", () => {
    const bad = { type: "user", param: "to", userValue: "x@example.com" };
    expect(ResolvedBinding.safeParse(bad).success).toBe(false);
  });

  it("rejects a third, direct-value branch (no bare literal path exists)", () => {
    const bad = { type: "literal", param: "to", value: "x@example.com" };
    expect(ResolvedBinding.safeParse(bad).success).toBe(false);
  });
});

void now;
