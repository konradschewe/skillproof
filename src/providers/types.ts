import type { SkillEvaluationResult } from "../evaluator/types.js";
import type { Skill } from "../skills/types.js";

export type ProviderType = "anthropic" | "aicore";

export interface EvaluationInput {
  skill: Skill;
  codeContext: string;
}

export interface LLMProvider {
  readonly type: ProviderType;
  evaluate(input: EvaluationInput): Promise<SkillEvaluationResult>;
}
