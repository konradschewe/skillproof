---
name: skill-env-validation
description: Validate required environment variables at startup using Zod
---

# Environment Variable Validation

Required environment variables must be validated at startup using Zod. The app must fail fast with a clear error if any required variable is missing or invalid.

## Requirements

1. Define an env schema with `z.object({ ... })`
2. Call `schema.parse(process.env)` at module load time
3. Export the parsed, typed config object — not raw `process.env`
4. A missing required variable must throw a `ZodError` with a descriptive message
5. Optional vars use `.default("value")` in the schema

## Example

```ts
import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("3000"),
  API_KEY: z.string().min(1),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export const env = envSchema.parse(process.env);
```
