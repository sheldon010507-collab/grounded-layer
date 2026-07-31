import type {
  AGUIEvent,
  CustomEvent,
  RunErrorEvent,
  RunFinishedEvent,
  RunStartedEvent,
} from "@ag-ui/core";
import { EventType } from "@ag-ui/core";
import type { EventEnvelope } from "@grounded/protocol";

/**
 * HarnessEvent → AG-UI(Part E.8)。生命周期事件映射到标准类型;Grounded 专有事件走
 * CUSTOM 原样透传,name 固定为 "grounded.<事件类型>",value 就是完整的 HarnessEvent——
 * 消费方(我们自己的 renderer,或任何愿意认这个 name 前缀的第三方)从 value 里拿全部细节,
 * 标准 AG-UI 客户端不认识的 CUSTOM name 会被忽略,不会报错(这就是这层桥接的意义)。
 *
 * 一个 HarnessEvent 对应恰好一个 AGUIEvent——保持一一对应,不做拆分/合并,
 * 这样调用方(SSE 输出层)可以简单地逐条转换、逐条发送。
 */
export function toAGUIEvent(envelope: EventEnvelope): AGUIEvent {
  const { event } = envelope;
  const timestamp = Date.parse(envelope.at);

  switch (event.t) {
    case "run.created":
    case "run.resumed":
      return {
        type: EventType.RUN_STARTED,
        threadId: event.runId,
        runId: event.runId,
        timestamp,
      } satisfies RunStartedEvent;

    case "run.completed":
      return {
        type: EventType.RUN_FINISHED,
        threadId: event.runId,
        runId: event.runId,
        outcome: { type: "success" },
        timestamp,
      } satisfies RunFinishedEvent;

    case "run.suspended":
      // confirm 检查点的挂起——AG-UI 自己的 interrupt outcome 正是为这类"本轮跑完了,
      // 但在等人恢复"设计的,不是我们硬凑的映射(Part E.7 的 interrupt()/Command({resume})
      // 正好也是同一个概念在 LangGraph 那边的样子)。
      return {
        type: EventType.RUN_FINISHED,
        threadId: event.runId,
        runId: event.runId,
        outcome: {
          type: "interrupt",
          interrupts: [{ id: event.runId, reason: event.reason }],
        },
        timestamp,
      } satisfies RunFinishedEvent;

    case "run.failed":
      return {
        type: EventType.RUN_ERROR,
        message: event.reason,
        timestamp,
      } satisfies RunErrorEvent;

    default:
      return {
        type: EventType.CUSTOM,
        name: `grounded.${event.t}`,
        value: event,
        timestamp,
      } satisfies CustomEvent;
  }
}

/** SSE 一行:`data: <json>\n\n`(可选 `id: <seq>\n` 前缀)。故意不依赖 @ag-ui/encoder——
 * 那个包只为了这一行还要拉进 @ag-ui/proto(protobuf 支持,我们用不上),手写这一行更简单
 * 也更少依赖。
 *
 * `opts.id` 供 Last-Event-ID 续传用(Part D/L.3#10:"SSE Last-Event-ID 续传始终以 seq
 * 为准")——调用方的 SSE 路由传 `envelope.seq` 进来,浏览器/客户端断线
 * 重连时把最后收到的 id 塞进 `Last-Event-ID` 请求头,服务端据此只重放 seq 更大的事件,
 * 不用整段重发。不传 opts 时行为和原来完全一致(非破坏性 overload)。`id` 收紧为纯
 * `number`(§5.4)——它唯一的真实来源是 `EventEnvelope.seq`,允许字符串只是给了调用方
 * 一个"手打字符串 id 也能编译过"的空子,SSE 续传的 seq 比较逻辑全程假设它是数字。 */
export function encodeSSE(event: AGUIEvent, opts?: { id?: number }): string {
  const idLine = opts?.id !== undefined ? `id: ${opts.id}\n` : "";
  return `${idLine}data: ${JSON.stringify(event)}\n\n`;
}
