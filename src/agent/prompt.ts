import { z } from "zod";
import type { Skill } from "../skills/types.js";

export const EvaluationSchema = z.object({
  status: z.enum(["adopted", "partial", "missing"]),
  reasoning: z.string(),
  evidence: z.array(z.string()),
});

export const ExplorationSchema = z.object({
  findings: z.array(
    z.object({
      file: z.string(),
      snippet: z.string(),
      relevance: z.string(),
    })
  ),
  summary: z.string(),
});

export const EXPLORER_SYSTEM_PROMPT = `You are a codebase exploration agent. Your job is to find evidence relevant to a specific question about a software project.

You have access to filesystem tools. Use them to navigate, search, and read files.

Exploration strategy:
1. Start with directory_tree or search_files to orient yourself — never read files blindly
2. Use search_files to find files by pattern or keyword before reading them
3. Read only the files that are directly relevant to the question
4. Be targeted: 5–10 focused tool calls is better than 20 broad ones

Return your findings as structured output: each finding should include the file path, a relevant code snippet, and why it's relevant to the question.`;

export const EVALUATOR_SYSTEM_PROMPT = `You are a code compliance analyst. Your job is to evaluate whether a software project has adopted the practices described in a skill definition (SKILL.md).

You have one tool: explore_codebase. Use it to ask targeted questions about the codebase. Each call returns relevant files and snippets found by a dedicated exploration agent.

Evaluation strategy:
1. Identify what concrete evidence you need to assess the skill
2. Call explore_codebase with targeted questions (e.g. "how are API errors handled in route handlers?")
3. Make 1–3 focused calls — avoid broad or redundant questions
4. Once you have sufficient evidence, report your verdict

Classifications:
- "adopted": The skill's requirements are clearly implemented
- "partial": Some requirements are met but others are missing
- "missing": The skill's requirements are not implemented

Be specific in your reasoning and cite file paths and snippets as evidence.`;

export function buildUserPrompt(skill: Skill): string {
  return `## Skill Definition (${skill.name})

${skill.content}

Use explore_codebase to gather evidence, then report your evaluation.`;
}

export function buildExplorerUserPrompt(question: string): string {
  return `Find evidence in the codebase relevant to this question:\n\n${question}`;
}
