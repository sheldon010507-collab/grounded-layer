# Contributing

The public repository accepts issues and documentation fixes while the protocol beta is stabilised. Please open an issue before starting a substantial change.

Until a contributor agreement is published, pull requests are reviewed case by case and must include a clear statement that the contribution is submitted under the repository's Apache-2.0 terms. Do not include private core code, customer data, credentials, or connector implementations.

Run the same checks as CI before submitting:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
