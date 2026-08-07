import { AzureOpenAiChatClient } from "@sap-ai-sdk/langchain";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { LLMProvider, EvaluationInput } from "./types.js";
import type { SkillEvaluationResult } from "../evaluator/types.js";
import { SYSTEM_PROMPT, buildUserPrompt, EvaluationSchema } from "./prompt.js";

export class AICoreProvider implements LLMProvider {
  readonly type = "aicore" as const;
  private modelId: string;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  async evaluate({ skill, codeContext }: EvaluationInput): Promise<SkillEvaluationResult> {
    const model = new AzureOpenAiChatClient({ modelName: this.modelId });
    const structured = model.withStructuredOutput(EvaluationSchema);

    const result = await structured.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(buildUserPrompt(skill, codeContext)),
    ]);

    return { skillName: skill.name, ...result };
  }
}
