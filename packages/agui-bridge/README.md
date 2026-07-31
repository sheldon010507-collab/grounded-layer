# @grounded/agui-bridge

This package maps public Grounded run events to AG-UI lifecycle events and encodes them as SSE records.

- `run.created` and `run.resumed` become `RUN_STARTED`.
- `run.completed` becomes `RUN_FINISHED` with a successful outcome.
- `run.failed` becomes `RUN_ERROR`.
- `run.suspended` becomes `RUN_FINISHED` with an interrupt outcome.
- Other Grounded events are preserved as `CUSTOM` events named `grounded.<event-type>`.

The bridge does not authorize, execute, or retry actions. It is a transport adapter; the runtime remains responsible for making the event stream truthful.

```ts
import { encodeSSE, toAGUIEvent } from "@grounded/agui-bridge";

const aguiEvent = toAGUIEvent(harnessEvent);
const sseRecord = encodeSSE(aguiEvent);
```
