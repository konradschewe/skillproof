import { z } from "zod";
import type { Skill } from "../skills/types.js";

export const EvaluationSchema = z.object({
  status: z.enum(["adopted", "partial", "missing"]),
  reasoning: z.string(),
  evidence: z.array(z.string()),
});

export const SYSTEM_PROMPT = `You are a code compliance analyst. Your job is to evaluate whether a software project has adopted the practices described in a skill definition file (SKILL.md).

A SKILL.md describes patterns, conventions, or implementation requirements that the project should follow.

Evaluate and classify:
- "adopted": The skill's requirements are clearly implemented in the codebase
- "partial": Some requirements are implemented but others are missing
- "missing": The skill's requirements are not implemented at all

Be specific in your reasoning and cite concrete evidence from the code.`;

export function buildUserPrompt(skill: Skill, codeContext: string): string {
  return `## Skill Definition (${skill.name})

${skill.content}

## Codebase Context

${codeContext}

Evaluate whether this skill has been adopted in the codebase.`;
}
