import { z } from "zod";

// ── Receipt ─────────────────────────────────────────
// "成功"的唯一合法来源。kind:"receipt" 的 Fact 只能由 tool-wrapper 从这个类型的响应构造(见 fact-core)。
export const ReceiptStatus = z.enum(["confirmed", "failed", "unknown", "pending"]);
export type ReceiptStatus = z.infer<typeof ReceiptStatus>;
// unknown = 请求已发出但未收到确认(超时/断连)。必须如实呈现,禁止猜测,且永不自动重试。
// pending = 已知在途(webhook/poll 待结算),与 unknown(失联)严格区分。

export const Receipt = z.object({
  intentId: z.string(),
  status: ReceiptStatus,
  externalRef: z.string().optional(), // messageId / orderId / transactionId
  errorCode: z.string().optional(),
  rawHash: z.string(), // SHA-256(原始响应);原文另表存储 + 脱敏钩子(见 Part G.2)
  recordedAt: z.string().datetime(),
  signature: z.string(), // HMAC-SHA256,见下方 receiptSigningPayload
});
export type Receipt = z.infer<typeof Receipt>;

/**
 * Part C.3 签名的规范载荷构造器(纯函数,零密钥依赖)。
 *
 * 协议包只定义"签什么"——canonical payload 的字段顺序与拼接方式,
 * 保证签名方与验签方(例如 react-renderer,
 * 通常在浏览器用 Web Crypto SubtleCrypto)对同一个 Receipt 算出完全相同的待签字符串。
 * 实际 HMAC-SHA256 签名/验签(需要密钥材料)属于 tool-wrapper 的职责,不在本包实现。
 *
 * 【v2.3】errorCode 现已入载荷:failed 回执的错误码同样不可被篡改。
 */
export function receiptSigningPayload(input: Omit<Receipt, "signature">): string {
  return [
    input.intentId,
    input.status,
    input.externalRef ?? "",
    input.errorCode ?? "",
    input.rawHash,
    input.recordedAt,
  ].join("|");
}
