# @grounded/protocol

The protocol package is the public, implementation-neutral contract for grounded agent actions. It exports Zod schemas and TypeScript types for facts, intents, bindings, receipts, run events, confirmation envelopes, and compiled UI blocks.

It also includes generated JSON Schema files under `schemas/` for consumers that do not use TypeScript.

## Design rules

- A fact records what was observed, where it came from, and when it was observed.
- A binding refers to a semantic fact key or an explicit user value; it is not a free-form model assertion.
- A receipt distinguishes `confirmed`, `failed`, `unknown`, and `pending`. Consumers must preserve those distinctions.
- A confirmation envelope is an input to a UI. It is not permission to execute an action; the runtime that issued it remains responsible for authorization and execution.

## Build and test

```bash
pnpm --filter @grounded/protocol build
pnpm --filter @grounded/protocol typecheck
pnpm --filter @grounded/protocol test
```

The package is currently a release candidate. Breaking protocol changes will use a major version once the stable line is released.
