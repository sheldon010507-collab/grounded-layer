# @grounded/react-renderer

React components for displaying public Grounded protocol envelopes. The renderer is deliberately a presentation layer: it does not authorize an action, validate a receipt signature, call a tool, or retry a request by itself.

Components include:

- `BoundActionConfirmationCard` for a `ConfirmationEnvelope`;
- `FactBadge` and `FactCard` for source-aware facts;
- `ReceiptCard` for confirmed, failed, unknown, and pending receipts;
- `StaleNotice` for showing an old/new fact comparison;
- `AuditRibbon` and lower-level confirmation components for custom layouts.

Import the bundled theme once:

```tsx
import "@grounded/react-renderer/styles.css";
```

The public playground demonstrates the components with local fixtures. A host application should connect `onDecide` and status actions to its own runtime client.
