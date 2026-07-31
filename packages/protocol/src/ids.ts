// nanoid 风格的定制字母表 ID 生成(Part E.1),不引入 nanoid 包本身——
// Node 20+ 与浏览器均有全局 crypto.getRandomValues,协议包因此维持"零运行时依赖(仅 zod peer)"(Part C.1)。
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

function randomSuffix(length: number): string {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) {
    // 256 % 36 有轻微模偏,可接受:ID 只需唯一,不需要密码学级不可预测性。
    // charAt() 而非索引访问,避免 noUncheckedIndexedAccess 下的 string|undefined。
    out += ALPHABET.charAt(byte % ALPHABET.length);
  }
  return out;
}

/** 匹配 Fact.id 的正则 /^fact_[a-z0-9]{12}$/ */
export function newFactId(): string {
  return `fact_${randomSuffix(12)}`;
}

/** 匹配 Intent.intentId 的正则 /^int_[a-z0-9]{12}$/ */
export function newIntentId(): string {
  return `int_${randomSuffix(12)}`;
}

/** 匹配 BatchIntent.batchId 的正则 /^bat_[a-z0-9]{12}$/ */
export function newBatchId(): string {
  return `bat_${randomSuffix(12)}`;
}

/** 幂等键与 runId 等无格式约束的场景通用生成器 */
export function newOpaqueId(prefix: string): string {
  return `${prefix}_${randomSuffix(16)}`;
}
