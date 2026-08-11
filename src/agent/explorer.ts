import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { HumanMessage } from "@langchain/core/messages";
import { createAgent, toolStrategy } from "langchain";
import { GraphRecursionError } from "@langchain/langgraph";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { StructuredToolInterface } from "@langchain/core/tools";
import {
  buildExplorerUserPrompt,
  EXPLORER_SYSTEM_PROMPT,
  ExplorationSchema,
} from "./prompt.js";
import { VerboseHandler } from "./verbose.js";
import { MetricsHandler, type AgentMetrics } from "./metrics.js";

const RECURSION_LIMIT = 16;

class MessageAccumulatorHandler extends MetricsHandler {
  name = "MessageAccumulatorHandler";
  readonly toolResults: string[] = [];

  handleToolEnd(output: unknown) {
    const text = typeof output === "string" ? output : (output as any)?.content ?? JSON.stringify(output);
    if (text?.trim()) this.toolResults.push(text);
  }
}

export class ExplorerAgent {
  readonly metricsHandler = new MessageAccumulatorHandler();
  private exploring = false;

  constructor(
    private model: BaseChatModel,
    private tools: StructuredToolInterface[],
    private repoPath: string,
    private verbose = false
  ) {}

  get metrics(): AgentMetrics {
    return this.metricsHandler.data;
  }

  async explore(question: string): Promise<string> {
    // Prevent parallel calls — each answer must inform the next question
    if (this.exploring) {
      return JSON.stringify({
        answer: "Another exploration is already in progress. Please wait for it to complete before asking a new question.",
        confidence: "low" as const,
        sources: [],
      });
    }
    this.exploring = true;
    try {
      const agent = createAgent({
        model: this.model,
        tools: this.tools,
        systemPrompt: EXPLORER_SYSTEM_PROMPT,
        responseFormat: toolStrategy(ExplorationSchema as any) as any,
      });

      const callbacks = this.verbose
        ? [new VerboseHandler("explorer"), this.metricsHandler]
        : [this.metricsHandler];

      const result = await agent.invoke(
        { messages: [new HumanMessage(buildExplorerUserPrompt(question, this.repoPath))] },
        { callbacks, recursionLimit: RECURSION_LIMIT } as any
      );
      return JSON.stringify(result.structuredResponse, null, 2);
    } catch (err) {
      if (!(err instanceof GraphRecursionError)) throw err;
      console.warn(`  [warn]  explorer hit recursion limit (${RECURSION_LIMIT}) — summarizing partial findings with extra LLM call`);
      const partialFindings = this.metricsHandler.toolResults
        .filter((t: string) => t.trim().length > 0)
        .join("\n---\n");
      const structured = this.model.withStructuredOutput(ExplorationSchema);
      const fallback = await structured.invoke(
        `The following file contents were read before hitting the exploration limit. ` +
        `Synthesize them into a structured answer for the original question: "${question}"\n\n` +
        `Partial findings:\n${partialFindings || "none gathered"}`
      );
      return JSON.stringify(fallback, null, 2);
    } finally {
      this.exploring = false;
    }
  }

  asTool(): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: "explore_codebase",
      description:
        "Ask a targeted question about the codebase. Returns a direct answer with confidence level and source files. Call one at a time — each answer informs the next question.",
      schema: z.object({
        question: z.string().describe(
          "A specific question about the codebase, e.g. 'Does main.py instantiate AgentCapabilities with an extensions= parameter?'"
        ),
      }),
      func: ({ question }) => this.explore(question),
    });
  }
}
