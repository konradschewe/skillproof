import { z } from "zod";
import type { Skill } from "../skills/types.js";

export const EvaluationSchema = z.object({
  status: z.enum(["adopted", "partial", "missing"]),
  reasoning: z.string(),
  evidence: z.array(z.string()),
});

export const SYSTEM_PROMPT = `You are a code compliance analyst. Your job is to evaluate whether a software project has adopted the practices described in a skill definition file (SKILL.md).

A SKILL.md describes patterns, conventions, or implementation requirements that the project should follow.

You have access to filesystem tools to explore the codebase. Use them to navigate directories, read relevant files, and search for patterns before forming your conclusion. Be targeted: explore only what is relevant to the skill being evaluated.

Once you have gathered sufficient evidence, call report_evaluation with your classification:
- "adopted": The skill's requirements are clearly implemented in the codebase
- "partial": Some requirements are implemented but others are missing
- "missing": The skill's requirements are not implemented at all

Be specific in your reasoning and cite concrete evidence from the code.`;

export function buildUserPrompt(skill: Skill): string {
  return `## Skill Definition (${skill.name})

${skill.content}

Explore the codebase using the available tools and evaluate whether this skill has been adopted.`;
}
