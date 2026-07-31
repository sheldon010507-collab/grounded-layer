"use client";

import type { Fact } from "@grounded/protocol";
import { useState } from "react";
import type { RendererLocale } from "./format.js";

export interface FactBadgeProps {
  fact: Fact;
  locale?: RendererLocale;
}

interface KindStyle {
  label: string;
  bg: string;
  border: string;
  text: string;
}

// Part L.4.12:derived 徽章必须独立视觉,不与 observed 同色——用 CSS 变量而非共享色阶,
// 这样"模型推导·未验证"在任何主题下都不可能被换肤成和 observed 一样的颜色。
const KIND_STYLE: Record<Fact["kind"], KindStyle> = {
  observed: {
    label: "已核实",
    bg: "var(--grounded-observed-bg)",
    border: "var(--grounded-observed-border)",
    text: "var(--grounded-observed-text)",
  },
  derived: {
    label: "模型推导 · 未验证",
    bg: "var(--grounded-derived-bg)",
    border: "var(--grounded-derived-border)",
    text: "var(--grounded-derived-text)",
  },
  receipt: {
    label: "回执",
    bg: "var(--grounded-receipt-bg)",
    border: "var(--grounded-receipt-border)",
    text: "var(--grounded-receipt-text)",
  },
};

const EN_KIND_LABEL: Record<Fact["kind"], string> = {
  observed: "Verified",
  derived: "Model-derived · unverified",
  receipt: "Receipt",
};

function isStale(fact: Fact): boolean {
  if (fact.supersededBy) return true;
  if (fact.expiresAt && new Date(fact.expiresAt).getTime() < Date.now()) return true;
  return false;
}

/** hover 显示 system/retrievedAt/expiresAt/riskClass(Part E.9)。 */
export function FactBadge({ fact, locale = "zh" }: FactBadgeProps) {
  const [hovered, setHovered] = useState(false);
  const style = KIND_STYLE[fact.kind];
  const stale = isStale(fact);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {/* button 而非带 tabIndex 的 span:键盘用户需要能 focus 到这里才能触发 onFocus 显示 tooltip,
          一个天然可 focus、会被读屏器正确播报的元素比手动搭的 tabIndex 更对(Biome a11y 规则也是这个理)。 */}
      <button
        type="button"
        className="inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] leading-none"
        style={{
          backgroundColor: style.bg,
          borderColor: style.border,
          color: style.text,
          borderWidth: 1,
          borderStyle: stale ? "dashed" : "solid",
          opacity: stale ? 0.6 : 1,
          font: "inherit",
          cursor: "default",
        }}
      >
        {locale === "en" ? EN_KIND_LABEL[fact.kind] : style.label}
        {stale && <span aria-hidden="true"> · {locale === "en" ? "Stale" : "已过期"}</span>}
      </button>
      {hovered && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-10 mt-1 w-max max-w-xs rounded p-2 text-[11px] shadow-lg"
          style={{
            backgroundColor: "var(--grounded-surface-2)",
            borderColor: "var(--grounded-border)",
            color: "var(--grounded-text-muted)",
            borderWidth: 1,
            borderStyle: "solid",
          }}
        >
          <FactBadgeTooltipBody fact={fact} locale={locale} />
        </span>
      )}
    </span>
  );
}

function FactBadgeTooltipBody({ fact, locale }: { fact: Fact; locale: RendererLocale }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
      <dt className="opacity-70">{locale === "en" ? "Source" : "来源"}</dt>
      <dd>{fact.source.system}</dd>
      <dt className="opacity-70">{locale === "en" ? "Retrieved" : "获取时间"}</dt>
      <dd>{fact.source.retrievedAt}</dd>
      {fact.expiresAt && (
        <>
          <dt className="opacity-70">{locale === "en" ? "Expires" : "过期时间"}</dt>
          <dd>{fact.expiresAt}</dd>
        </>
      )}
      <dt className="opacity-70">{locale === "en" ? "Risk" : "风险级"}</dt>
      <dd>{fact.riskClass}</dd>
      {fact.kind === "derived" && fact.derivedFrom && (
        <>
          <dt className="opacity-70">{locale === "en" ? "Derived from" : "推导自"}</dt>
          <dd>{fact.derivedFrom.join(", ")}</dd>
        </>
      )}
    </dl>
  );
}
