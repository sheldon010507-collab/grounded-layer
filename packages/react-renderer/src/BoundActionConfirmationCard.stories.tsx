import type { ConfirmationEnvelope } from "@grounded/protocol";
import type { Meta, StoryObj } from "@storybook/react";
import { derivedFact, priceFact, recipientCandidateFact } from "../test/fixtures.js";
import { BoundActionConfirmationCard } from "./BoundActionConfirmationCard.js";

const now = new Date().toISOString();

function envelope(overrides: Partial<ConfirmationEnvelope> = {}): ConfirmationEnvelope {
  return {
    schemaVersion: "grounded.confirmation.v1",
    runId: "run_demo1",
    intentId: "int_demo0000001",
    intentVersion: 0,
    toolRef: "gmail.send",
    parameterSetDigest: "demo-param-digest",
    cardDigest: "demo-card-digest",
    issuedAt: now,
    confirmationToken: "demo-token-not-real.abcdef0123456789",
    card: {
      type: "action-confirmation-card",
      toolTitle: "发送邮件",
      requiresRatification: ["to"],
      args: [
        {
          param: "to",
          label: "收件人",
          binding: { type: "fact", param: "to", factId: recipientCandidateFact.id },
          fact: recipientCandidateFact,
          editable: true,
          valueType: "string",
          requiresRatification: true,
        },
        {
          param: "body",
          label: "正文",
          binding: { type: "fact", param: "body", factId: derivedFact.id },
          fact: derivedFact,
          editable: true,
          valueType: "string",
          requiresRatification: false,
        },
      ],
    },
    ...overrides,
  };
}

const meta: Meta<typeof BoundActionConfirmationCard> = {
  title: "Grounded/BoundActionConfirmationCard",
  component: BoundActionConfirmationCard,
};
export default meta;

type Story = StoryObj<typeof BoundActionConfirmationCard>;

export const GoldenPath: Story = {
  args: {
    envelope: envelope(),
    onDecide: (draft) => console.log("decide", draft),
  },
};

export const NumericEditableValue: Story = {
  args: {
    envelope: envelope({
      toolRef: "booking.create",
      card: {
        type: "action-confirmation-card",
        toolTitle: "预订房间",
        args: [
          {
            param: "price",
            label: "价格",
            binding: { type: "fact", param: "price", factId: priceFact.id },
            fact: priceFact,
            editable: true,
            valueType: "number",
            requiresRatification: false,
          },
        ],
      },
    }),
    onDecide: (draft) => console.log("decide", draft),
  },
};

export const Disabled: Story = {
  args: {
    ...GoldenPath.args,
    disabled: true,
  },
};

export const Expired: Story = {
  args: {
    ...GoldenPath.args,
    expired: true,
    onRefetch: () => console.log("refetch"),
  },
};
