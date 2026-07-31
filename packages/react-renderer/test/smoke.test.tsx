import type { ConfirmationEnvelope } from "@grounded/protocol";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionConfirmationCard } from "../src/ActionConfirmationCard.js";
import { AuditRibbon } from "../src/AuditRibbon.js";
import { BatchConfirmationCard } from "../src/BatchConfirmationCard.js";
import { BoundActionConfirmationCard } from "../src/BoundActionConfirmationCard.js";
import { FactBadge } from "../src/FactBadge.js";
import { FactCard } from "../src/FactCard.js";
import { ReceiptCard } from "../src/ReceiptCard.js";
import { StaleNotice } from "../src/StaleNotice.js";
import {
  batchItems,
  cleanAuditSummary,
  collectionFact,
  confirmedReceipt,
  derivedFact,
  failedReceipt,
  mismatchAuditSummary,
  mismatchFindings,
  newPriceFact,
  noCheckableAuditSummary,
  observedFact,
  oldPriceFact,
  pendingReceipt,
  priceFact,
  receiptFact,
  recipientCandidateFact,
  staleFact,
  unknownReceipt,
} from "./fixtures.js";

// SSR 冒烟测试:react-dom/server 不需要 jsdom,也顺带验证组件在 Next.js RSC 树里
// 作为客户端子组件("use client")被 SSR 时不会抛错(playground 就是这么用它的)。
describe("FactBadge (SSR smoke)", () => {
  it("renders the observed label", () => {
    const html = renderToStaticMarkup(<FactBadge fact={observedFact} />);
    expect(html).toContain("已核实");
  });

  it("renders the derived label distinctly from observed", () => {
    const html = renderToStaticMarkup(<FactBadge fact={derivedFact} />);
    expect(html).toContain("模型推导");
    expect(html).not.toContain("已核实");
  });

  it("renders the receipt label", () => {
    const html = renderToStaticMarkup(<FactBadge fact={receiptFact} />);
    expect(html).toContain("回执");
  });

  it("marks an expired fact as stale", () => {
    const html = renderToStaticMarkup(<FactBadge fact={staleFact} />);
    expect(html).toContain("已过期");
  });

  it("does not mark a fresh fact as stale", () => {
    const html = renderToStaticMarkup(<FactBadge fact={priceFact} />);
    expect(html).not.toContain("已过期");
  });
});

describe("FactCard (SSR smoke)", () => {
  it("renders a title and formatted currency value", () => {
    const html = renderToStaticMarkup(
      <FactCard
        title="房间 1204"
        fields={[{ label: "价格", fact: priceFact, format: "currency" }]}
      />,
    );
    expect(html).toContain("房间 1204");
    expect(html).toContain("价格");
    expect(html).toMatch(/189/);
  });

  it("renders a collection fact as an item count, not a raw array", () => {
    const html = renderToStaticMarkup(
      <FactCard fields={[{ label: "结果", fact: collectionFact }]} />,
    );
    expect(html).toContain("3 项");
  });

  it("renders one FactBadge per field", () => {
    const html = renderToStaticMarkup(
      <FactCard
        fields={[
          { label: "打烊时间", fact: observedFact },
          { label: "备注", fact: derivedFact },
        ]}
      />,
    );
    expect(html).toContain("已核实");
    expect(html).toContain("模型推导");
  });
});

describe("ActionConfirmationCard (SSR smoke)", () => {
  it("pins a ratification-required param, labeled for user review, editable", () => {
    const html = renderToStaticMarkup(
      <ActionConfirmationCard
        toolTitle="发送邮件"
        requiresRatification={["to"]}
        args={[
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
        ]}
      />,
    );
    expect(html).toContain("从你的消息提取");
    expect(html).toContain("确认");
    expect(html).toContain("拒绝");
    // 待核定字段是 <input>(可编辑),非核定字段不是
    expect(html).toContain("<input");
  });

  it("renders a user-provided binding without a FactBadge", () => {
    const html = renderToStaticMarkup(
      <ActionConfirmationCard
        toolTitle="发送邮件"
        args={[
          {
            param: "subject",
            label: "主题",
            binding: { type: "user", param: "subject", userValue: "今日营业时间", decidedBy: "u1" },
          },
        ]}
      />,
    );
    expect(html).toContain("用户输入");
    expect(html).toContain("今日营业时间");
  });
});

function demoEnvelope(): ConfirmationEnvelope {
  return {
    schemaVersion: "grounded.confirmation.v1",
    runId: "run_demo1",
    intentId: "int_demo0000001",
    intentVersion: 0,
    toolRef: "gmail.send",
    parameterSetDigest: "demo-param-digest",
    cardDigest: "demo-card-digest",
    issuedAt: new Date().toISOString(),
    confirmationToken: "demo-ref.demo-sig",
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
  };
}

describe("BoundActionConfirmationCard (SSR smoke)", () => {
  it("pins a ratification-required param, editable, and never renders the raw confirmationToken as visible text", () => {
    const envelope = demoEnvelope();
    const html = renderToStaticMarkup(
      <BoundActionConfirmationCard envelope={envelope} onDecide={() => {}} />,
    );
    expect(html).toContain("从你的消息提取");
    expect(html).toContain("确认");
    expect(html).toContain("拒绝");
    expect(html).toContain("<input");
    expect(html).not.toContain(envelope.confirmationToken);
  });

  it("expired: freezes the card and shows a refetch affordance instead of approve/reject", () => {
    const html = renderToStaticMarkup(
      <BoundActionConfirmationCard envelope={demoEnvelope()} onDecide={() => {}} expired />,
    );
    expect(html).toContain("已过期");
    expect(html).toContain("重新拉取");
    expect(html).not.toContain(">拒绝<");
  });
});

describe("ReceiptCard (SSR smoke)", () => {
  it("renders confirmed with externalRef", () => {
    const html = renderToStaticMarkup(<ReceiptCard receipt={confirmedReceipt} />);
    expect(html).toContain("msg_18a2f");
    expect(html).toContain("已完成");
  });

  it("renders failed with a retry action when onRetry is provided", () => {
    const html = renderToStaticMarkup(<ReceiptCard receipt={failedReceipt} onRetry={() => {}} />);
    expect(html).toContain("FATAL_BOUNCE");
    expect(html).toContain("重试");
  });

  it("renders unknown with a check-status action, no retry button", () => {
    const html = renderToStaticMarkup(
      <ReceiptCard receipt={unknownReceipt} onCheckStatus={() => {}} />,
    );
    expect(html).toContain("已发出未确认");
    expect(html).toContain("查状态");
    expect(html).not.toContain("重试");
  });

  it("does not render an action button when no handler is provided", () => {
    const html = renderToStaticMarkup(<ReceiptCard receipt={pendingReceipt} />);
    expect(html).toContain("处理中");
    expect(html).not.toContain("<button");
  });
});

describe("StaleNotice (SSR smoke)", () => {
  it("shows old value struck through, new value highlighted, and both FactBadges", () => {
    const html = renderToStaticMarkup(
      <StaleNotice
        toolTitle="预订房间 1204"
        changes={[
          { label: "价格", oldFact: oldPriceFact, newFact: newPriceFact, format: "currency" },
        ]}
      />,
    );
    expect(html).toContain("数据已过期");
    expect(html).toContain("价格");
    expect(html).toMatch(/199/);
    expect(html).toMatch(/249/);
    expect(html).toContain("重新确认");
    expect(html).toContain("取消");
    // 两个 Fact 都是 observed kind——两个徽章都应该显示"已核实"
    const badgeCount = (html.match(/已核实/g) ?? []).length;
    expect(badgeCount).toBe(2);
  });

  it("renders one change row per entry for multiple changes", () => {
    const html = renderToStaticMarkup(
      <StaleNotice
        toolTitle="预订房间 1204"
        changes={[
          { label: "价格", oldFact: oldPriceFact, newFact: newPriceFact, format: "currency" },
          { label: "可用性", oldFact: observedFact, newFact: derivedFact },
        ]}
      />,
    );
    expect(html).toContain("价格");
    expect(html).toContain("可用性");
  });
});

describe("AuditRibbon (SSR smoke)", () => {
  it("renders the coverage sentence with all-matched counts", () => {
    const html = renderToStaticMarkup(<AuditRibbon summary={cleanAuditSummary} />);
    expect(html).toContain("2 项断言");
    expect(html).toContain("2 项已核");
    expect(html).toContain("0 项不可核");
  });

  it("surfaces mismatch/unsupported findings when provided", () => {
    const html = renderToStaticMarkup(
      <AuditRibbon summary={mismatchAuditSummary} findings={mismatchFindings} />,
    );
    expect(html).toContain("19:00");
    expect(html).toContain("与事实不符");
    expect(html).toContain("已经帮您预订好了");
    expect(html).toContain("无据可查");
  });

  it("renders the gray no-checkable-claims state, never claiming all-clear", () => {
    const html = renderToStaticMarkup(<AuditRibbon summary={noCheckableAuditSummary} />);
    expect(html).toContain("没有可核实的具体断言");
    // 灰态不应该出现"项已核"这个统计句式,避免被误读成"全部通过"
    expect(html).not.toContain("项已核");
  });
});

describe("BatchConfirmationCard (SSR smoke)", () => {
  it("shows every item's high-risk field, no collapsing, plus the batch count", () => {
    const html = renderToStaticMarkup(
      <BatchConfirmationCard
        toolTitle="批量提醒"
        templateDesc="给 3 位客户发账单提醒"
        items={batchItems}
        requiresRatification={["to"]}
      />,
    );
    expect(html).toContain("给 3 位客户发账单提醒");
    expect(html).toContain("3/3");
    expect(html).toContain("Robert");
    expect(html).toContain("Alice");
    expect(html).toContain("Chen");
    expect(html).toContain("确认剩下 3 条");
    expect(html).toContain("全部拒绝");
    // 三条都在,一个都没被折叠隐藏——每条都出现了"剔除这一条"
    const removeButtonCount = (html.match(/剔除这一条/g) ?? []).length;
    expect(removeButtonCount).toBe(3);
  });
});
