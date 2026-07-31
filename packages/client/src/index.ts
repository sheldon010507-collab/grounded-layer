import type {
  ConfirmationDecisionDraft,
  ConfirmationEnvelope,
  GroundedConfirmResult,
  GroundedSubmitResult,
  ProposedBinding,
} from "@grounded/protocol";

export interface CreateRunInput {
  goal?: string;
}

export interface ObservedFactInput {
  key: string;
  value: string | number | boolean | null | unknown[];
  riskClass: "low" | "normal" | "high" | "critical";
  entityRef?: string;
  source: { system: string; retrievedAt: string };
}

export interface SubmitIntentInput {
  toolRef: string;
  bindings: ProposedBinding[];
  proposedBy?: "model" | "user" | "sop";
}

export interface RuntimeRun {
  runId: string;
  status: "running" | "suspended" | "completed" | "failed";
  goal?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RunDetail {
  run: RuntimeRun;
  events: Array<{
    seq?: number;
    at?: string;
    actor?: string;
    event: { t: string; [key: string]: unknown };
  }>;
}

export interface GroundedClientOptions {
  baseUrl: string;
  accessToken?: string;
  getAccessToken?: () => string | undefined | Promise<string | undefined>;
  fetch?: typeof globalThis.fetch;
}

export class GroundedHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(`Grounded runtime returned HTTP ${status}`);
    this.name = "GroundedHttpError";
  }
}

export class GroundedClient {
  private readonly baseUrl: string;
  private readonly accessToken?: string;
  private readonly getAccessToken?: GroundedClientOptions["getAccessToken"];
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(options: GroundedClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.accessToken = options.accessToken;
    this.getAccessToken = options.getAccessToken;
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    if (!this.fetchImpl)
      throw new Error("global fetch is unavailable; pass fetch in GroundedClientOptions");
  }

  async createRun(
    input: CreateRunInput = {},
  ): Promise<{ runId: string; status: RuntimeRun["status"] }> {
    return this.request("/runs", { method: "POST", body: input });
  }

  async observeFact(
    runId: string,
    input: ObservedFactInput,
  ): Promise<{ fact: Record<string, unknown> }> {
    return this.request(`/runs/${encodeURIComponent(runId)}/facts`, {
      method: "POST",
      body: input,
    });
  }

  async submitIntent(runId: string, input: SubmitIntentInput): Promise<GroundedSubmitResult> {
    return this.request(`/runs/${encodeURIComponent(runId)}/intents`, {
      method: "POST",
      body: input,
    });
  }

  async listConfirmations(runId: string): Promise<{ confirmations: ConfirmationEnvelope[] }> {
    return this.request(`/runs/${encodeURIComponent(runId)}/confirmations`);
  }

  async getConfirmation(
    runId: string,
    intentId: string,
  ): Promise<ConfirmationEnvelope | GroundedConfirmResult> {
    return this.request(
      `/runs/${encodeURIComponent(runId)}/intents/${encodeURIComponent(intentId)}/confirmation`,
    );
  }

  async decide(runId: string, draft: ConfirmationDecisionDraft): Promise<GroundedConfirmResult> {
    return this.request(`/runs/${encodeURIComponent(runId)}/decide`, {
      method: "POST",
      body: draft,
    });
  }

  async reissue(
    runId: string,
    intentId: string,
  ): Promise<ConfirmationEnvelope | GroundedConfirmResult> {
    return this.request(
      `/runs/${encodeURIComponent(runId)}/intents/${encodeURIComponent(intentId)}/reissue`,
      { method: "POST", body: {} },
    );
  }

  async getRun(runId: string): Promise<RunDetail> {
    return this.request(`/runs/${encodeURIComponent(runId)}`);
  }

  async listRuns(status?: RuntimeRun["status"]): Promise<RuntimeRun[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request(`/runs${query}`);
  }

  async finishRun(
    runId: string,
    outcome: { outcome: "completed" } | { outcome: "failed"; reason: string },
  ): Promise<{ runId: string; status: "completed" | "failed" }> {
    return this.request(`/runs/${encodeURIComponent(runId)}/finish`, {
      method: "POST",
      body: outcome,
    });
  }

  streamUrl(runId: string): string {
    return `${this.baseUrl}/runs/${encodeURIComponent(runId)}/stream`;
  }

  private async request<T>(
    path: string,
    init: { method?: string; body?: unknown } = {},
  ): Promise<T> {
    const token = this.getAccessToken ? await this.getAccessToken() : this.accessToken;
    const headers = new Headers({ accept: "application/json" });
    if (init.body !== undefined) headers.set("content-type", "application/json");
    if (token) headers.set("authorization", `Bearer ${token}`);

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const payload = await response.json().catch(() => undefined);
    if (!response.ok) throw new GroundedHttpError(response.status, payload);
    return payload as T;
  }
}
