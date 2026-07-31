import type { Fact } from "@grounded/protocol";

export type FactFormat = "currency" | "time" | "plain";

/**
 * 值的展示格式化。集合 Fact(value 为数组)只显示条目数——
 * 逐条渲染是 ResultList 的职责(v0.2,见 Part E.5),这里不越界替它做。
 */
export function formatFactValue(fact: Fact, format: FactFormat = "plain"): string {
  if (Array.isArray(fact.value)) {
    return `${fact.value.length} 项`;
  }
  if (fact.value === null) {
    return "—";
  }

  switch (format) {
    case "currency":
      return formatCurrency(fact.value, fact.unit);
    case "time":
      return formatTime(fact.value);
    default:
      return fact.unit ? `${fact.value} ${fact.unit}` : String(fact.value);
  }
}

function formatCurrency(value: string | number | boolean, unit: string | undefined): string {
  if (typeof value !== "number") return String(value);
  if (unit) {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: unit }).format(value);
    } catch {
      // unit 不是合法 ISO 4217 代码(比如 "minutes")——退化为"值 + 单位"而不是抛错
    }
  }
  return unit ? `${value} ${unit}` : String(value);
}

function formatTime(value: string | number | boolean): string {
  if (typeof value !== "string") return String(value);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value; // 已是人类可读格式("18:00"),原样显示
  return parsed.toLocaleString();
}
