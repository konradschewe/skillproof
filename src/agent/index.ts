import { HumanMessage } from "@langchain/core/messages";
import { GraphRecursionError } from "@langchain/langgraph";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createAgent, toolStrategy } from "langchain";
import { createRequire } from "module";
import { z } from "zod";
import type { SkillEvaluationResult } from "../evaluator/types.js";
import type { LLMProvider } from "../providers/types.js";
import type { Skill } from "../skills/types.js";
import { ExplorerAgent } from "./explorer.js";
import { estimateCost, MetricsHandler, type EvaluationMetrics } from "./metrics.js";
import { buildUserPrompt, EvaluationSchema, EVALUATOR_SYSTEM_PROMPT } from "./prompt.js";
import { loadExcludePatterns, prepareExplorerTools } from "./tools.js";
import { VerboseHandler } from "./verbose.js";

const RECURSION_LIMIT = 15;

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
    private verbose = false
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
        systemPrompt: EVALUATOR_SYSTEM_PROMPT,
        responseFormat: toolStrategy(EvaluationSchema as any) as any,
      });

      const callbacks = this.verbose
        ? [new VerboseHandler("evaluator"), evaluatorMetricsHandler]
        : [evaluatorMetricsHandler];

      let result: Awaited<ReturnType<typeof evaluator.invoke>>;
      try {
        result = await evaluator.invoke(
          { messages: [new HumanMessage(buildUserPrompt(skill))] },
          { callbacks, recursionLimit: RECURSION_LIMIT } as any
        );
      } catch (err) {
        if (!(err instanceof GraphRecursionError)) throw err;
        console.warn(`  [warn]  evaluator hit recursion limit (${RECURSION_LIMIT}) — summarizing partial findings with extra LLM call`);
        const partialFindings = evaluatorMetricsHandler.explorerResults.join("\n---\n");
        const structured = model.withStructuredOutput(EvaluationSchema);
        const fallback = await structured.invoke(
          `The following exploration results were gathered before hitting the evaluation limit. ` +
          `Synthesize them into a compliance verdict for the skill: "${skill.name}"\n\n` +
          `Skill definition:\n${buildUserPrompt(skill)}\n\n` +
          `Exploration results:\n${partialFindings || "none gathered"}`
        );
        result = { structuredResponse: fallback } as any;
      }

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
