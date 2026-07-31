import { readFile, writeFile } from "node:fs/promises";
import { GroundedClient } from "@grounded/client";
import type { GroundedConfirmResult, GroundedSubmitResult } from "@grounded/protocol";
import {
  type ConformanceScenario,
  type ConformanceTarget,
  runProtocolConformance,
} from "./index.js";

function parseArgs(argv: string[]): {
  target: string;
  tokenEnv: string;
  scenario: string;
  out?: string;
} {
  const [, ...args] = argv;
  const result = {
    target: "",
    tokenEnv: "GROUNDED_API_TOKEN",
    scenario: "",
    out: undefined as string | undefined,
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const value = args[i + 1];
    if (arg === "--target" && value) result.target = value;
    if (arg === "--token-env" && value) result.tokenEnv = value;
    if (arg === "--scenario" && value) result.scenario = value;
    if (arg === "--out" && value) result.out = value;
    if (arg && value && ["--target", "--token-env", "--scenario", "--out"].includes(arg)) i++;
  }
  return result;
}

function httpTarget(client: GroundedClient): ConformanceTarget {
  return {
    name: "http",
    async createRun(goal) {
      return client.createRun({ goal });
    },
    observeFact(runId, input) {
      return client.observeFact(runId, input);
    },
    submitIntent(runId, input): Promise<GroundedSubmitResult> {
      return client.submitIntent(runId, input);
    },
    decide(runId, draft): Promise<GroundedConfirmResult> {
      return client.decide(runId, draft);
    },
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(1));
  if (!args.target || !args.scenario) {
    console.error(
      "Usage: grounded-conformance run --target <url> --scenario <file> [--token-env NAME] [--out FILE]",
    );
    process.exitCode = 1;
    return;
  }
  const scenario = JSON.parse(await readFile(args.scenario, "utf8")) as ConformanceScenario;
  const client = new GroundedClient({
    baseUrl: args.target,
    getAccessToken: () => process.env[args.tokenEnv],
  });
  const report = await runProtocolConformance(httpTarget(client), scenario);
  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (args.out) await writeFile(args.out, output, "utf8");
  console.log(output);
  if (report.failCount > 0) process.exitCode = 1;
}

void main();
