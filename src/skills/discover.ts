import { glob } from "glob";
import { readFile } from "fs/promises";
import { basename, join } from "path";
import type { Skill, SkillFile } from "./types.js";

export async function discoverSkills(skillsDir: string): Promise<Skill[]> {
  const pattern = join(skillsDir, "**/SKILL.md");
  const skillMdFiles = await glob(pattern, { absolute: true });

  const skills = await Promise.all(
    skillMdFiles.map(async (skillMdPath) => {
      const skillDir = skillMdPath.replace("/SKILL.md", "");
      const name = basename(skillDir);

      const allFilePaths = await glob(join(skillDir, "**/*"), { absolute: true, nodir: true });
      const files: SkillFile[] = await Promise.all(
        allFilePaths.map(async (filePath) => ({
          path: filePath.replace(skillDir + "/", ""),
          content: await readFile(filePath, "utf-8"),
        }))
      );

      return { name, path: skillMdPath, files };
    })
  );

  return skills;
}
