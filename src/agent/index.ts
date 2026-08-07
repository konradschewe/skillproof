import type { Skill } from "../skills/types.js";
import type { SkillEvaluationResult } from "../evaluator/types.js";
import type { LLMProvider } from "../providers/types.js";

export class EvaluationAgent {
  constructor(private provider: LLMProvider) {}

  async evaluate(skill: Skill, codeContext: string): Promise<SkillEvaluationResult> {
    return this.provider.evaluate({ skill, codeContext });
  }
}
