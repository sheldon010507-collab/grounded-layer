"use client";

import type {
  CompiledActionArg,
  ConfirmationDecisionDraft,
  ConfirmationEdit,
  ConfirmationEnvelope,
  ConfirmationScalar,
} from "@grounded/protocol";
import { useState } from "react";
import { FactBadge } from "./FactBadge.js";
import { type RendererLocale, formatFactValue } from "./format.js";

export interface BoundActionConfirmationCardProps {
  /** 服务端签发的确认信封(`issueConfirmation`/`submitIntent` 的 `awaiting_confirmation`
   * 分支)——这里只做展示 + 编辑,不做任何 grounding/签名校验(校验在服务端,校验失败会让
   * `onDecide` 的调用方收到 `rejected`)。 */
  envelope: ConfirmationEnvelope;
  /** 客户端只回传 `confirmationToken` + 决定本身——绝不重新提交 FactId 或整套绑定,
   * 这是 ConfirmationEnvelope 协议(grounded.confirmation.v1)的核心约束。 */
  onDecide: (draft: ConfirmationDecisionDraft) => void | Promise<void>;
  /** 调用方从 decide 的返回结果里收到 conflict/not_pending/stale 时置为 true——卡片
   * 停止接受确认/拒绝,只显示"已过期"提示 + 一个重新拉取入口,不允许对着一张作废的卡片
   * 继续点确认。 */
  expired?: boolean;
  onRefetch?: () => void;
  disabled?: boolean;
  locale?: RendererLocale;
}

function initialValue(arg: CompiledActionArg): ConfirmationScalar | undefined {
  if (arg.binding.type === "user") return arg.binding.userValue as ConfirmationScalar;
  if (!arg.editable) return undefined; // 复杂值只读,没有"初始可编辑值"这个概念
  if (arg.fact) return arg.fact.value as ConfirmationScalar;
  return undefined;
}

function EditableValueInput({
  arg,
  value,
  disabled,
  onChange,
}: {
  arg: CompiledActionArg;
  value: ConfirmationScalar;
  disabled?: boolean;
  onChange: (value: ConfirmationScalar) => void;
}) {
  const inputStyle = {
    backgroundColor: "var(--grounded-surface-2)",
    borderColor: "var(--grounded-border)",
    borderWidth: 1,
    borderStyle: "solid",
    color: "var(--grounded-text)",
  } as const;

  if (arg.valueType === "boolean") {
    return (
      <input
        type="checkbox"
        checked={value === true}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  }
  if (arg.valueType === "number") {
    return (
      <input
        type="number"
        value={typeof value === "number" ? value : ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        className="rounded px-2 py-1 text-sm"
        style={inputStyle}
      />
    );
  }
  // string / null:都用文本框——null 没有专门的编辑控件,编辑后自然变成一个字符串,
  // 这是 v1 的简化(ConfirmationScalar 允许 null,但"编辑成另一个 null"没有意义)。
  return (
    <input
      type="text"
      value={typeof value === "string" ? value : String(value ?? "")}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="rounded px-2 py-1 text-sm"
      style={inputStyle}
    />
  );
}

/**
 * ConfirmationEnvelope → 确认/编辑/拒绝(取代旧的 `ActionConfirmationCard` 作为执行
 * 集成入口——那个组件保留为低层展示组件,标记 deprecated,见其文件头注释)。
 *
 * 关键行为(§3.1):
 * - 初始显示值直接来自 envelope.card(user 分支用 binding.userValue,不默认空字符串);
 * - 标量给类型正确的编辑控件,复杂值只读;
 * - 只有值真的被改过才发 `decision:"edit"`,没有任何改动发 `decision:"approve"`——
 *   不能把"什么都没编辑"也包装成一个空的 edit 数组(协议要求 edits 至少一项)。
 * - 点击后立即通过父组件传入的 `disabled` 防双击;`expired` 时整卡冻结,只剩"重新拉取"。
 */
export function BoundActionConfirmationCard({
  envelope,
  onDecide,
  expired,
  onRefetch,
  disabled,
  locale = "zh",
}: BoundActionConfirmationCardProps) {
  const { card } = envelope;
  const [edited, setEdited] = useState<Record<string, ConfirmationScalar>>({});
  const ratificationSet = new Set(card.requiresRatification ?? []);

  // 置顶:待核定的参数排最前面,跟旧 ActionConfirmationCard 的规则一致。
  const sorted = [...card.args].sort((a, b) => {
    const aRank = ratificationSet.has(a.param) ? 0 : 1;
    const bRank = ratificationSet.has(b.param) ? 0 : 1;
    return aRank - bRank;
  });

  function currentValue(arg: CompiledActionArg): ConfirmationScalar | undefined {
    return arg.param in edited ? edited[arg.param] : initialValue(arg);
  }

  function handleApprove() {
    const edits: ConfirmationEdit[] = [];
    for (const arg of card.args) {
      if (!(arg.param in edited)) continue;
      const initial = initialValue(arg);
      const next = edited[arg.param];
      if (next !== initial && next !== undefined) edits.push({ param: arg.param, value: next });
    }
    if (edits.length > 0) {
      const [first, ...rest] = edits;
      if (first)
        void onDecide({
          confirmationToken: envelope.confirmationToken,
          decision: "edit",
          edits: [first, ...rest],
        });
      return;
    }
    void onDecide({ confirmationToken: envelope.confirmationToken, decision: "approve" });
  }

  function handleReject() {
    void onDecide({ confirmationToken: envelope.confirmationToken, decision: "reject" });
  }

  const frozen = disabled || expired;

  return (
    <div
      className="flex flex-col gap-3 rounded-lg p-3"
      style={{
        backgroundColor: "var(--grounded-surface)",
        borderColor: expired ? "var(--grounded-status-unknown-border)" : "var(--grounded-border)",
        borderWidth: 1,
        borderStyle: "solid",
        color: "var(--grounded-text)",
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{card.toolTitle}</h3>
        <span className="text-xs" style={{ color: "var(--grounded-text-muted)" }}>
          {expired
            ? locale === "en"
              ? "Expired"
              : "已过期"
            : locale === "en"
              ? "Needs review"
              : "需要确认"}
        </span>
      </div>

      {expired && (
        <p className="text-xs" style={{ color: "var(--grounded-status-unknown-text)" }}>
          {locale === "en"
            ? "This confirmation is no longer valid. The action may have been decided elsewhere, or its bound facts changed. Refresh to load the latest state."
            : "这份确认已经不再有效(可能已经被别处决定,或绑定的值发生了变化)——请重新拉取最新状态。"}
        </p>
      )}

      <dl className="flex flex-col gap-2">
        {sorted.map((arg) => {
          const pinned = ratificationSet.has(arg.param);
          const value = currentValue(arg);
          return (
            <div
              key={arg.param}
              className="flex flex-col gap-1 rounded p-2"
              style={
                pinned
                  ? {
                      backgroundColor: "var(--grounded-derived-bg)",
                      borderColor: "var(--grounded-derived-border)",
                      borderWidth: 1,
                      borderStyle: "solid",
                    }
                  : undefined
              }
            >
              <div className="flex items-center justify-between gap-2">
                <dt
                  className={pinned ? "text-xs font-bold" : "text-xs"}
                  style={{
                    color: pinned ? "var(--grounded-derived-text)" : "var(--grounded-text-muted)",
                  }}
                >
                  {arg.label}
                  {pinned &&
                    (locale === "en"
                      ? " · Extracted from your message · Review"
                      : " · 从你的消息提取 · 请核对")}
                </dt>
                {arg.fact && <FactBadge fact={arg.fact} locale={locale} />}
                {!arg.fact && arg.binding.type === "user" && (
                  <span className="text-xs" style={{ color: "var(--grounded-text-muted)" }}>
                    {locale === "en" ? "User input" : "用户输入"}
                  </span>
                )}
              </div>

              {arg.editable ? (
                <EditableValueInput
                  arg={arg}
                  value={value ?? null}
                  disabled={frozen}
                  onChange={(next) => setEdited((prev) => ({ ...prev, [arg.param]: next }))}
                />
              ) : (
                <dd className="text-sm">
                  {arg.fact
                    ? formatFactValue(arg.fact, "plain", locale)
                    : locale === "en"
                      ? "(complex value)"
                      : "(复杂值)"}
                </dd>
              )}
            </div>
          );
        })}
      </dl>

      {expired ? (
        <button
          type="button"
          onClick={() => onRefetch?.()}
          className="rounded px-3 py-1.5 text-sm font-semibold"
          style={{
            backgroundColor: "var(--grounded-status-confirmed-bg)",
            borderColor: "var(--grounded-status-confirmed-border)",
            borderWidth: 1,
            borderStyle: "solid",
            color: "var(--grounded-status-confirmed-text)",
          }}
        >
          {locale === "en" ? "Refresh" : "重新拉取"}
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={frozen}
            onClick={handleApprove}
            className="flex-1 rounded px-3 py-1.5 text-sm font-semibold"
            style={{
              backgroundColor: "var(--grounded-status-confirmed-bg)",
              borderColor: "var(--grounded-status-confirmed-border)",
              borderWidth: 1,
              borderStyle: "solid",
              color: "var(--grounded-status-confirmed-text)",
            }}
          >
            {locale === "en" ? "Approve" : "确认"}
          </button>
          <button
            type="button"
            disabled={frozen}
            onClick={handleReject}
            className="flex-1 rounded px-3 py-1.5 text-sm"
            style={{
              backgroundColor: "var(--grounded-surface-2)",
              borderColor: "var(--grounded-border)",
              borderWidth: 1,
              borderStyle: "solid",
              color: "var(--grounded-text-muted)",
            }}
          >
            {locale === "en" ? "Reject" : "拒绝"}
          </button>
        </div>
      )}
    </div>
  );
}
