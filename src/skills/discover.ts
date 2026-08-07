import { glob } from "glob";
import { readFile } from "fs/promises";
import { join } from "path";
import type { Skill } from "./types.js";

export async function discoverSkills(skillsDir: string): Promise<Skill[]> {
  const pattern = join(skillsDir, "**/SKILL.md");
  const files = await glob(pattern, { absolute: true });

  const skills = await Promise.all(
    files.map(async (filePath) => {
      const content = await readFile(filePath, "utf-8");
      const relativePath = filePath.replace(skillsDir + "/", "");
      const name = relativePath.split("/")[0];
      return { name, path: filePath, content };
    })
  );

  return skills;
}
