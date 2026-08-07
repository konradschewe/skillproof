import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { LLMProvider, EvaluationInput } from "./types.js";
import type { SkillEvaluationResult } from "../evaluator/types.js";
import { SYSTEM_PROMPT, buildUserPrompt, EvaluationSchema } from "./prompt.js";

export class AnthropicProvider implements LLMProvider {
  readonly type = "anthropic" as const;
  private client: Anthropic;
  private modelId: string;

  constructor(modelId: string) {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.modelId = modelId;
  }

  async evaluate({ skill, codeContext }: EvaluationInput): Promise<SkillEvaluationResult> {
    const response = await this.client.messages.create({
      model: this.modelId,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(skill, codeContext) }],
      tools: [
        {
          name: "report_evaluation",
          description: "Report the skill adoption evaluation result",
          input_schema: {
            type: "object" as const,
            properties: {
              status: { type: "string", enum: ["adopted", "partial", "missing"] },
              reasoning: { type: "string" },
              evidence: { type: "array", items: { type: "string" } },
            },
            required: ["status", "reasoning", "evidence"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "report_evaluation" },
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("No tool use in response");
    }

    const parsed = EvaluationSchema.parse(toolUse.input);
    return { skillName: skill.name, ...parsed };
  }
}
