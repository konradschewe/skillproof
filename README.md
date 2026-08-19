# Skillproof

**Verify that Claude agent skills are correctly adopted in your codebase.**

Skillproof reads `SKILL.md` files from a skills directory and uses an LLM to evaluate whether your project's code actually implements the practices each skill describes. It is designed as a quality gate — run it locally or in CI to ensure skills don't diverge from the code that's supposed to implement them.

---

## How it works

Skills are plain markdown files (`SKILL.md`) that describe what a skill requires — patterns, APIs, configurations. Skillproof uses a two-agent architecture to evaluate each one:

1. **Evaluator** (`claude-sonnet`) — reads the `SKILL.md`, decides what to look for, and makes 1–3 focused queries to the explorer. Produces a structured verdict.
2. **Explorer** (`claude-haiku`) — navigates the repository using filesystem tools (`read_file`, `list_directory`, `grep_files`, etc.) and answers the evaluator's targeted questions.

Skills are discovered by globbing `**/SKILL.md` inside `--skills-dir`. The skill name is the directory immediately containing the `SKILL.md` file (one level below `skills-dir`).

Results are [cached](#caching) so only changed skills are re-evaluated.

---

## Installation

Run directly with npx (no install required):

```bash
npx @skillproof/cli --skills-dir .claude/plugins/my-skills/skills
```

Or install globally:

```bash
npm install -g @skillproof/cli
```

---

## Quick start

```bash
export ANTHROPIC_API_KEY=your-api-key

skillproof \
  --skills-dir .claude/plugins/my-skills/skills \
  --output-format markdown
```

---

## Options

All options can be set via CLI flags or a [config file](#config-file) (`--config`). CLI flags always take precedence.

| Flag | Config key | Type | Default | Description |
|---|---|---|---|---|
| `--config <path>` | — | string | — | Path to a JSON config file. All path values inside are resolved relative to the config file. |
| `--skills-dir <path>` | `skillsDir` | string | **required** | Directory containing `SKILL.md` files. Searched recursively. |
| `--repo-path <path>` | `repoPath` | string | `process.cwd()` | Repository to evaluate. |
| `--filter <substring>` | `filter` | string | — | Only evaluate skills whose name contains this substring. |
| `--provider <type>` | `provider` | `anthropic` \| `aicore` | `anthropic` | LLM provider. See [Providers](#providers). |
| `--system-prompt <text>` | `systemPrompt` | string | — | Appended to the evaluator's system prompt. Use to describe repo-specific context (e.g. "this is a shared library, not a concrete agent"). |
| `--strict` | `strict` | boolean | `false` | Require exact APIs and patterns as specified. Without `--strict`, functionally equivalent implementations are accepted as `adopted`. See [Adoption statuses](#adoption-statuses). |
| `--concurrency <n>` | `concurrency` | integer | `1` | Number of skills to evaluate in parallel. |
| `--cache-dir <path>` | `cacheDir` | string | `.skillproof-cache` | Directory for the evaluation cache. |
| `--no-cache` | `noCache` | boolean | `false` | Skip cache and force re-evaluation of all skills. Results are still saved. |
| `--output-format <fmt>` | `outputFormat` | `markdown` \| `github-summary` \| `json` \| `html` | `markdown` | See [Output formats](#output-formats). |
| `--output-file <path>` | `outputFile` | string | — | Write output to file instead of stdout. |
| `--fail-on <statuses>` | `failOn` | comma-separated | — | Exit with code `1` if any skill matches one of the given statuses. See [CI usage](#ci-usage). |
| `--verbose` | `verbose` | boolean | `false` | Stream agent reasoning and tool calls to stderr. |

---

## Config file

Pass `--config <path>` to load options from a JSON file. All path values are resolved relative to the config file's directory. CLI flags always override config values.

```json
{
  "skillsDir": "../skills",
  "repoPath": ".",
  "provider": "anthropic",
  "outputFormat": "markdown",
  "outputFile": "report.md",
  "concurrency": 5,
  "cacheDir": ".skillproof-cache",
  "noCache": false,
  "filter": "sap-agent-bootstrap",
  "systemPrompt": "This repository is a shared base library. Evaluate skills accordingly.",
  "strict": false,
  "failOn": "missing,partial"
}
```

---

## Providers

### Anthropic (default)

Uses `claude-sonnet` as evaluator and `claude-haiku` as explorer.

```bash
export ANTHROPIC_API_KEY=your-api-key
skillproof --provider anthropic --skills-dir ...
```

Optional: set `ANTHROPIC_BASE_URL` to override the API endpoint.

### SAP AI Core

Uses `anthropic--claude-4.6-sonnet` (evaluator) and `anthropic--claude-4.5-haiku` (explorer). These deployments must exist in your AI Core instance under the configured resource group.

```bash
export AICORE_SERVICE_KEY='{"clientid":"...","clientsecret":"...","url":"...","tokenurl":"..."}'
skillproof --provider aicore --skills-dir ...
```

`AICORE_SERVICE_KEY` must be the full service key JSON from BTP. Optionally set `AICORE_RESOURCE_GROUP` (defaults to `"default"`).

---

## Adoption statuses

Each skill is assigned one of five statuses:

| Status | Icon | Meaning |
|---|---|---|
| `adopted` | ✅ | The skill's requirements are clearly implemented. |
| `divergent` | 🔵 | All required behaviors are present but via a different API or pattern than the skill prescribes. |
| `partial` | ⚠️ | Some required behaviors are genuinely absent — not just implemented differently. |
| `missing` | ❌ | The skill's requirements are not implemented at all. |
| `not-applicable` | ➖ | The skill is intentionally irrelevant to this repository. |

**Strict mode** (`--strict`): `divergent` is no longer an acceptable outcome. The exact APIs and patterns described in the skill must be present. Without `--strict`, a functionally equivalent implementation counts as `adopted`, and only a complete-but-different implementation gets `divergent`.

---

## Output formats

### `markdown` (default)

A `# Skillproof Report` with a summary table, per-skill reasoning, and evidence (file paths / snippets). Also includes a metrics section (tokens, estimated cost, duration) for freshly evaluated skills.

### `github-summary`

Identical to `markdown`. When the env var `GITHUB_STEP_SUMMARY` is set (automatically in GitHub Actions), the report is additionally written to the Actions step summary.

### `json`

The raw evaluation report as JSON:

```json
{
  "repoPath": "...",
  "skillsDir": "...",
  "evaluatedAt": "2026-08-18T10:00:00.000Z",
  "results": [
    {
      "skillName": "sap-agent-bootstrap",
      "status": "adopted",
      "reasoning": "...",
      "evidence": ["harness/agent.py", "harness/config.py"],
      "metrics": {
        "durationMs": 12300,
        "estimatedCostUsd": 0.0042,
        "evaluator": { "llmCalls": 2, "inputTokens": 5000, "outputTokens": 300, "cacheReadTokens": 0, "cacheWriteTokens": 0 },
        "explorer":  { "llmCalls": 3, "inputTokens": 8000, "outputTokens": 500, "cacheReadTokens": 0, "cacheWriteTokens": 0 }
      }
    }
  ]
}
```

### `html`

A rendered standalone HTML report with a summary dashboard, status cards, cost/token metrics, and a per-skill detail table. Suitable for publishing to GitHub Pages.

---

## CI usage

Use `--fail-on` to turn specific statuses into a non-zero exit code:

```bash
skillproof --skills-dir ... --fail-on missing,partial
```

Exit codes:

| Code | Condition |
|---|---|
| `0` | All skills evaluated; no `--fail-on` statuses matched. |
| `1` | A `--fail-on` status was matched, or an unrecoverable error occurred (missing `--skills-dir`, no `SKILL.md` files found, LLM error, etc.). |

Progress and per-skill metrics are always written to stderr, separate from the report output.

---

## Caching

Results are cached in `<cache-dir>/skillproof-cache.json` (default: `.skillproof-cache/skillproof-cache.json`).

A cached result is used when both of these match the previous run:
- **Skill hash** — content hash of the skill's directory
- **Repo hash** — HEAD commit SHA of the repository being evaluated

Use `--no-cache` to force re-evaluation regardless. Results are still saved to the cache after evaluation.

---

## GitHub Action

Use Skillproof in CI with the dedicated [skillproof-action](https://github.com/konradschewe/skillproof-action):

```yaml
- uses: actions/checkout@v4

- uses: konradschewe/skillproof-action@v1
  with:
    skills-dir: .claude/plugins/my-skills/skills
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

See [konradschewe/skillproof-action](https://github.com/konradschewe/skillproof-action) for all inputs, GitHub Pages publishing, and provider configuration.

### Full workflow example

```yaml
# .github/workflows/skillproof.yml
name: Skillproof

on:
  schedule:
    - cron: "0 6 * * 1"  # every Monday at 6am
  workflow_dispatch:

permissions:
  contents: write

jobs:
  skillproof:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: konradschewe/skillproof-action@v1
        with:
          skills-dir: .claude/plugins/my-skills/skills
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          concurrency: '5'
          fail-on: missing,partial
          publish-pages: true
```
