import { z } from "zod";
import { ResolvedBinding } from "./fact.js";

export const Checkpoint = z.enum(["show", "notify", "confirm"]);
export type Checkpoint = z.infer<typeof Checkpoint>;

export const IntentStatus = z.enum([
  "proposed",
  "approved",
  "rejected",
  "revalidating",
  "stale",
  "executing",
  "settled", // settled 细节看 Receipt.status
]);
export type IntentStatus = z.infer<typeof IntentStatus>;

export const Intent = z.object({
  intentId: z.string().regex(/^int_[a-z0-9]{12}$/),
  runId: z.string(),
  planId: z.string().optional(),
  // 【v2.2】跨工具多步事务预留位;v0.x 仅分组(不做部分成功/补偿语义),
  // 诚实边界:1.0 前不定死这部分语义(Part M.1 §21)。
  toolRef: z.string(), // 必须存在于 Tool Registry
  args: z.array(ResolvedBinding),
  idempotencyKey: z.string(), // 创建时即分配,防重复执行
  proposedBy: z.enum(["model", "user", "sop"]),
  checkpoint: Checkpoint,
  status: IntentStatus,
  batchId: z.string().optional(), // 【v2.3】属于 BatchIntent 时非空
  version: z.number().int().nonnegative(),
  // 【v2.3】乐观并发(Part L.2.7):每次状态/参数变更 +1。
  // POST /decide 必须携带 expectedVersion,不符即 409 并回传最新状态——
  // 这是"decide 与后台 stale 标记竞态"被挡住的位置,而不是靠约定。
  requiresRatification: z.array(z.string()).optional(),
  // 【Week 4 补,C.4 升格路径的落点】哪些 param 当前绑的是 derived 候选、
  // The user branch is selected at approval time and records who decided it.
  // 写入;decide() approve 时必须把列出的每个 param 都转成 user 分支,否则 execute()
  // 拒绝执行(PolicyViolation)——这是"paramPolicy 终检"真正有牙齿的地方。
});
export type Intent = z.infer<typeof Intent>;

// ── BatchIntent(Part L.1.4,同构批量的一等公民)──────────
// 语义:一张确认卡;paramPolicy 标记的高危参数逐条全量展示、不可折叠;
// 用户可逐条剔除(剔除 = 对应子 Intent → rejected,各自发 user.decided);
// 子 Intent 各自执行、各自 Receipt。异构批量在协议层不存在——维持"确认级不可批量通过"的公理。
export const BatchIntent = z.object({
  batchId: z.string().regex(/^bat_[a-z0-9]{12}$/),
  runId: z.string(),
  toolRef: z.string(), // 同构 = 同一工具 + 同一参数模板
  templateDesc: z.string(), // 确认卡头部的人话说明,例如"给 12 位客户发账单提醒"
  itemIntentIds: z.array(z.string()).min(2),
  checkpoint: z.literal("confirm"), // 批量必 confirm
});
export type BatchIntent = z.infer<typeof BatchIntent>;
