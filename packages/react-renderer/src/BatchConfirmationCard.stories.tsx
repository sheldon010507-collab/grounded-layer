import type { Meta, StoryObj } from "@storybook/react";
import { batchItems } from "../test/fixtures.js";
import { BatchConfirmationCard } from "./BatchConfirmationCard.js";

const meta: Meta<typeof BatchConfirmationCard> = {
  title: "Grounded/BatchConfirmationCard",
  component: BatchConfirmationCard,
};
export default meta;

type Story = StoryObj<typeof BatchConfirmationCard>;

export const ThreeRecipients: Story = {
  args: {
    toolTitle: "批量提醒",
    templateDesc: "给 3 位客户发账单提醒",
    items: batchItems,
    requiresRatification: ["to"],
  },
};
