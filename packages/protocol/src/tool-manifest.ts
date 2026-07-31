import { z } from "zod";

// ── Tool Manifest ───────────────────────────────────
// Risk attributes are declared when a tool is integrated, not inferred from model output.
export const ToolManifest = z.object({
  ref: z.string(), // "gmail.send"
  title: z.string(),
  inputSchema: z.record(z.unknown()), // JSON Schema
  reversibility: z.enum(["reversible", "compensatable", "irreversible"]),
  externality: z.enum(["internal", "external"]),
  producesReceipt: z.boolean(),
  paramPolicy: z
    .record(
      z.object({
        // 高危参数(收件人/金额/账号):允许绑定的 Fact 种类。
        // 禁止 "derived" = 封堵洗值(模型无法把自己编的值伪装成可信输入)。
        allowKinds: z.array(z.enum(["observed", "receipt", "user"])),
      }),
    )
    .default({}),
  revalidate: z
    .object({
      toolRef: z.string(), // 用哪个查询工具重查
      compareKeys: z.array(z.string()), // 比对哪些 Fact key(或 etag)
      compare: z
        .record(
          z.enum([
            "exact", // 严格相等(默认)
            "numeric_tolerance", // 数值容差(浮点/汇率精度)
            "time_tolerance", // 时间归一后比对(格式化差异)
            "etag", // 只比 etag,不比值
          ]),
        )
        .default({}), // 【v2.2】逐 key 比对策略,防假阳性;无 etag 的真实 API 是常态,不得假设
      maxAgeMs: z.number(), // Fact 超龄即强制重查
    })
    .nullable(), // 显式声明"此工具无需重验"(null),不是省略字段
  providerIdempotencySupport: z.boolean(),
  // true  = 外部系统原生支持透传 idempotencyKey,可安全自动重试
  // false = guard-only:unknown/failed 后禁止自动重试,仅只读查证(Part L.2.6)
  conditionalExecution: z.boolean(), // 执行请求可携带 etag/If-Match(把 TOCTOU 残余风险转移给外部系统层)
  settlement: z.enum(["sync", "webhook", "poll"]).default("sync"),
  ap2: z.boolean().default(false), // 支付类工具走 AP2 适配路径,不自造支付回执
});
export type ToolManifest = z.infer<typeof ToolManifest>;
