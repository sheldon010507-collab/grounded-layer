import type { Fact } from "@grounded/protocol";
import { FactBadge } from "./FactBadge.js";
import { type FactFormat, formatFactValue } from "./format.js";

// 字段形状故意对齐 Part E.5 的 UI IR(`{ label, factId, format }`)——
// 差别只是这里已经是"resolve 完的 Fact",不是"factId 字符串"。
// Week 6 的 ui-binding 编译器解析完 FactId 之后,产出的就是这个 props 形状,
// 届时 FactCard 不需要改一行代码。
export interface FactField {
  label: string;
  fact: Fact;
  format?: FactFormat;
}

export interface FactCardProps {
  title?: string;
  fields: FactField[];
}

/** validator 校验的是引用完整性(每个显示值可追溯到存在的 Fact),不是事实正确性(Part E.5)。 */
export function FactCard({ title, fields }: FactCardProps) {
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
      {title && <h3 className="text-sm font-semibold">{title}</h3>}
      <dl className="flex flex-col gap-2">
        {fields.map((field) => (
          <div
            key={`${field.label}:${field.fact.id}`}
            className="flex items-center justify-between gap-3"
          >
            <dt className="text-xs" style={{ color: "var(--grounded-text-muted)" }}>
              {field.label}
            </dt>
            <dd className="flex items-center gap-2 text-sm">
              <span>{formatFactValue(field.fact, field.format)}</span>
              <FactBadge fact={field.fact} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
