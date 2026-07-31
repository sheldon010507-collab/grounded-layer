"use client";

import type { Fact } from "@grounded/protocol";
import { FactBadge } from "./FactBadge.js";
import { type FactFormat, type RendererLocale, formatFactValue } from "./format.js";

export interface StaleChange {
  label: string;
  oldFact: Fact;
  newFact: Fact;
  format?: FactFormat;
}

export interface StaleNoticeProps {
  toolTitle: string;
  changes: StaleChange[];
  /** 用新值重新确认——旧 Intent 已作废,这通常意味着重新走一遍 propose(Part B.2)。 */
  onReconfirm?: () => void;
  onCancel?: () => void;
  locale?: RendererLocale;
}

/**
 * 新旧值对比,要求重新确认(Part B.2:"stale 态,新旧值对比,要求重新确认;旧 Intent 作废")。
 * 复用 unknown 的琥珀色调——都是"结果不确定,需要人看一眼"这一类状态。
 */
export function StaleNotice({
  toolTitle,
  changes,
  onReconfirm,
  onCancel,
  locale = "zh",
}: StaleNoticeProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg p-3"
      style={{
        backgroundColor: "var(--grounded-surface)",
        borderColor: "var(--grounded-status-unknown-border)",
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
            backgroundColor: "var(--grounded-status-unknown-bg)",
            borderColor: "var(--grounded-status-unknown-border)",
            borderWidth: 1,
            borderStyle: "solid",
            color: "var(--grounded-status-unknown-text)",
          }}
        >
          ⚠
        </span>
        <h3 className="text-sm font-semibold">
          {toolTitle} · {locale === "en" ? "Data changed" : "数据已过期"}
        </h3>
      </div>
      <p className="text-xs" style={{ color: "var(--grounded-text-muted)" }}>
        {locale === "en"
          ? "These values changed after you reviewed the action. Check the new values before deciding whether to continue. The previous confirmation is no longer valid."
          : "你确认之后,下面这些值发生了变化——请核对新值再决定是否继续。这次确认已作废。"}
      </p>

      <dl className="flex flex-col gap-2">
        {changes.map((change) => (
          <div
            key={change.label}
            className="flex flex-col gap-1 rounded p-2"
            style={{ backgroundColor: "var(--grounded-surface-2)" }}
          >
            <dt className="text-xs" style={{ color: "var(--grounded-text-muted)" }}>
              {change.label}
            </dt>
            <dd className="flex flex-wrap items-center gap-2 text-sm">
              <span style={{ textDecoration: "line-through", color: "var(--grounded-text-muted)" }}>
                {formatFactValue(change.oldFact, change.format, locale)}
              </span>
              <FactBadge fact={change.oldFact} locale={locale} />
              <span aria-hidden="true">→</span>
              <span
                className="font-semibold"
                style={{ color: "var(--grounded-status-unknown-text)" }}
              >
                {formatFactValue(change.newFact, change.format, locale)}
              </span>
              <FactBadge fact={change.newFact} locale={locale} />
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onReconfirm?.()}
          className="flex-1 rounded px-3 py-1.5 text-sm font-semibold"
          style={{
            backgroundColor: "var(--grounded-status-confirmed-bg)",
            borderColor: "var(--grounded-status-confirmed-border)",
            borderWidth: 1,
            borderStyle: "solid",
            color: "var(--grounded-status-confirmed-text)",
          }}
        >
          {locale === "en" ? "Reconfirm with new values" : "用新值重新确认"}
        </button>
        <button
          type="button"
          onClick={() => onCancel?.()}
          className="flex-1 rounded px-3 py-1.5 text-sm"
          style={{
            backgroundColor: "var(--grounded-surface-2)",
            borderColor: "var(--grounded-border)",
            borderWidth: 1,
            borderStyle: "solid",
            color: "var(--grounded-text-muted)",
          }}
        >
          {locale === "en" ? "Cancel" : "取消"}
        </button>
      </div>
    </div>
  );
}
