import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { LLMResult } from "@langchain/core/outputs";

export interface AgentMetrics {
  llmCalls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export interface EvaluationMetrics {
  durationMs: number;
  evaluator: AgentMetrics;
  explorer: AgentMetrics;
  estimatedCostUsd: number;
}

export class MetricsHandler extends BaseCallbackHandler {
  name = "MetricsHandler";
  readonly data: AgentMetrics = {
    llmCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
  };

  handleLLMEnd(output: LLMResult) {
    this.data.llmCalls++;
    const usage = (output as any).llmOutput?.usage;
    if (usage) {
      this.data.inputTokens += usage.input_tokens ?? 0;
      this.data.outputTokens += usage.output_tokens ?? 0;
      this.data.cacheReadTokens += usage.cache_read_input_tokens ?? 0;
      this.data.cacheWriteTokens += usage.cache_creation_input_tokens ?? 0;
      return;
    }
    const tokenUsage = (output as any).llmOutput?.tokenUsage;
    if (tokenUsage) {
      this.data.inputTokens += tokenUsage.promptTokens ?? 0;
      this.data.outputTokens += tokenUsage.completionTokens ?? 0;
    }
  }
}

export class MessageAccumulatorHandler extends MetricsHandler {
  name = "MessageAccumulatorHandler";
  readonly toolResults: string[] = [];

  handleToolEnd(output: unknown) {
    const text = typeof output === "string" ? output : (output as any)?.content ?? JSON.stringify(output);
    if (text?.trim()) this.toolResults.push(text);
  }
}

export class EvaluatorMetricsHandler extends MetricsHandler {
  name = "EvaluatorMetricsHandler";
  readonly explorerResults: string[] = [];

  handleToolEnd(output: unknown) {
    const text = typeof output === "string" ? output : (output as any)?.content ?? JSON.stringify(output);
    if (text?.trim()) this.explorerResults.push(text);
  }
}
