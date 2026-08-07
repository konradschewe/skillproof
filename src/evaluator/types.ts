export type AdoptionStatus = "adopted" | "partial" | "missing";

export interface SkillEvaluationResult {
  skillName: string;
  status: AdoptionStatus;
  reasoning: string;
  evidence: string[];
}

export interface EvaluationReport {
  repoPath: string;
  skillsDir: string;
  evaluatedAt: string;
  results: SkillEvaluationResult[];
}
