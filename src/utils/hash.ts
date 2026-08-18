import { createHash } from "crypto";
import { readdir, readFile } from "fs/promises";
import { join, relative } from "path";
import { execSync } from "child_process";

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

export async function hashDirectory(dir: string): Promise<string> {
  const files = (await collectFiles(dir)).sort();
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(relative(dir, file));
    hash.update(await readFile(file));
  }
  return hash.digest("hex").slice(0, 16);
}

export function getRepoHash(repoPath: string): string {
  try {
    return execSync("git rev-parse HEAD", { cwd: repoPath, encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}
