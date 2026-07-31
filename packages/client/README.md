# @grounded/client

Small, dependency-light HTTP client for a runtime that implements the public Grounded endpoints. It sends ordinary JSON over `fetch`; it does not start a server, require MCP, retry unknown outcomes, or execute tools locally.

```ts
import { GroundedClient } from "@grounded/client";

const client = new GroundedClient({ baseUrl: "https://your-runtime.example" });
const result = await client.decide("run_123", {
  confirmationToken: "token-from-the-envelope",
  decision: "approve",
});
```

Pass `accessToken` or `getAccessToken` when the runtime requires bearer authentication. The client preserves non-2xx responses as `GroundedHttpError` instead of turning them into success.
