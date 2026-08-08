import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { LLMResult } from "@langchain/core/outputs";

export class VerboseHandler extends BaseCallbackHandler {
  name = "VerboseHandler";

  constructor(private label: string) {
    super();
  }

  handleLLMEnd(output: LLMResult) {
    const text = output.generations?.[0]?.[0]?.text;
    if (text?.trim()) {
      process.stderr.write(`\n[${this.label}:llm] ${text.trim()}\n`);
    }
  }

  handleToolStart(_tool: unknown, input: string) {
    try {
      process.stderr.write(
        `\n[${this.label}:tool] ${JSON.stringify(JSON.parse(input), null, 2)}\n`
      );
    } catch {
      process.stderr.write(`\n[${this.label}:tool] ${input}\n`);
    }
  }

  handleToolEnd(output: unknown) {
    const text =
      typeof output === "string"
        ? output
        : typeof (output as any)?.content === "string"
        ? (output as any).content
        : JSON.stringify(output);
    const truncated = text.length > 500 ? text.slice(0, 500) + " …" : text;
    process.stderr.write(`[${this.label}:tool result] ${truncated}\n`);
  }
}
