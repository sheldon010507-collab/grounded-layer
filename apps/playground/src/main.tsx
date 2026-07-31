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

function App() {
  const [decision, setDecision] = useState<ConfirmationDecisionDraft | null>(null);
  const [expired, setExpired] = useState(false);
  const [receiptStatus, setReceiptStatus] = useState<keyof typeof receipts>("confirmed");

  return (
    <main className="page-shell">
      <header className="hero">
        <p className="eyebrow">Grounded Layer · protocol playground</p>
        <h1>See what an agent is asking to do before it does it.</h1>
        <p className="lede">
          These cards render public protocol envelopes. They are local fixtures: no MCP server,
          credentials, network request, or tool execution is involved.
        </p>
      </header>

      <section className="grid two-up">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">01 · confirmation</p>
              <h2>Action confirmation</h2>
            </div>
            <button type="button" onClick={() => setExpired((value) => !value)}>
              {expired ? "Show active" : "Simulate stale"}
            </button>
          </div>
          <BoundActionConfirmationCard
            envelope={confirmation}
            expired={expired}
            onRefetch={() => setExpired(false)}
            onDecide={(draft) => setDecision(draft)}
          />
          <pre className="event-log">{JSON.stringify(decision, null, 2) ?? ""}</pre>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">02 · receipt</p>
              <h2>Honest terminal states</h2>
            </div>
            <select
              value={receiptStatus}
              onChange={(event) => setReceiptStatus(event.target.value as keyof typeof receipts)}
            >
              <option value="confirmed">confirmed</option>
              <option value="failed">failed</option>
              <option value="unknown">unknown</option>
            </select>
          </div>
          <ReceiptCard
            receipt={receipts[receiptStatus]}
            toolTitle="Update booking"
            onRetry={receiptStatus === "failed" ? () => setReceiptStatus("confirmed") : undefined}
            onCheckStatus={
              receiptStatus === "unknown" ? () => setReceiptStatus("confirmed") : undefined
            }
          />
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">03 · stale data</p>
            <h2>Show the value change, then ask again</h2>
          </div>
        </div>
        <StaleNotice
          toolTitle="Update booking"
          changes={[{ label: "Room price", oldFact: fact, newFact: newerFact, format: "currency" }]}
          onReconfirm={() => setExpired(false)}
        />
      </section>

      <footer>Open protocol surface · private execution core · no hosted service required</footer>
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Playground root element is missing");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
