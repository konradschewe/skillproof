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
  outputFormat?: string | string[];
  outputFile?: string | Array<string | undefined>;
  failOn?: string;
  verbose?: boolean;
}

const PATH_KEYS: (keyof CliConfig)[] = ["skillsDir", "repoPath", "cacheDir"];

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
  // Resolve outputFile path(s)
  if (typeof result.outputFile === "string") {
    result.outputFile = resolve(dir, result.outputFile);
  } else if (Array.isArray(result.outputFile)) {
    result.outputFile = result.outputFile.map((f) => (f ? resolve(dir, f) : f));
  }
  return result;
}
