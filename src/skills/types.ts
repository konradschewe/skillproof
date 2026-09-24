export interface SkillFile {
  path: string; // relative to skill directory, e.g. "SKILL.md", "references/pr-sequence.md"
  content: string;
}

export interface Skill {
  name: string;
  path: string;
  files: SkillFile[];
}
