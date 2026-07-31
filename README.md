# Grounded Layer

Grounded Layer is an open protocol for making agent actions reviewable before they run. It gives an application a small, inspectable envelope for facts, proposed actions, confirmation decisions, receipts, and run events.

This repository is the public protocol edition. It contains the wire types, JSON Schema artifacts, a React renderer for confirmation/receipt cards, an AG-UI event adapter, a small HTTP client, and protocol-level conformance checks.

## Ten-minute demo

```bash
pnpm install
pnpm dev:playground
```

Open the local URL printed by Vite. The playground uses local fixtures only: clicking a card changes the demo state and does not call a real tool or server.

## What is deliberately not here

The private core contains policy enforcement, trusted compilation, execution gates, connectors, benchmark suites, runtime deployment code, and business SOPs. The public packages do not require an MCP server, a hosted service, or a persistent database.

## Packages

| Package | Purpose |
| --- | --- |
| `@grounded/protocol` | Protocol types, Zod schemas, and generated JSON Schema |
| `@grounded/react-renderer` | Confirmation, fact, receipt, and stale-state React cards |
| `@grounded/agui-bridge` | Grounded run events to AG-UI event mapping |
| `@grounded/client` | Small HTTP client for a compatible runtime |
| `@grounded/conformance` | Protocol-level checks for a compatible runtime |

The protocol is intentionally implementation-neutral. A runtime can be written in any language; the conformance tool checks the public HTTP and event contract.

## Licensing

Code is Apache-2.0. The protocol specification in `docs/spec/` is CC BY 4.0. Grounded Layer and related names are trademarks of their respective owner; see `TRADEMARK.md`.

## Status

The public packages are a beta protocol release (`1.0.0-rc.0` for the protocol package). The schema is versioned and changes are documented before a stable release.

## Publishing

Tagged releases use npm trusted publishing (OIDC); no npm token is stored in GitHub. Before creating the first tag, the package owners must configure the five `@grounded/*` packages and their GitHub workflow as trusted publishers in npm. If the scope is not available to the owner, choose a different public scope before tagging.
