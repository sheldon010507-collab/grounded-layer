import type { Meta, StoryObj } from "@storybook/react";
import { derivedFact, observedFact, priceFact, receiptFact, staleFact } from "../test/fixtures.js";
import { FactBadge } from "./FactBadge.js";

const meta: Meta<typeof FactBadge> = {
  title: "Grounded/FactBadge",
  component: FactBadge,
};
export default meta;

type Story = StoryObj<typeof FactBadge>;

export const Observed: Story = { args: { fact: observedFact } };
export const Derived: Story = { args: { fact: derivedFact } };
export const Receipt: Story = { args: { fact: receiptFact } };
export const HighRisk: Story = { args: { fact: priceFact } };
export const Stale: Story = { args: { fact: staleFact } };
