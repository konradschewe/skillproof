import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";

export interface CacheEntry {
  skillName: string;
  skillHash: string;
  repoHash: string;
  result: unknown;
  evaluatedAt: string;
}

export interface Cache {
  entries: Record<string, CacheEntry>;
}

export class FileCache {
  private cachePath: string;
  private cache: Cache = { entries: {} };

  constructor(cacheDir: string) {
    this.cachePath = join(cacheDir, "skillproof-cache.json");
  }

  async load(): Promise<void> {
    if (!existsSync(this.cachePath)) return;
    const raw = await readFile(this.cachePath, "utf-8");
    this.cache = JSON.parse(raw);
  }

  async save(): Promise<void> {
    await mkdir(dirname(this.cachePath), { recursive: true });
    await writeFile(this.cachePath, JSON.stringify(this.cache, null, 2));
  }

  get(skillName: string, skillHash: string, repoHash: string): CacheEntry | null {
    const entry = this.cache.entries[skillName];
    if (!entry || entry.skillHash !== skillHash || entry.repoHash !== repoHash) return null;
    return entry;
  }

  set(skillName: string, skillHash: string, repoHash: string, result: unknown): void {
    this.cache.entries[skillName] = {
      skillName,
      skillHash,
      repoHash,
      result,
      evaluatedAt: new Date().toISOString(),
    };
  }
}
