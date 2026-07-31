# Grounded Layer

**A review-and-receipt protocol for AI agents that take real actions.**

[![CI](https://github.com/sheldon010507-collab/grounded-layer/actions/workflows/ci.yml/badge.svg)](https://github.com/sheldon010507-collab/grounded-layer/actions/workflows/ci.yml)
[![Status](https://img.shields.io/badge/status-beta-orange.svg)](#project-status)
[![Code license](https://img.shields.io/badge/code-Apache--2.0-blue.svg)](LICENSE)

**[Open the live playground](https://sheldon010507-collab.github.io/grounded-layer/)** · **[Browse preview releases](https://github.com/sheldon010507-collab/grounded-layer/releases)**

When an agent is connected to email, orders, bookings, payments, or any other external system, a chat transcript is not enough. The user needs to see the exact action before it runs. The application needs a machine-readable record of what happened afterward.

Grounded Layer defines that boundary.

It defines how an agent's proposed action is presented as a structured confirmation card, how an explicit **approve / edit / reject** decision is carried, and how the external result is represented as a receipt with an honest status: **confirmed, failed, unknown, or pending**.

It is not another agent framework. It does not plan tasks, route models, or force you to use MCP. It sits between **“the agent wants to act”** and **“your runtime is allowed to execute.”**

## The core flow

```text
Any model or agent
        |
        | proposes an action
        v
Your runtime issues a ConfirmationEnvelope
        |
        | rendered as an inspectable card
        v
Human approves, edits, or rejects
        |
        | your runtime validates and executes
        v
Receipt: confirmed | failed | unknown | pending
```

The public protocol gives each step a stable, inspectable shape. A compatible runtime remains responsible for authentication, authorization, policy enforcement, fact revalidation, tool execution, and receipt signing.

If the runtime discovers that a bound fact changed before execution, it can return a stale result and present the old and new values for confirmation again. The public renderer includes that stale-state UI; detecting the change is a runtime responsibility.

## What this makes visible

| Question | Grounded primitive |
| --- | --- |
| What is the agent trying to do? | Typed action and parameter bindings |
| What facts is it relying on? | Source-bearing observed or derived facts |
| What exactly did the human approve? | Versioned envelope, opaque confirmation token, and explicit decision |
| Did the external action really succeed? | Signed receipt shape with explicit outcome states |
| Did important data change before execution? | Stale result and old-versus-new notice |
| Does a runtime follow the public contract? | Protocol-level conformance checks |

This is especially useful when non-technical users work across different models or agents: the model can change, while the confirmation and receipt contract stays consistent.

## Try it now

The fastest way to understand Grounded Layer is the [live playground](https://sheldon010507-collab.github.io/grounded-layer/). It is a static, fixture-only demo: no server, MCP connection, credentials, or real tool execution is involved.

To run the same playground locally:

Requirements: Node.js 22.13+ and pnpm 11.5.2.

```bash
git clone https://github.com/sheldon010507-collab/grounded-layer.git
cd grounded-layer
pnpm install
pnpm build
pnpm dev:playground
```

Open the local URL printed by Vite. Approving, editing, or rejecting a card changes demo state; it does **not** call a real tool, model, or hosted service.

## React integration

The renderer consumes a server-issued `ConfirmationEnvelope`. Your application connects the decision callback to its own compatible runtime.

```tsx
import { BoundActionConfirmationCard } from "@grounded/react-renderer";

<BoundActionConfirmationCard
  envelope={confirmation}
  onDecide={sendDecisionToYourRuntime}
/>;
```

The browser sends the opaque confirmation token plus the user's decision. Trust decisions and execution stay on the server side.

## What ships in this repository

| Package | What it provides |
| --- | --- |
| `@grounded/protocol` | TypeScript types, Zod schemas, and generated JSON Schema |
| `@grounded/react-renderer` | Confirmation, fact, receipt, and stale-state React cards |
| `@grounded/agui-bridge` | Mapping from Grounded run events to AG-UI events |
| `@grounded/client` | A small HTTP client for a compatible runtime |
| `@grounded/conformance` | Protocol-level checks for a compatible runtime |

The contract is implementation-neutral. A runtime can be written in any language and can sit behind any model, agent framework, or orchestrator.

## What this repository does not claim to provide

This public edition is the integration surface, not a complete production execution engine. It does not include:

- hosted infrastructure or an MCP server;
- production policy and execution gates;
- trusted card compilation or fact revalidation services;
- business connectors, private SOP libraries, or deployment code;
- a guarantee that an arbitrary runtime or tool is secure.

Those concerns must be implemented by a compatible runtime. The private Grounded Layer core is where the reference implementation of these production concerns is developed.

## Project status

Grounded Layer is currently a **public beta preview**. The protocol package is versioned as `1.0.0-rc.0`. The public source, schemas, GitHub preview releases, and static playground are the supported distribution surface for this phase.

The npm distribution is intentionally deferred until there is a concrete need for package-manager installation. For now, contributors and adopters can clone the repository, run the playground, and integrate the public protocol and renderer source into their own runtime.

## License

Code is licensed under [Apache-2.0](LICENSE). The protocol specification in [`docs/spec/`](docs/spec/) is licensed under [CC BY 4.0](docs/spec/LICENSE). Grounded Layer and related names are trademarks of their respective owner; see [TRADEMARK.md](TRADEMARK.md).

If you are building an agent that can change something outside the chat window, Grounded Layer gives that action a place to be reviewed—and its outcome a place to be recorded.
