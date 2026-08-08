import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createAgent, toolStrategy } from "langchain";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import type { SkillEvaluationResult } from "../evaluator/types.js";
import type { LLMProvider } from "../providers/types.js";
import type { Skill } from "../skills/types.js";
import { buildUserPrompt, EvaluationSchema, EVALUATOR_SYSTEM_PROMPT } from "./prompt.js";
import { loadExcludePatterns, prepareExplorerTools } from "./tools.js";
import { VerboseHandler } from "./verbose.js";
import { ExplorerAgent } from "./explorer.js";
import { MetricsHandler, estimateCost, type EvaluationMetrics } from "./metrics.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RECURSION_LIMIT = 15;

export class EvaluationAgent {
  constructor(
    private provider: LLMProvider,
    private verbose = false
  ) {}

  async evaluate(skill: Skill, repoPath: string): Promise<SkillEvaluationResult> {
    const serverPath = resolve(
      __dirname,
      "../../node_modules/@modelcontextprotocol/server-filesystem/dist/index.js"
    );

    const mcp = new MultiServerMCPClient({
      fs: { transport: "stdio", command: "node", args: [serverPath, repoPath] },
    });

    try {
      const startMs = Date.now();

      const excludePatterns = await loadExcludePatterns(repoPath);
      const explorerTools = prepareExplorerTools(await mcp.getTools(), excludePatterns);
      const model = this.provider.createModel();

      const explorer = new ExplorerAgent(model, explorerTools, this.verbose);
      const evaluatorMetricsHandler = new MetricsHandler();

      const evaluator = createAgent({
        model,
        tools: [explorer.asTool()],
        systemPrompt: EVALUATOR_SYSTEM_PROMPT,
        responseFormat: toolStrategy(EvaluationSchema as any) as any,
      });

      const callbacks = this.verbose
        ? [new VerboseHandler("evaluator"), evaluatorMetricsHandler]
        : [evaluatorMetricsHandler];

      const result = await evaluator.invoke(
        { messages: [new HumanMessage(buildUserPrompt(skill))] },
        { callbacks, recursionLimit: RECURSION_LIMIT } as any
      );

      const metrics: EvaluationMetrics = {
        durationMs: Date.now() - startMs,
        evaluator: evaluatorMetricsHandler.data,
        explorer: explorer.metrics,
        estimatedCostUsd: 0,
      };
      metrics.estimatedCostUsd = await estimateCost(metrics, this.provider.modelId);

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
