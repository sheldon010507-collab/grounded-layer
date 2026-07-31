# @grounded/conformance

Protocol-level checks for a runtime that implements the public Grounded HTTP contract. The checks validate response envelopes, confirmation/decision schemas, and receipt status honesty. They do not inspect private policy code or business data.

```bash
grounded-conformance run \
  --target https://your-runtime.example \
  --scenario ./scenario.json \
  --out ./grounded-report.json
```

The scenario file contains the run/intent inputs and expected terminal status. Use this package as a lightweight contract harness in CI; it does not require an MCP server.
