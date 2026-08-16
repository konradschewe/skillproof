---
name: skill-env-config
description: Centralized environment variable configuration with typed defaults
---

# Environment Variable Configuration

All configuration must be centralized and read from environment variables with explicit fallback defaults.

## Requirements

1. Export a single `config` object that holds all configuration values
2. Read each value from `process.env` using the nullish coalescing operator (`??`) with a default
3. Numeric env vars must be wrapped with `Number()`
4. All application code reads config from this object — not directly from `process.env`

## Example

```ts
// src/config.ts
export const config = {
  port: Number(process.env.PORT ?? "3000"),
  apiKey: process.env.API_KEY ?? "",
  logLevel: process.env.LOG_LEVEL ?? "info",
};
```

```ts
// src/server.ts
import { config } from "./config.js";
// use config.port, config.apiKey, etc.
```
