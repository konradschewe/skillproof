export type AdoptionStatus = "adopted" | "divergent" | "partial" | "missing" | "not-applicable";

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
