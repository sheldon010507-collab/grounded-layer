import type { Meta, StoryObj } from "@storybook/react";
import { derivedFact, observedFact, recipientCandidateFact } from "../test/fixtures.js";
import { ActionConfirmationCard } from "./ActionConfirmationCard.js";

const meta: Meta<typeof ActionConfirmationCard> = {
  title: "Grounded/ActionConfirmationCard",
  component: ActionConfirmationCard,
};
export default meta;

type Story = StoryObj<typeof ActionConfirmationCard>;

export const GoldenPath: Story = {
  args: {
    toolTitle: "发送邮件",
    requiresRatification: ["to"],
    args: [
      {
        param: "to",
        label: "收件人",
        binding: { type: "fact", param: "to", factId: recipientCandidateFact.id },
        fact: recipientCandidateFact,
      },
      {
        param: "body",
        label: "正文",
        binding: { type: "fact", param: "body", factId: derivedFact.id },
        fact: derivedFact,
      },
    ],
  },
};

export const NoRatificationNeeded: Story = {
  args: {
    toolTitle: "查询营业时间",
    args: [
      {
        param: "tenantId",
        label: "商户",
        binding: { type: "fact", param: "tenantId", factId: observedFact.id },
        fact: observedFact,
      },
    ],
  },
};

export const UserProvidedValue: Story = {
  args: {
    toolTitle: "发送邮件",
    args: [
      {
        param: "subject",
        label: "主题",
        binding: { type: "user", param: "subject", userValue: "今日营业时间", decidedBy: "user_1" },
      },
    ],
  },
};

export const Disabled: Story = {
  args: {
    ...GoldenPath.args,
    disabled: true,
  },
};
