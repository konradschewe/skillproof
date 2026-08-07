import { readdir, readFile, stat } from "fs/promises";
import { join } from "path";

const RELEVANT_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".java",
  ".yaml", ".yml", ".json", ".md", ".toml",
]);

const IGNORED_DIRS = new Set([
  "node_modules", "dist", ".git", ".claude", "vendor", "__pycache__",
]);

const MAX_CONTEXT_CHARS = 80_000;

export async function collectCodeContext(repoPath: string): Promise<string> {
  const files: string[] = [];
  await walk(repoPath, repoPath, files);

  const chunks: string[] = [];
  let totalChars = 0;

  for (const file of files) {
    if (totalChars >= MAX_CONTEXT_CHARS) break;
    try {
      const content = await readFile(file, "utf-8");
      const relative = file.replace(repoPath + "/", "");
      const chunk = `### ${relative}\n\`\`\`\n${content}\n\`\`\`\n`;
      totalChars += chunk.length;
      chunks.push(chunk);
    } catch {
      // skip unreadable files
    }
  }

  return chunks.join("\n");
}

async function walk(base: string, dir: string, files: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(base, full, files);
    } else if (entry.isFile()) {
      const ext = "." + entry.name.split(".").pop();
      if (RELEVANT_EXTENSIONS.has(ext)) {
        files.push(full);
      }
    }
  }
}
