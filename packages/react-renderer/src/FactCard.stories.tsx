import type { Meta, StoryObj } from "@storybook/react";
import { collectionFact, derivedFact, observedFact, priceFact } from "../test/fixtures.js";
import { FactCard } from "./FactCard.js";

const meta: Meta<typeof FactCard> = {
  title: "Grounded/FactCard",
  component: FactCard,
};
export default meta;

type Story = StoryObj<typeof FactCard>;

export const SingleField: Story = {
  args: {
    title: "营业时间",
    fields: [{ label: "打烊时间", fact: observedFact, format: "time" }],
  },
};

export const MultipleFields: Story = {
  args: {
    title: "房间 1204",
    fields: [
      { label: "价格", fact: priceFact, format: "currency" },
      { label: "备注", fact: derivedFact },
    ],
  },
};

export const CollectionField: Story = {
  args: {
    title: "搜索结果",
    fields: [{ label: "匹配数", fact: collectionFact }],
  },
};
