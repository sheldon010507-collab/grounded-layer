import type {
  ConfirmationDecisionDraft,
  ConfirmationEnvelope,
  Fact,
  Receipt,
} from "@grounded/protocol";
import { BoundActionConfirmationCard, ReceiptCard, StaleNotice } from "@grounded/react-renderer";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "@grounded/react-renderer/styles.css";
import "./styles.css";

const now = "2026-01-01T00:00:00.000Z";

const fact: Fact = {
  id: "fact_roomprice123",
  runId: "run_playground",
  key: "room.price",
  entityRef: "room:1204",
  value: 149,
  unit: "GBP",
  kind: "observed",
  riskClass: "normal",
  source: { system: "playground-fixture", retrievedAt: now },
  observedAt: now,
  etag: "etag-149",
};

const newerFact: Fact = { ...fact, id: "fact_roomprice124", value: 169, etag: "etag-169" };

const confirmation: ConfirmationEnvelope = {
  schemaVersion: "grounded.confirmation.v1",
  runId: "run_playground",
  intentId: "int_playground",
  intentVersion: 0,
  toolRef: "demo.booking.update",
  parameterSetDigest: "sha256:fixture-parameters",
  cardDigest: "sha256:fixture-card",
  issuedAt: now,
  confirmationToken: "demo-confirmation-token",
  card: {
    type: "action-confirmation-card",
    toolTitle: "Update booking",
    args: [
      {
        param: "roomPrice",
        label: "Room price",
        binding: { type: "fact", param: "roomPrice", factId: fact.id },
        fact,
        editable: true,
        valueType: "number",
        requiresRatification: true,
      },
      {
        param: "guestNote",
        label: "Guest note",
        binding: {
          type: "user",
          param: "guestNote",
          userValue: "Late arrival",
          decidedBy: "playground-user",
        },
        editable: true,
        valueType: "string",
        requiresRatification: false,
      },
    ],
    requiresRatification: ["roomPrice"],
  },
};

const receipts: Record<"confirmed" | "failed" | "unknown", Receipt> = {
  confirmed: {
    intentId: "int_confirmed",
    status: "confirmed",
    externalRef: "booking_123",
    rawHash: "sha256:confirmed",
    recordedAt: now,
    signature: "hmac:fixture",
  },
  failed: {
    intentId: "int_failed",
    status: "failed",
    errorCode: "UPSTREAM_400",
    rawHash: "sha256:failed",
    recordedAt: now,
    signature: "hmac:fixture",
  },
  unknown: {
    intentId: "int_unknown",
    status: "unknown",
    errorCode: "TIMEOUT",
    rawHash: "sha256:unknown",
    recordedAt: now,
    signature: "hmac:fixture",
  },
};

const receiptTabs = [
  { value: "confirmed", label: "Confirmed" },
  { value: "failed", label: "Failed" },
  { value: "unknown", label: "Unknown" },
] as const;

type ReceiptStatus = keyof typeof receipts;

function App() {
  const [decision, setDecision] = useState<ConfirmationDecisionDraft | null>(null);
  const [expired, setExpired] = useState(false);
  const [receiptStatus, setReceiptStatus] = useState<ReceiptStatus>("confirmed");

  const eventLog = decision
    ? JSON.stringify({ event: "decision.submitted", ...decision }, null, 2)
    : "// Approve, edit, or reject the card to emit a decision";

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Playground navigation">
        <a className="brand" href="#overview" aria-label="Grounded Layer home">
          <span className="brand-mark" aria-hidden="true">
            GL
          </span>
          <span>
            <strong>Grounded Layer</strong>
            <small>public playground</small>
          </span>
        </a>

        <nav className="sidebar-nav">
          <p className="nav-label">Workspace</p>
          <a className="nav-link active" href="#overview">
            <span aria-hidden="true">⌂</span> Overview
          </a>
          <a className="nav-link" href="#confirmation">
            <span aria-hidden="true">◇</span> Confirmation
          </a>
          <a className="nav-link" href="#receipts">
            <span aria-hidden="true">↗</span> Receipts
          </a>
          <a className="nav-link" href="#stale">
            <span aria-hidden="true">△</span> Stale data
          </a>
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" aria-hidden="true" />
          <div>
            <strong>Local fixtures</strong>
            <small>No network or credentials</small>
          </div>
        </div>
      </aside>

      <main className="content" id="overview">
        <header className="topbar">
          <span className="breadcrumb">Playground / public surface</span>
          <a
            className="topbar-link"
            href="https://github.com/sheldon010507-collab/grounded-layer"
            target="_blank"
            rel="noreferrer"
          >
            View source <span aria-hidden="true">↗</span>
          </a>
        </header>

        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow-row">
              <span className="eyebrow">Grounded Layer</span>
              <span className="version-chip">v1 confirmation flow</span>
            </div>
            <h1>
              Make agent actions <em>legible.</em>
            </h1>
            <p className="lede">
              A compact tour of the public protocol surface: show the action, verify the facts,
              capture the decision, and tell the truth about what happened.
            </p>
          </div>

          <div className="flow-card" aria-label="Action lifecycle">
            <div className="flow-card-header">
              <span>Action lifecycle</span>
              <span className="live-chip">
                <span className="status-dot" aria-hidden="true" /> Live fixture
              </span>
            </div>
            <div className="flow-track">
              <span className="flow-node">Intent</span>
              <span className="flow-line" aria-hidden="true" />
              <span className="flow-node accent">Review</span>
              <span className="flow-line" aria-hidden="true" />
              <span className="flow-node">Receipt</span>
            </div>
            <p>Nothing leaves this browser. Every state below is a local, inspectable fixture.</p>
          </div>
        </section>

        <div className="workspace-grid">
          <section className="panel panel-primary" id="confirmation">
            <div className="panel-heading">
              <div className="panel-title-group">
                <span className="section-number">01</span>
                <div>
                  <p className="eyebrow">Before execution</p>
                  <h2>Action confirmation</h2>
                </div>
              </div>
              <button
                className="quiet-button"
                type="button"
                onClick={() => setExpired((value) => !value)}
              >
                {expired ? "Restore active" : "Simulate stale"}
              </button>
            </div>

            <div className="card-stage">
              <BoundActionConfirmationCard
                envelope={confirmation}
                expired={expired}
                locale="en"
                onRefetch={() => setExpired(false)}
                onDecide={(draft) => setDecision(draft)}
              />
            </div>

            <div className="event-console">
              <div className="console-header">
                <span>Decision envelope</span>
                <span className="console-state">{decision ? "captured" : "waiting"}</span>
              </div>
              <pre>{eventLog}</pre>
            </div>
          </section>

          <section className="panel" id="receipts">
            <div className="panel-heading">
              <div className="panel-title-group">
                <span className="section-number">02</span>
                <div>
                  <p className="eyebrow">After execution</p>
                  <h2>Honest receipts</h2>
                </div>
              </div>
              <span className="panel-kicker">3 outcomes</span>
            </div>

            <div className="segmented-control" role="tablist" aria-label="Receipt outcomes">
              {receiptTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={receiptStatus === tab.value}
                  className={receiptStatus === tab.value ? "selected" : ""}
                  onClick={() => setReceiptStatus(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="card-stage receipt-stage">
              <ReceiptCard
                receipt={receipts[receiptStatus]}
                toolTitle="Update booking"
                locale="en"
                onRetry={
                  receiptStatus === "failed" ? () => setReceiptStatus("confirmed") : undefined
                }
                onCheckStatus={
                  receiptStatus === "unknown" ? () => setReceiptStatus("confirmed") : undefined
                }
              />
            </div>
            <p className="panel-note">
              A failed action is not a success. An unknown action is never retried automatically.
            </p>
          </section>
        </div>

        <section className="panel stale-panel" id="stale">
          <div className="panel-heading">
            <div className="panel-title-group">
              <span className="section-number">03</span>
              <div>
                <p className="eyebrow">When facts move</p>
                <h2>Surface the change, then ask again</h2>
              </div>
            </div>
            <span className="panel-kicker warning">revalidation</span>
          </div>
          <div className="card-stage">
            <StaleNotice
              toolTitle="Update booking"
              changes={[
                { label: "Room price", oldFact: fact, newFact: newerFact, format: "currency" },
              ]}
              locale="en"
              onReconfirm={() => setExpired(false)}
            />
          </div>
        </section>

        <footer className="page-footer">
          <span>Open protocol surface</span>
          <span className="footer-separator" aria-hidden="true">
            /
          </span>
          <span>Private execution core</span>
          <span className="footer-separator" aria-hidden="true">
            /
          </span>
          <span>No hosted service required</span>
        </footer>
      </main>
    </div>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Playground root element is missing");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
