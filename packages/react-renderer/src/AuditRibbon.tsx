"use client";

import type { AuditFinding, AuditSummary } from "@grounded/protocol";

export interface AuditRibbonProps {
  summary: AuditSummary;
  /** 可选:非 matched 的逐条 finding——提供时在色带下方列出具体是哪句话、判成了什么。 */
  findings?: AuditFinding[];
}

const VERDICT_LABEL: Record<AuditFinding["verdict"], string> = {
  matched: "已核实一致",
  mismatch: "与事实不符",
  unsupported_inference: "无据可查",
};

/**
 * Part L.4.14:显示覆盖率("3 项断言 · 2 项已核 · 1 项不可核")。"已核" = matched+mismatch
 * (这两类都是"拿 Fact 比对过"的结果,区别只在比对是否一致);"不可核" = unsupported_inference
 * (没有对应 Fact/receipt,压根没法比对)。noCheckableClaims=true 时必须呈现灰态——
 * 不能让"这次回复没有可核实的具体断言"看起来像"全部核实通过"。
 */
export function AuditRibbon({ summary, findings }: AuditRibbonProps) {
  if (summary.noCheckableClaims) {
    return (
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
        style={{
          backgroundColor: "var(--grounded-status-gray-bg)",
          borderColor: "var(--grounded-status-gray-border)",
          borderWidth: 1,
          borderStyle: "solid",
          color: "var(--grounded-status-gray-text)",
        }}
      >
        <span aria-hidden="true">—</span>
        <span>这次回复没有可核实的具体断言</span>
      </div>
    );
  }

  const { matched, mismatch, unsupported_inference: unsupported } = summary.counts;
  const total = matched + mismatch + unsupported;
  const verified = matched + mismatch;

  // 有问题优先亮红,其次亮黄,都没有才亮绿——色带整体只给一种颜色,不做渐变混色。
  const toneKey = mismatch > 0 ? "failed" : unsupported > 0 ? "unknown" : "confirmed";

  const nonMatchedFindings = (findings ?? []).filter((f) => f.verdict !== "matched");

  return (
    <div
      className="flex flex-col gap-2 rounded-lg p-3"
      style={{
        backgroundColor: "var(--grounded-surface)",
        borderColor: `var(--grounded-status-${toneKey}-border)`,
        borderWidth: 1,
        borderStyle: "solid",
        color: "var(--grounded-text)",
      }}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          aria-hidden="true"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
          style={{
            backgroundColor: `var(--grounded-status-${toneKey}-bg)`,
            borderColor: `var(--grounded-status-${toneKey}-border)`,
            borderWidth: 1,
            borderStyle: "solid",
            color: `var(--grounded-status-${toneKey}-text)`,
          }}
        >
          {mismatch > 0 ? "✗" : unsupported > 0 ? "?" : "✓"}
        </span>
        <span style={{ color: "var(--grounded-text-muted)" }}>
          {total} 项断言 · {verified} 项已核 · {unsupported} 项不可核
        </span>
        {mismatch > 0 && (
          <span style={{ color: "var(--grounded-status-failed-text)" }}>{mismatch} 项不符</span>
        )}
      </div>

      {nonMatchedFindings.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs">
          {nonMatchedFindings.map((f) => (
            <li
              key={`${f.claimType}:${f.claimText}`}
              className="flex items-center gap-2 rounded px-2 py-1"
              style={{
                backgroundColor:
                  f.verdict === "mismatch"
                    ? "var(--grounded-status-failed-bg)"
                    : "var(--grounded-status-unknown-bg)",
                color:
                  f.verdict === "mismatch"
                    ? "var(--grounded-status-failed-text)"
                    : "var(--grounded-status-unknown-text)",
              }}
            >
              <span className="font-mono">“{f.claimText}”</span>
              <span style={{ color: "var(--grounded-text-muted)" }}>
                {VERDICT_LABEL[f.verdict]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
