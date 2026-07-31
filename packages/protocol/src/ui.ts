import type { Fact, ResolvedBinding } from "./fact.js";
import type { Receipt } from "./receipt.js";

/** Public, already-resolved card values consumed by renderers. */
export type FactFormat = "currency" | "time" | "plain";

export interface CompiledFactField {
  label: string;
  fact: Fact;
  format?: FactFormat;
}

export interface CompiledFactCard {
  type: "fact-card";
  title?: string;
  fields: CompiledFactField[];
}

export type CompiledActionArgValueType = "string" | "number" | "boolean" | "null" | "complex";

export interface CompiledActionArg {
  param: string;
  label: string;
  binding: ResolvedBinding;
  fact?: Fact;
  editable: boolean;
  valueType: CompiledActionArgValueType;
  requiresRatification: boolean;
}

export interface CompiledActionConfirmationCard {
  type: "action-confirmation-card";
  toolTitle: string;
  args: CompiledActionArg[];
  requiresRatification?: string[];
}

export interface CompiledReceiptCard {
  type: "receipt-card";
  toolTitle?: string;
  receipt: Receipt;
}

export interface CompiledStaleChange {
  label: string;
  oldFact: Fact;
  newFact: Fact;
  format?: FactFormat;
}

export interface CompiledStaleNotice {
  type: "stale-notice";
  toolTitle: string;
  changes: CompiledStaleChange[];
}

export interface CompiledErrorCard {
  type: "error-card";
  title: string;
  message: string;
}

export type CompiledBlock =
  | CompiledFactCard
  | CompiledActionConfirmationCard
  | CompiledReceiptCard
  | CompiledStaleNotice
  | CompiledErrorCard;
