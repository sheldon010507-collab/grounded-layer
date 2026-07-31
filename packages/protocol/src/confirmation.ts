import { z } from "zod";
import type { IntentStatus } from "./intent.js";
import { Receipt } from "./receipt.js";
import type { CompiledActionConfirmationCard } from "./ui.js";

export interface ConfirmationEnvelope {
  schemaVersion: "grounded.confirmation.v1";
  runId: string;
  intentId: string;
  intentVersion: number;
  toolRef: string;
  parameterSetDigest: string;
  cardDigest: string;
  issuedAt: string;
  confirmationToken: string;
  card: CompiledActionConfirmationCard;
}

const CompiledActionArgSchema = z.object({
  param: z.string(),
  label: z.string(),
  binding: z.unknown(),
  fact: z.unknown().optional(),
  editable: z.boolean(),
  valueType: z.enum(["string", "number", "boolean", "null", "complex"]),
  requiresRatification: z.boolean(),
});

export const ConfirmationEnvelopeSchema = z.object({
  schemaVersion: z.literal("grounded.confirmation.v1"),
  runId: z.string().min(1),
  intentId: z.string().min(1),
  intentVersion: z.number().int().nonnegative(),
  toolRef: z.string().min(1),
  parameterSetDigest: z.string().min(1),
  cardDigest: z.string().min(1),
  issuedAt: z.string().datetime(),
  confirmationToken: z.string().min(1),
  card: z.object({
    type: z.literal("action-confirmation-card"),
    toolTitle: z.string(),
    args: z.array(CompiledActionArgSchema),
    requiresRatification: z.array(z.string()).optional(),
  }),
});

export type StaleConfirmationResult =
  | { kind: "stale"; intentId: string; version: number; changedFactIds?: string[] }
  | { kind: "not_pending"; intentId: string; status: IntentStatus };

export const ConfirmationScalar = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export type ConfirmationScalar = z.infer<typeof ConfirmationScalar>;

export const ConfirmationEdit = z.object({
  param: z.string(),
  value: ConfirmationScalar,
});
export type ConfirmationEdit = z.infer<typeof ConfirmationEdit>;

export const ConfirmationDecisionDraft = z.discriminatedUnion("decision", [
  z.object({ confirmationToken: z.string(), decision: z.literal("approve") }),
  z.object({
    confirmationToken: z.string(),
    decision: z.literal("edit"),
    edits: z.array(ConfirmationEdit).min(1),
  }),
  z.object({ confirmationToken: z.string(), decision: z.literal("reject") }),
]);
export type ConfirmationDecisionDraft = z.infer<typeof ConfirmationDecisionDraft>;

export type GroundedOutcome =
  | { kind: "settled"; receipt: z.infer<typeof Receipt> }
  | { kind: "stale"; intentId: string; version: number; changedFactIds?: string[] }
  | { kind: "rejected"; reason: string };

export type GroundedConfirmResult =
  | GroundedOutcome
  | { kind: "conflict"; currentVersion: number }
  | { kind: "not_pending"; intentId: string; status: string };

export type GroundedSubmitResult =
  | GroundedOutcome
  | { kind: "awaiting_confirmation"; confirmation: ConfirmationEnvelope };

export const GroundedOutcomeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("settled"), receipt: Receipt }),
  z.object({
    kind: z.literal("stale"),
    intentId: z.string(),
    version: z.number().int().nonnegative(),
    changedFactIds: z.array(z.string()).optional(),
  }),
  z.object({ kind: z.literal("rejected"), reason: z.string() }),
]);

export const GroundedSubmitResultSchema = z.union([
  GroundedOutcomeSchema,
  z.object({ kind: z.literal("awaiting_confirmation"), confirmation: ConfirmationEnvelopeSchema }),
]);

export const GroundedConfirmResultSchema = z.union([
  GroundedOutcomeSchema,
  z.object({ kind: z.literal("conflict"), currentVersion: z.number().int().nonnegative() }),
  z.object({ kind: z.literal("not_pending"), intentId: z.string(), status: z.string() }),
]);
