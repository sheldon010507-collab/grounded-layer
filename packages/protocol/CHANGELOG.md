# @grounded/protocol

## 1.0.0-rc.0

第 12 周(架构文档 Part I):API 冻结,`protocol` 率先进入 1.0-rc——这是全系统唯一的类型
与运行时校验来源,其他所有包都依赖它,协议破坏性变更即 major(Part C.1),先冻这个包
最先带来稳定性收益。

这不是 `changeset version` 算出来的常规 semver 差异,是手动设的里程碑版本号——第 12 周
的自查逐条核对了 `src/*.ts` 跟架构文档 Part C.2 定义的完整类型(`Fact`/`ProposedBinding`/
`ResolvedBinding`/`Intent`/`BatchIntent`/`Receipt`/`ToolManifest`/`HarnessEvent`/
`AuditFinding`/`AuditSummary`),字段对字段没有发现任何缺口或漂移;
`zod-to-json-schema` 产出的 18 个 JSON Schema 文件(`schemas/*.json`)也真的跑通了
（`pnpm --filter @grounded/protocol build`）。核对过程本身没有产生任何源码改动——
这次"冻结"确认的是现状已经是冻结态,不是靠这次改动才冻上的。

其余 8 个从 `0.0.1` 直接跳去 `0.1.0` 的包(见各自 CHANGELOG)是常规 `minor` bump(私有
→ 可发布),跟这里的 RC 里程碑不是同一类版本决策,故意分开处理。
