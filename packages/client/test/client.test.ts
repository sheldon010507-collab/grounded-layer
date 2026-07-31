import { describe, expect, it, vi } from "vitest";
import { GroundedClient, type GroundedHttpError } from "../src/index.js";

function response(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("GroundedClient", () => {
  it("calls the runtime over ordinary HTTP and sends only the decision payload", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response({ kind: "rejected", reason: "no" }));
    const client = new GroundedClient({
      baseUrl: "https://runtime.example/",
      accessToken: "token",
      fetch: fetchImpl,
    });

    await client.decide("run_A", { confirmationToken: "opaque", decision: "approve" });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://runtime.example/runs/run_A/decide",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ confirmationToken: "opaque", decision: "approve" }),
      }),
    );
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer token");
  });

  it("does not retry an error or unknown outcome", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response({ kind: "settled", receipt: { status: "unknown" } }));
    const client = new GroundedClient({ baseUrl: "http://localhost:1", fetch: fetchImpl });
    const result = await client.decide("run_A", {
      confirmationToken: "opaque",
      decision: "approve",
    });
    expect(result.kind).toBe("settled");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("exposes HTTP status and payload without converting server rejections into success", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response({ kind: "rejected", reason: "stale" }, 409));
    const client = new GroundedClient({ baseUrl: "http://localhost:1", fetch: fetchImpl });
    await expect(
      client.decide("run_A", { confirmationToken: "opaque", decision: "approve" }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<GroundedHttpError>>({
        status: 409,
        payload: { kind: "rejected", reason: "stale" },
      }),
    );
  });
});
