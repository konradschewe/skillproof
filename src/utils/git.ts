import { execSync } from "child_process";

export function getSkillsRepoSha(skillsDir: string): string {
  try {
    return execSync("git rev-parse HEAD", { cwd: skillsDir, encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}
