import { describe, expect, it } from "vitest";
import { EventEnvelope, HarnessEvent } from "../src/index.js";
import { events, now, runCreatedEvent } from "./fixtures.js";

describe("HarnessEvent discriminated union", () => {
  it.each(events.map((e) => [e.t, e] as const))("parses %s", (_t, evt) => {
    expect(HarnessEvent.parse(evt)).toEqual(evt);
  });

  it("rejects an unknown event type", () => {
    expect(HarnessEvent.safeParse({ t: "made.up", runId: "run_1" }).success).toBe(false);
  });
});

describe("EventEnvelope", () => {
  it("wraps a HarnessEvent with actor/seq/at", () => {
    const envelope = {
      seq: 42,
      at: now,
      actor: "system" as const,
      event: runCreatedEvent,
    };
    expect(EventEnvelope.parse(envelope)).toEqual(envelope);
  });

  it("rejects a negative seq", () => {
    const envelope = { seq: -1, at: now, actor: "system", event: runCreatedEvent };
    expect(EventEnvelope.safeParse(envelope).success).toBe(false);
  });
});
