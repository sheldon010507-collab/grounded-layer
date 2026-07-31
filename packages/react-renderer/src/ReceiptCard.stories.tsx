import type { Meta, StoryObj } from "@storybook/react";
import {
  confirmedReceipt,
  failedReceipt,
  pendingReceipt,
  unknownReceipt,
} from "../test/fixtures.js";
import { ReceiptCard } from "./ReceiptCard.js";

const meta: Meta<typeof ReceiptCard> = {
  title: "Grounded/ReceiptCard",
  component: ReceiptCard,
};
export default meta;

type Story = StoryObj<typeof ReceiptCard>;

export const Confirmed: Story = {
  args: { toolTitle: "发送邮件", receipt: confirmedReceipt },
};

export const Failed: Story = {
  args: { toolTitle: "发送邮件", receipt: failedReceipt, onRetry: () => {} },
};

export const Unknown: Story = {
  args: { toolTitle: "发送邮件", receipt: unknownReceipt, onCheckStatus: () => {} },
};

export const Pending: Story = {
  args: { toolTitle: "发送邮件", receipt: pendingReceipt },
};
