import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { LLMResult } from "@langchain/core/outputs";
import { c, EVAL_PREFIX, EXPL_PREFIX } from "./colors.js";
import { truncate, formatParams, formatResult, friendlyTool } from "./formatters.js";

export class VerboseHandler extends BaseCallbackHandler {
  name = "VerboseHandler";
  private toolCallCount = 0;

  constructor(private label: "evaluator" | "explorer") {
    super();
  }

  handleLLMEnd(output: LLMResult) {
    const text = output.generations?.[0]?.[0]?.text?.trim();
    if (!text) return;

    const prefix = this.label === "explorer" ? "  " : "";
    const tag = this.label === "evaluator"
      ? `${c.evalLabel}💭 evaluator thinks:${c.reset}`
      : `  ${c.exprLabel}💭 explorer thinks:${c.reset}`;

    const lines = text.split("\n").map(l => `${prefix}  ${c.think}${c.italic}${l}${c.reset}`).join("\n");
    process.stderr.write(`\n${tag}\n${lines}\n`);
  }

  handleToolStart(tool: unknown, input: string, _runId: string, _parentRunId?: string, _tags?: string[], _metadata?: Record<string, unknown>, name?: string) {
    this.toolCallCount++;
    const toolName = name ?? (tool as any)?.kwargs?.name ?? "tool";
    const friendly = friendlyTool(toolName);

    if (this.label === "evaluator" && toolName === "explore_codebase") {
      let question = "";
      try { question = JSON.parse(input)?.question ?? ""; } catch {}
      process.stderr.write(
        `\n${EVAL_PREFIX} ${c.toolName}${c.bold}explore_codebase${c.reset}` +
        ` ${c.exprBg}${c.exprLabel}${c.bold} ▶ explorer subagent ${c.reset}\n` +
        `  ${c.dim}question:${c.reset} ${truncate(question, 200)}\n`
      );
    } else if (this.label === "evaluator") {
      process.stderr.write(
        `\n${EVAL_PREFIX} ${c.toolName}${c.bold}${friendly}${c.reset}\n` +
        `${formatParams(input)}\n`
      );
    } else {
      process.stderr.write(
        `\n${EXPL_PREFIX} ${c.toolName}${c.bold}${friendly}${c.reset}\n` +
        `${formatParams(input)}\n`
      );
    }
  }

  handleToolEnd(output: unknown) {
    if (this.label === "evaluator") {
      this._renderEvaluatorToolEnd(output);
    } else {
      process.stderr.write(`  ${c.dim}↳ result:${c.reset}\n${formatResult(output)}\n`);
    }
  }

  private _renderEvaluatorToolEnd(output: unknown): void {
    let raw: string;
    if (typeof output === "string") {
      raw = output;
    } else if (typeof (output as any)?.content === "string") {
      raw = (output as any).content;
    } else {
      raw = JSON.stringify(output);
    }

    let rendered = raw;
    try {
      const obj = JSON.parse(raw);
      if (Array.isArray(obj?.findings)) {
        rendered = obj.findings.map((f: any) => {
          const file = f.file ? `${c.bold}${f.file}${c.reset}` : "";
          const snip = f.snippet ? `\n      ${c.dim}${truncate(f.snippet, 160)}${c.reset}` : "";
          const rel  = f.relevance ? `\n      ${c.think}${truncate(f.relevance, 120)}${c.reset}` : "";
          return `    ${c.exprLabel}▸${c.reset} ${file}${rel}${snip}`;
        }).join("\n");
      } else {
        rendered = `    ${c.dim}${truncate(raw, 400)}${c.reset}`;
      }
    } catch {
      rendered = `    ${c.dim}${truncate(raw, 400)}${c.reset}`;
    }

    process.stderr.write(`${c.exprLabel}  ◀ explorer findings:${c.reset}\n${rendered}\n`);
  }
}
