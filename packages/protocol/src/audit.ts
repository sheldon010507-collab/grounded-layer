import { z } from "zod";

// ── Audit ───────────────────────────────────────────
export const AuditFinding = z.object({
  claimText: z.string(), // 被检查的断言片段
  claimType: z.enum(["number", "currency", "datetime", "entity", "status_assertion"]),
  verdict: z.enum(["matched", "mismatch", "unsupported_inference"]),
  factId: z.string().optional(), // matched/mismatch 时指向比对的 Fact
  channel: z.enum(["chat", "voice"]),
});
export type AuditFinding = z.infer<typeof AuditFinding>;

// 【v2.3】一次模型输出的审计汇总(Part L.4.14):
// AuditRibbon 用 counts 显示覆盖率("3 项断言 · 2 项已核 · 1 项不可核");
// noCheckableClaims=true 时 UI 必须呈现灰态,禁止在无可核内容时显示全绿。
export const AuditSummary = z.object({
  outputRef: z.string(), // 对应哪一次模型输出
  counts: z.object({
    matched: z.number().int().nonnegative(),
    mismatch: z.number().int().nonnegative(),
    unsupported_inference: z.number().int().nonnegative(),
  }),
  noCheckableClaims: z.boolean(),
});
export type AuditSummary = z.infer<typeof AuditSummary>;
