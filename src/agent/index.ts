import { HumanMessage } from "@langchain/core/messages";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { countTokensApproximately, createAgent, summarizationMiddleware, toolStrategy } from "langchain";
import { createRequire } from "module";
import { z } from "zod";
import type { SkillEvaluationResult } from "../evaluator/types.js";
import type { LLMProvider } from "../providers/types.js";
import type { Skill } from "../skills/types.js";
import { ExplorerAgent } from "./explorer.js";
import { estimateCost, MetricsHandler, type EvaluationMetrics } from "./metrics.js";
import { buildUserPrompt, buildEvaluatorSystemPrompt, EvaluationSchema } from "./prompt.js";
import { loadExcludePatterns, prepareExplorerTools } from "./tools.js";
import { VerboseHandler } from "./verbose.js";

const SUMMARIZE_TRIGGER_TOKENS = 150_000;

class EvaluatorMetricsHandler extends MetricsHandler {
  name = "EvaluatorMetricsHandler";
  readonly explorerResults: string[] = [];

  handleToolEnd(output: unknown) {
    const text = typeof output === "string" ? output : (output as any)?.content ?? JSON.stringify(output);
    if (text?.trim()) this.explorerResults.push(text);
  }
}

export class EvaluationAgent {
  constructor(
    private provider: LLMProvider,
    private verbose = false,
    private systemPrompt?: string
  ) {}

  async evaluate(skill: Skill, repoPath: string): Promise<SkillEvaluationResult> {
    const serverPath = createRequire(import.meta.url).resolve(
      "@modelcontextprotocol/server-filesystem/dist/index.js"
    );

    const mcp = new MultiServerMCPClient({
      fs: { transport: "stdio", command: "node", args: [serverPath, repoPath] },
    });

    try {
      const startMs = Date.now();

      const excludePatterns = await loadExcludePatterns(repoPath);
      const explorerTools = prepareExplorerTools(await mcp.getTools(), excludePatterns);
      const model = this.provider.createModel();

      const explorerModel = this.provider.createExplorerModel();
      const explorer = new ExplorerAgent(explorerModel, explorerTools, repoPath, this.verbose);
      const evaluatorMetricsHandler = new EvaluatorMetricsHandler();

      const evaluator = createAgent({
        model,
        tools: [explorer.asTool()],
        systemPrompt: buildEvaluatorSystemPrompt(this.systemPrompt),
        responseFormat: toolStrategy(EvaluationSchema as any) as any,
        middleware: [
          summarizationMiddleware({
            model,
            trigger: { tokens: SUMMARIZE_TRIGGER_TOKENS },
            keep: { tokens: 15_000 },
            tokenCounter: (messages) => countTokensApproximately(messages),
          }),
        ],
      });

      const callbacks = this.verbose
        ? [new VerboseHandler("evaluator"), evaluatorMetricsHandler]
        : [evaluatorMetricsHandler];

      const result = await evaluator.invoke(
        { messages: [new HumanMessage(buildUserPrompt(skill))] },
        { callbacks, recursionLimit: 1_000 } as any
      );

      const metrics: EvaluationMetrics = {
        durationMs: Date.now() - startMs,
        evaluator: evaluatorMetricsHandler.data,
        explorer: explorer.metrics,
        estimatedCostUsd: 0,
      };
      metrics.estimatedCostUsd = await estimateCost(metrics, this.provider.modelId, this.provider.explorerModelId);

      return {
        skillName: skill.name,
        ...(result.structuredResponse as z.infer<typeof EvaluationSchema>),
        metrics,
      };
    } finally {
      await mcp.close();
    }
  }
}
