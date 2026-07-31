"use client";

import type { Receipt } from "@grounded/protocol";

export interface ReceiptCardProps {
  receipt: Receipt;
  toolTitle?: string;
  /** failed 状态才展示——同一个 idempotencyKey 重试,不是新建 Intent。 */
  onRetry?: () => void;
  /** unknown 状态才展示——只读查证,Part L.2.6:永不自动重试 unknown。 */
  onCheckStatus?: () => void;
}

interface StatusStyle {
  icon: string;
  label: string;
  bg: string;
  border: string;
  text: string;
}

const STATUS_STYLE: Record<Receipt["status"], StatusStyle> = {
  confirmed: {
    icon: "✓",
    label: "已完成",
    bg: "var(--grounded-status-confirmed-bg)",
    border: "var(--grounded-status-confirmed-border)",
    text: "var(--grounded-status-confirmed-text)",
  },
  failed: {
    icon: "✗",
    label: "失败",
    bg: "var(--grounded-status-failed-bg)",
    border: "var(--grounded-status-failed-border)",
    text: "var(--grounded-status-failed-text)",
  },
  unknown: {
    icon: "⚠",
    label: "已发出未确认",
    bg: "var(--grounded-status-unknown-bg)",
    border: "var(--grounded-status-unknown-border)",
    text: "var(--grounded-status-unknown-text)",
  },
  pending: {
    icon: "…",
    label: "处理中",
    bg: "var(--grounded-status-pending-bg)",
    border: "var(--grounded-status-pending-border)",
    text: "var(--grounded-status-pending-text)",
  },
};

/** ✓/✗/⚠ + externalRef + 重试(failed)/查状态(unknown)——Part E.9。 */
export function ReceiptCard({ receipt, toolTitle, onRetry, onCheckStatus }: ReceiptCardProps) {
  const style = STATUS_STYLE[receipt.status];

  return (
    <div
      className="flex flex-col gap-2 rounded-lg p-3"
      style={{
        backgroundColor: "var(--grounded-surface)",
        borderColor: "var(--grounded-border)",
        borderWidth: 1,
        borderStyle: "solid",
        color: "var(--grounded-text)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold"
          style={{
            backgroundColor: style.bg,
            borderColor: style.border,
            borderWidth: 1,
            borderStyle: "solid",
            color: style.text,
          }}
        >
          {style.icon}
        </span>
        <span className="text-sm font-semibold">{toolTitle ?? receipt.intentId}</span>
        <span className="text-xs" style={{ color: style.text }}>
          {style.label}
        </span>
      </div>

      <dl
        className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs"
        style={{ color: "var(--grounded-text-muted)" }}
      >
        {receipt.externalRef && (
          <>
            <dt>凭证号</dt>
            <dd className="font-mono">{receipt.externalRef}</dd>
          </>
        )}
        {receipt.errorCode && (
          <>
            <dt>错误码</dt>
            <dd className="font-mono">{receipt.errorCode}</dd>
          </>
        )}
        <dt>时间</dt>
        <dd>{receipt.recordedAt}</dd>
      </dl>

      {receipt.status === "failed" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="self-start rounded px-3 py-1 text-xs"
          style={{
            backgroundColor: style.bg,
            borderColor: style.border,
            borderWidth: 1,
            borderStyle: "solid",
            color: style.text,
          }}
        >
          重试(同一操作,不是新请求)
        </button>
      )}
      {receipt.status === "unknown" && onCheckStatus && (
        <button
          type="button"
          onClick={onCheckStatus}
          className="self-start rounded px-3 py-1 text-xs"
          style={{
            backgroundColor: style.bg,
            borderColor: style.border,
            borderWidth: 1,
            borderStyle: "solid",
            color: style.text,
          }}
        >
          查状态(只读,不会重复执行)
        </button>
      )}
    </div>
  );
}
