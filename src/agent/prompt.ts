import { z } from "zod";
import type { Skill } from "../skills/types.js";

export const EvaluationSchema = z.object({
  status: z.enum(["adopted", "partial", "missing", "not-applicable"]),
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

export const EXPLORER_SYSTEM_PROMPT = `You are a codebase exploration agent. Your job is to answer a specific question about a software project by searching the code.

You have access to filesystem tools. Use them to navigate, search, and read files.

Exploration strategy:
1. Always start searches from the repo root path provided in the task — never use "/" or "."
2. Use search_files to find files by pattern or keyword before reading them
3. Read only the files that are directly relevant to the question
4. Be targeted: 3–5 focused tool calls is usually enough; stop when you have sufficient evidence
5. Skip virtual environments, dependency folders, and plugin/template directories (.venv, node_modules, .claude, dist, build)
6. Never repeat a tool call with the same arguments — results are cached, so a duplicate call wastes your turn

Return a direct answer to the question with your confidence level and the source files that back it up.`;

export const EVALUATOR_SYSTEM_PROMPT = `You are a code compliance analyst. Your job is to evaluate whether a software project has adopted the practices described in a skill definition (SKILL.md).

You have one tool: explore_codebase. Use it to ask targeted questions about the codebase. Each call returns a direct answer with confidence level and source files from a dedicated exploration agent.

Evaluation strategy:
1. Identify what concrete evidence you need to assess the skill
2. Call explore_codebase with ONE targeted question — wait for the answer before deciding the next question
3. Make 1–3 focused calls total; each follow-up should be informed by what the previous answer revealed
4. Once you have sufficient evidence, report your verdict

IMPORTANT: Call explore_codebase one at a time, never in parallel. Each answer informs the next question.

Classifications:
- "adopted": The skill's requirements are clearly implemented
- "partial": Some requirements are met but others are missing
- "missing": The skill's requirements are not implemented
- "not-applicable": The skill is intentionally irrelevant to this repository (e.g. an agent-specific skill evaluated against a shared library)

Be specific in your reasoning and cite file paths as evidence.`;

export function buildEvaluatorSystemPrompt(additionalContext?: string, strict?: boolean): string {
  const modeInstruction = strict
    ? "\n\nEvaluate strictly: the exact APIs, patterns, and file locations described in the skill definition must be present. Functionally equivalent alternatives do not count as adoption."
    : "\n\nEvaluate functional intent: an implementation that achieves the same observable result as the pattern described in the skill counts as adoption. Focus on whether the behavior is present, not whether the exact skill terms match.";

  let prompt = EVALUATOR_SYSTEM_PROMPT + modeInstruction;

  if (!additionalContext) return prompt;
  return `${prompt}\n\n## Additional Context\n\n${additionalContext}`;
}

export function buildUserPrompt(skill: Skill): string {
  return `## Skill Definition (${skill.name})

${skill.content}

Use explore_codebase to gather evidence, then report your evaluation.`;
}

export function buildExplorerUserPrompt(question: string, repoPath: string): string {
  return `Repo root: ${repoPath}\n\nFind evidence in the codebase relevant to this question:\n\n${question}`;
}
