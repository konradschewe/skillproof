export const ADOPTION_STATUSES = ["adopted", "divergent", "partial", "missing", "not-applicable"] as const;
export type AdoptionStatus = (typeof ADOPTION_STATUSES)[number];

export interface SkillEvaluationResult {
  skillName: string;
  status: AdoptionStatus;
  reasoning: string;
  evidence: string[];
  metrics?: import("../agent/metrics.js").EvaluationMetrics;
}

export interface EvaluationReport {
  repoPath: string;
  skillsDir: string;
  evaluatedAt: string;
  results: SkillEvaluationResult[];
}
