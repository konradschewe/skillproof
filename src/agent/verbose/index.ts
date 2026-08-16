import { c } from "./colors.js";

export function printSkillBanner(skillName: string, index: number, total: number): void {
  const label = `${c.skillBg}${c.skillFg}${c.bold}  SKILL ${index}/${total}  ${c.reset}`;
  const name  = `${c.bold} ${skillName}${c.reset}`;
  const line  = `${c.dim}${"─".repeat(60)}${c.reset}`;
  process.stderr.write(`\n${line}\n${label}${name}\n${line}\n`);
}

export { VerboseHandler } from "./handler.js";
