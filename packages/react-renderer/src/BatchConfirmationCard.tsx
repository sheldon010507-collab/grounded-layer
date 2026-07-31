"use client";

import { useState } from "react";
import type { ActionArgDisplay } from "./ActionConfirmationCard.js";
import { FactBadge } from "./FactBadge.js";
import { formatFactValue } from "./format.js";

export interface BatchItem {
  intentId: string;
  /** 这一条的人话标识,比如收件人名字——不是 intentId 本身。 */
  label: string;
  fields: ActionArgDisplay[];
}

export interface BatchConfirmationCardProps {
  toolTitle: string;
  /** 确认卡头部的人话说明,例如"给 12 位客户发账单提醒"(Part L.1.4)。 */
  templateDesc: string;
  items: BatchItem[];
  /** 同一批共用同一个 paramPolicy——待核定参数名对所有条目都一样。 */
  requiresRatification?: string[];
  /** 只传剩下没被剔除的 intentId——调用方对每一条分别调用 decide()。 */
  onApprove?: (remainingIntentIds: string[]) => void;
  onRejectAll?: () => void;
  disabled?: boolean;
}

/**
 * 同构批量的一张确认卡(Part L.1.4)。高危参数逐条全量展示、不可折叠;用户可逐条剔除
 * (剔除 = 那一条不在最终的 onApprove 名单里,调用方据此把对应 Intent 单独 reject);
 * 不存在"跳过逐条展示直接全部通过"的路径——确认按钮展示的是"剩下几条",不是"全部"。
 */
export function BatchConfirmationCard({
  toolTitle,
  templateDesc,
  items,
  requiresRatification,
  onApprove,
  onRejectAll,
  disabled,
}: BatchConfirmationCardProps) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const ratificationSet = new Set(requiresRatification ?? []);
  const remaining = items.filter((item) => !removedIds.has(item.intentId));

  return (
    <div
      className="flex flex-col gap-3 rounded-lg p-3"
      style={{
        backgroundColor: "var(--grounded-surface)",
        borderColor: "var(--grounded-border)",
        borderWidth: 1,
        borderStyle: "solid",
        color: "var(--grounded-text)",
      }}
    >
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{toolTitle}</h3>
          <span className="text-xs" style={{ color: "var(--grounded-text-muted)" }}>
            {remaining.length}/{items.length} 条
          </span>
        </div>
        <p className="text-xs" style={{ color: "var(--grounded-text-muted)" }}>
          {templateDesc}
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const isRemoved = removedIds.has(item.intentId);
          return (
            <li
              key={item.intentId}
              className="flex flex-col gap-1 rounded p-2"
              style={{
                backgroundColor: "var(--grounded-surface-2)",
                opacity: isRemoved ? 0.45 : 1,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.label}</span>
                {isRemoved ? (
                  <span className="text-xs" style={{ color: "var(--grounded-text-muted)" }}>
                    已剔除
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setRemovedIds((prev) => new Set(prev).add(item.intentId))}
                    className="text-xs underline"
                    style={{ color: "var(--grounded-status-failed-text)" }}
                  >
                    剔除这一条
                  </button>
                )}
              </div>

              {/* 高危参数逐条全量展示、不可折叠(Part L.1.4)——批量不是省略核对的理由。 */}
              <dl className="flex flex-col gap-1">
                {item.fields.map((field) => {
                  const pinned = ratificationSet.has(field.param);
                  return (
                    <div key={field.param} className="flex items-center justify-between gap-2">
                      <dt
                        className={pinned ? "text-xs font-bold" : "text-xs"}
                        style={{
                          color: pinned
                            ? "var(--grounded-derived-text)"
                            : "var(--grounded-text-muted)",
                        }}
                      >
                        {field.label}
                      </dt>
                      <dd className="flex items-center gap-1 text-xs">
                        <span>
                          {field.fact
                            ? formatFactValue(field.fact)
                            : field.binding.type === "user"
                              ? String(field.binding.userValue)
                              : ""}
                        </span>
                        {field.fact && <FactBadge fact={field.fact} />}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </li>
          );
        })}
      </ul>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled || remaining.length === 0}
          onClick={() => onApprove?.(remaining.map((item) => item.intentId))}
          className="flex-1 rounded px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
          style={{
            backgroundColor: "var(--grounded-status-confirmed-bg)",
            borderColor: "var(--grounded-status-confirmed-border)",
            borderWidth: 1,
            borderStyle: "solid",
            color: "var(--grounded-status-confirmed-text)",
          }}
        >
          确认剩下 {remaining.length} 条
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRejectAll?.()}
          className="flex-1 rounded px-3 py-1.5 text-sm"
          style={{
            backgroundColor: "var(--grounded-surface-2)",
            borderColor: "var(--grounded-border)",
            borderWidth: 1,
            borderStyle: "solid",
            color: "var(--grounded-text-muted)",
          }}
        >
          全部拒绝
        </button>
      </div>
    </div>
  );
}
