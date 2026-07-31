import type { Meta, StoryObj } from "@storybook/react";
import { AuditRibbon } from "./AuditRibbon.js";

const meta: Meta<typeof AuditRibbon> = {
  title: "Grounded/AuditRibbon",
  component: AuditRibbon,
};
export default meta;

type Story = StoryObj<typeof AuditRibbon>;

export const AllMatched: Story = {
  args: {
    summary: {
      outputRef: "out_1",
      counts: { matched: 3, mismatch: 0, unsupported_inference: 0 },
      noCheckableClaims: false,
    },
  },
};

export const WithMismatch: Story = {
  args: {
    summary: {
      outputRef: "out_2",
      counts: { matched: 1, mismatch: 1, unsupported_inference: 1 },
      noCheckableClaims: false,
    },
    findings: [
      {
        claimText: "19:00",
        claimType: "datetime",
        verdict: "mismatch",
        factId: "fact_closingtime01",
        channel: "chat",
      },
      {
        claimText: "已经帮您预订好了",
        claimType: "status_assertion",
        verdict: "unsupported_inference",
        channel: "chat",
      },
    ],
  },
};

export const NoCheckableClaims: Story = {
  args: {
    summary: {
      outputRef: "out_3",
      counts: { matched: 0, mismatch: 0, unsupported_inference: 0 },
      noCheckableClaims: true,
    },
  },
};
