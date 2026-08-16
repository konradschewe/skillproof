import { ADOPTION_STATUSES } from "../evaluator/types.js";
import { OUTPUT_FORMATS } from "../reporter/index.js";
import { PROVIDER_TYPES } from "../providers/types.js";
import type { AdoptionStatus } from "../evaluator/types.js";
import type { OutputFormat } from "../reporter/index.js";
import type { ProviderType } from "../providers/types.js";

export interface ValidatedOptions {
  provider: ProviderType;
  outputFormat: OutputFormat;
  concurrency: number;
  failStatuses: AdoptionStatus[];
}

export function validateProvider(value: string): ProviderType {
  if (!PROVIDER_TYPES.includes(value as ProviderType)) {
    throw new Error(`Invalid --provider "${value}". Must be one of: ${PROVIDER_TYPES.join(", ")}`);
  }
  return value as ProviderType;
}

export function validateOutputFormat(value: string): OutputFormat {
  if (!OUTPUT_FORMATS.includes(value as OutputFormat)) {
    throw new Error(`Invalid --output-format "${value}". Must be one of: ${OUTPUT_FORMATS.join(", ")}`);
  }
  return value as OutputFormat;
}

export function validateConcurrency(value: string): number {
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 1) {
    throw new Error(`Invalid --concurrency "${value}". Must be a positive integer.`);
  }
  return n;
}

export function validateFailStatuses(value: string | undefined): AdoptionStatus[] {
  if (!value) return [];
  const statuses = value.split(",").map((s) => s.trim()) as AdoptionStatus[];
  const invalid = statuses.filter((s) => !ADOPTION_STATUSES.includes(s));
  if (invalid.length > 0) {
    throw new Error(`Invalid --fail-on value(s): ${invalid.join(", ")}. Must be from: ${ADOPTION_STATUSES.join(", ")}`);
  }
  return statuses;
}
