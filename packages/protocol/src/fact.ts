import { z } from "zod";

// ── Fact ────────────────────────────────────────────
// 公理一(模型只能提议,不能断言)的类型层落点:见 Part C.2 三条硬规则。
export const FactSource = z.object({
  system: z.string(), // "tenant_hours_api"
  recordId: z.string().optional(),
  field: z.string().optional(),
  retrievedAt: z.string().datetime(),
});
export type FactSource = z.infer<typeof FactSource>;

export const FactKind = z.enum(["observed", "derived", "receipt"]);
export type FactKind = z.infer<typeof FactKind>;
// observed = 从外部系统查到的
// derived  = 由其他 Fact 推导得出(必须填 derivedFrom);值由模型给出、仅声明依据、未经验证 ——
//            UI 必须用独立徽章呈现"模型推导 · 未验证"(不与 observed 同色,见 react-renderer)
// receipt = an execution receipt produced by the runtime's trusted adapter.

export const RiskClass = z.enum(["low", "normal", "high"]);
export type RiskClass = z.infer<typeof RiskClass>;
// high:金额、时间、库存、可用性、地址、状态——语音层必须走模板(v0.3)

export const Fact = z
  .object({
    id: z.string().regex(/^fact_[a-z0-9]{12}$/),
    runId: z.string(),
    key: z.string(), // 语义键:"closing_time" / "room.price";可用命名空间
    entityRef: z.string().optional(),
    // 【v2.2/v2.3】多实体作用域,例如 "room:1204"。
    // 解析唯一性单位 = (key, entityRef);同 key 多 entityRef 且绑定未指明 → 解析歧义,
    // A runtime must reject ambiguous keys instead of silently choosing one.
    value: z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.unknown())]),
    // 【v2.3】数组分支 = 集合 Fact(Part L.1.5):整体单来源单 etag;
    // 仅入选某个 Intent 的条目在绑定时拆成独立 Fact(带 derivedFrom 指回集合)。
    itemSchema: z.record(z.unknown()).optional(), // 集合 Fact 的条目 JSON Schema
    unit: z.string().optional(), // "GBP" / "minutes"
    kind: FactKind,
    derivedFrom: z.array(z.string()).optional(), // derived 类强制非空;形成可回溯的推导链
    riskClass: RiskClass,
    source: FactSource,
    observedAt: z.string().datetime(),
    expiresAt: z.string().datetime().optional(), // 过期后 UI 自动降级为 stale
    etag: z.string().optional(), // used by a runtime to compare a revalidation result
    supersededBy: z.string().optional(), // 新值出现时旧 Fact 只标记,不删除(append-only)
  })
  .refine((f) => f.kind !== "derived" || (f.derivedFrom?.length ?? 0) > 0, {
    message: "derived fact must declare derivedFrom",
    path: ["derivedFrom"],
  });
export type Fact = z.infer<typeof Fact>;

// ── Binding ─────────────────────────────────────────
// 模型唯一可写的绑定形态:语义键,不含任何裸值、不含 factId(模型记不住 ID,也拿不到写入执行值的路径)。
export const ProposedBinding = z.object({
  param: z.string(),
  factKey: z.string(),
  entityRef: z.string().optional(), // 多实体时必填,否则解析歧义即结构化报错(不猜)
});
export type ProposedBinding = z.infer<typeof ProposedBinding>;

// runtime 固化后的绑定(存储与执行以此为准)。
// "user" 分支只能由 runtime 从 /decide 的 editedArgs、表单卡片提交、或 C.4 升格路径构造——模型无此写入路径。
export const ResolvedBinding = z.discriminatedUnion("type", [
  z.object({ type: z.literal("fact"), param: z.string(), factId: z.string() }),
  z.object({
    type: z.literal("user"),
    param: z.string(),
    userValue: z.unknown(),
    decidedBy: z.string(), // 【v2.2】录入者身份,审计必需
  }),
]);
export type ResolvedBinding = z.infer<typeof ResolvedBinding>;
