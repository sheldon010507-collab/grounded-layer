# @grounded/agui-bridge

## 0.1.0

### Minor Changes

- Mark these nine packages as publishable (removed `private: true`). They were all scaffolded
  private during initial development; `@grounded/protocol` was the only one ever unmarked,
  which was an oversight, not a deliberate "only protocol ships" decision — a consumer can't
  actually build anything on Grounded Layer with just the protocol types. `@grounded/langgraph-plugin`
  stays private: its `src/index.ts` is still a placeholder (`export {}`), the real
  `groundedNode`/`wrapTools` implementation was never built past the Week 3 go/no-go
  validation. `apps/*` and `examples/*` stay private — they're a demo app and example repos,
  not libraries.
