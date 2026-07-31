import type { Meta, StoryObj } from "@storybook/react";
import { newPriceFact, oldPriceFact } from "../test/fixtures.js";
import { StaleNotice } from "./StaleNotice.js";

const meta: Meta<typeof StaleNotice> = {
  title: "Grounded/StaleNotice",
  component: StaleNotice,
};
export default meta;

type Story = StoryObj<typeof StaleNotice>;

export const PriceChanged: Story = {
  args: {
    toolTitle: "预订房间 1204",
    changes: [
      {
        label: "价格",
        oldFact: oldPriceFact,
        newFact: newPriceFact,
        format: "currency",
      },
    ],
  },
};
