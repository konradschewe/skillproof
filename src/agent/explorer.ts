import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { HumanMessage } from "@langchain/core/messages";
import { createAgent, toolStrategy } from "langchain";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { StructuredToolInterface } from "@langchain/core/tools";
import {
  buildExplorerUserPrompt,
  EXPLORER_SYSTEM_PROMPT,
  ExplorationSchema,
} from "./prompt.js";
import { VerboseHandler } from "./verbose.js";
import { MetricsHandler, type AgentMetrics } from "./metrics.js";

const RECURSION_LIMIT = 40;

export class ExplorerAgent {
  readonly metricsHandler = new MetricsHandler();

  constructor(
    private model: BaseChatModel,
    private tools: StructuredToolInterface[],
    private verbose = false
  ) {}

  get metrics(): AgentMetrics {
    return this.metricsHandler.data;
  }

  async explore(question: string): Promise<string> {
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
      { messages: [new HumanMessage(buildExplorerUserPrompt(question))] },
      { callbacks, recursionLimit: RECURSION_LIMIT } as any
    );

    return JSON.stringify(result.structuredResponse, null, 2);
  }

  asTool(): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: "explore_codebase",
      description:
        "Ask a targeted question about the codebase. Returns relevant files and code snippets. Use for finding implementations, patterns, or specific constructs.",
      schema: z.object({
        question: z.string().describe(
          "A specific question about the codebase, e.g. 'How are API errors handled in route handlers?'"
        ),
      }),
      func: ({ question }) => this.explore(question),
    });
  }
}
