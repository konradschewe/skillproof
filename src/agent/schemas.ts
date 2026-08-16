import { z } from "zod";

export const EvaluationSchema = z.object({
  status: z.enum(["adopted", "divergent", "partial", "missing", "not-applicable"]),
  reasoning: z.string(),
  evidence: z.array(z.string()),
});

export const ExplorationSchema = z.object({
  answer: z.string().describe(
    "Direct answer to the question asked, based on what you found. Be specific: name files, line numbers, class names, dependency versions. If nothing was found, say so explicitly."
  ),
  confidence: z.enum(["high", "medium", "low"]).describe(
    "How confident are you in this answer? high = definitive evidence found, medium = partial evidence, low = inferred or nothing found"
  ),
  sources: z.array(
    z.object({
      file: z.string().describe("Repo-relative file path"),
      line: z.number().optional().describe("Relevant line number if known"),
    })
  ).describe("Files that contain the evidence for this answer"),
});
