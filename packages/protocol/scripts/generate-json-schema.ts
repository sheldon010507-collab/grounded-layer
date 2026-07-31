import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { zodToJsonSchema } from "zod-to-json-schema";
import * as schemas from "../src/index.js";

// Part C.1:"Zod schema 为唯一真源,zod-to-json-schema 生成 JSON Schema 随包发布(/schemas/*.json)"。
// 只导出以大写字母开头的 ZodType 值(排除 newFactId 等函数导出)。
const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "schemas");
mkdirSync(outDir, { recursive: true });

let count = 0;
for (const [name, value] of Object.entries(schemas)) {
  const isSchema =
    /^[A-Z]/.test(name) && typeof value === "object" && value !== null && "_def" in value;
  if (!isSchema) continue;
  const jsonSchema = zodToJsonSchema(value as never, name);
  writeFileSync(join(outDir, `${name}.json`), `${JSON.stringify(jsonSchema, null, 2)}\n`);
  count++;
}

console.log(`[protocol] generated ${count} JSON Schema files -> ${outDir}`);
