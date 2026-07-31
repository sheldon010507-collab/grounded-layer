"use client";

import type { Fact, ResolvedBinding } from "@grounded/protocol";
import { useState } from "react";
import { FactBadge } from "./FactBadge.js";
import { formatFactValue } from "./format.js";

export interface ActionArgDisplay {
  param: string;
  label: string;
  binding: ResolvedBinding;
  /** binding.type === "fact" 时,调用方解析好传进来——组件本身不做任何数据获取。 */
  fact?: Fact;
}

export interface ActionConfirmationCardProps {
  toolTitle: string;
  args: ActionArgDisplay[];
  /** C.4 升格路径:哪些 param 待核定(对应 Intent.requiresRatification)。 */
  requiresRatification?: string[];
  /** 调用方决定怎么把编辑过的值构造成 UserDecision.editedArgs——组件只回传"改了什么"。 */
  onApprove?: (editedValues: Record<string, string>) => void;
  onReject?: () => void;
  disabled?: boolean;
}

/**
 * 参数逐项来源 + 确认/编辑/拒绝(Part E.9)。待核定参数(C.4)永不截断、置顶、加粗
 * (Part L.4.13),标注"从你的消息提取 · 请核对"且可编辑;其余字段只读展示 + FactBadge。
 *
 * @deprecated 作为**执行集成入口**已被 `BoundActionConfirmationCard` 取代——那个组件
 * 消费服务端签发的 `ConfirmationEnvelope`(带 HMAC token,校验在服务端,客户端永不自己
 * 拼绑定回传),这个组件的 `onApprove(editedValues)` 把裸编辑值交还给调用方自己拼
 * `ResolvedBinding[]`,正是"客户端能自己拼绑定"这类漏洞的根源之一(见 action-guard 的
 * 安全修复记录)。仍可作为**纯展示**组件使用(不接执行动作,只是把 Intent 参数摆出来看),
 * 不要再接到任何会真的调 decide()/execute() 的路径上。
 */
export function ActionConfirmationCard({
  toolTitle,
  args,
  requiresRatification,
  onApprove,
  onReject,
  disabled,
}: ActionConfirmationCardProps) {
  const [edited, setEdited] = useState<Record<string, string>>({});
  const ratificationSet = new Set(requiresRatification ?? []);

  // 置顶:待核定的参数排最前面,不参与任何折叠/截断逻辑。
  const sorted = [...args].sort((a, b) => {
    const aRank = ratificationSet.has(a.param) ? 0 : 1;
    const bRank = ratificationSet.has(b.param) ? 0 : 1;
    return aRank - bRank;
  });

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
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{toolTitle}</h3>
        <span className="text-xs" style={{ color: "var(--grounded-text-muted)" }}>
          需要确认
        </span>
      </div>

      <dl className="flex flex-col gap-2">
        {sorted.map((field) => {
          const pinned = ratificationSet.has(field.param);
          return (
            <div
              key={field.param}
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
                  {field.label}
                  {pinned && " · 从你的消息提取 · 请核对"}
                </dt>
                {field.fact && <FactBadge fact={field.fact} />}
                {!field.fact && field.binding.type === "user" && (
                  <span className="text-xs" style={{ color: "var(--grounded-text-muted)" }}>
                    用户输入
                  </span>
                )}
              </div>

              {pinned ? (
                <input
                  type="text"
                  defaultValue={field.fact ? String(field.fact.value) : ""}
                  disabled={disabled}
                  onChange={(e) =>
                    setEdited((prev) => ({ ...prev, [field.param]: e.target.value }))
                  }
                  className="rounded px-2 py-1 text-sm"
                  style={{
                    backgroundColor: "var(--grounded-surface-2)",
                    borderColor: "var(--grounded-border)",
                    borderWidth: 1,
                    borderStyle: "solid",
                    color: "var(--grounded-text)",
                  }}
                />
              ) : (
                <dd className="text-sm">
                  {field.fact
                    ? formatFactValue(field.fact)
                    : field.binding.type === "user"
                      ? String(field.binding.userValue)
                      : ""}
                </dd>
              )}
            </div>
          );
        })}
      </dl>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onApprove?.(edited)}
          className="flex-1 rounded px-3 py-1.5 text-sm font-semibold"
          style={{
            backgroundColor: "var(--grounded-status-confirmed-bg)",
            borderColor: "var(--grounded-status-confirmed-border)",
            borderWidth: 1,
            borderStyle: "solid",
            color: "var(--grounded-status-confirmed-text)",
          }}
        >
          确认
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onReject?.()}
          className="flex-1 rounded px-3 py-1.5 text-sm"
          style={{
            backgroundColor: "var(--grounded-surface-2)",
            borderColor: "var(--grounded-border)",
            borderWidth: 1,
            borderStyle: "solid",
            color: "var(--grounded-text-muted)",
          }}
        >
          拒绝
        </button>
      </div>
    </div>
  );
}
