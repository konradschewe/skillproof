import { readFileSync } from "fs";
import { resolve, dirname } from "path";

export interface CliConfig {
  skillsDir?: string;
  repoPath?: string;
  filter?: string;
  provider?: string;
  systemPrompt?: string;
  strict?: boolean;
  concurrency?: number;
  cacheDir?: string;
  noCache?: boolean;
  outputFormat?: string;
  outputFile?: string;
  failOn?: string;
  verbose?: boolean;
}

const PATH_KEYS: (keyof CliConfig)[] = ["skillsDir", "repoPath", "cacheDir", "outputFile"];

export function loadConfigFile(configPath: string): CliConfig {
  const absPath = resolve(configPath);
  const raw = JSON.parse(readFileSync(absPath, "utf-8")) as CliConfig;
  const dir = dirname(absPath);
  const result = { ...raw };
  for (const key of PATH_KEYS) {
    if (typeof result[key] === "string") {
      (result as Record<string, unknown>)[key] = resolve(dir, result[key] as string);
    }
  }
  return result;
}
