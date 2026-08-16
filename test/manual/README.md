# Manual Test

A self-contained test fixture for verifying the evaluator end-to-end against known expected outcomes.

## Structure

```
test/manual/
  configs/
    anthropic.json   uses ANTHROPIC_API_KEY
    aicore.json      uses SAP AI Core credentials
  skills/
    skill-env-config/        → expected: adopted
    skill-env-validation/    → expected: divergent
    skill-request-logging/   → expected: missing
    skill-typed-errors/      → expected: partial
  fixture-repo/
    src/
      config.ts    implements env config correctly
      env.ts       manual validation (no Zod) — divergent vs skill-env-validation
      errors.ts    partial: AppError + subtypes, but no statusCode
      server.ts    no request logging
```

## Expected Results

| Skill | Expected | Why |
|---|---|---|
| `skill-env-config` | ✅ adopted | `config.ts` exports a `config` object, reads all values from `process.env` with `??` defaults |
| `skill-env-validation` | 🔵 divergent | `env.ts` validates required vars at startup and throws on missing — all behaviors present, but via a custom `requireEnv()` helper instead of `z.object().parse()` |
| `skill-request-logging` | ❌ missing | No logging middleware anywhere in the fixture |
| `skill-typed-errors` | ⚠️ partial | `AppError` base class and two subtypes exist, but `statusCode` is missing from all subclasses and `UnauthorizedError` is absent |

## Running

```bash
# Anthropic (default) — requires ANTHROPIC_API_KEY
ANTHROPIC_API_KEY=sk-ant-... npm run test:manual

# SAP AI Core — requires credentials in environment (see below)
npm run test:manual aicore

# Single skill only
npm run test:manual anthropic -- --filter skill-env-config

# HTML output to file
npm run test:manual anthropic -- --output-format html --output-file /tmp/report.html
```

## Environment Variables

### Anthropic
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### SAP AI Core
The AI Core provider reads service credentials from the environment. Set one of:
```bash
# Option A: service key as JSON string
export AICORE_SERVICE_KEY='{"clientid":"...","clientsecret":"...","url":"...","serviceurls":{"AI_API_URL":"..."}}'

# Option B: individual vars (depends on SDK version)
export AICORE_CLIENT_ID=...
export AICORE_CLIENT_SECRET=...
export AICORE_TOKEN_URL=...
export AICORE_BASE_URL=...

# Optional: override resource group (default: "default")
export AICORE_RESOURCE_GROUP=my-rg
```

## Config File Format

The `--config` flag accepts a JSON file with any CLI option. Paths are resolved relative to the config file's location.

```json
{
  "skillsDir": "../skills",
  "repoPath": "../fixture-repo",
  "provider": "anthropic",
  "outputFormat": "markdown",
  "verbose": true,
  "concurrency": 1,
  "cacheDir": "../../../.skillproof-cache",
  "noCache": false,
  "filter": "skill-env-config",
  "systemPrompt": "Additional context for the evaluator."
}
```

CLI flags always override config file values.

## Adding a New Test Case

1. Create `test/manual/skills/<skill-name>/SKILL.md` with 2–4 concrete requirements
2. Add or modify files in `test/manual/fixture-repo/src/` to produce the desired outcome
3. Document the expected result in the table above

Keep skills small — the evaluator should reach a verdict in 3–5 tool calls.
