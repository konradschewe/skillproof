# Skillproof

Verify that Claude agent skills are correctly adopted in your codebase.

Skillproof reads `SKILL.md` files from a skills directory and uses an LLM to evaluate whether your project's code actually implements the practices each skill describes. Results are cached per skill and only re-evaluated when the skills repo changes.

## Installation

```bash
npm install -g skillproof
```

Or run directly with npx:

```bash
npx skillproof --skills-dir .claude/plugins/my-plugin/skills
```

## Usage

```bash
skillproof \
  --skills-dir .claude/plugins/sap-application-foundation-agent-skills/skills \
  --repo-path . \
  --provider anthropic \
  --model claude-sonnet-5 \
  --output-format markdown
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--skills-dir` | Path to directory containing `SKILL.md` files | required |
| `--repo-path` | Path to the repository to evaluate | current directory |
| `--provider` | LLM provider: `anthropic` or `aicore` | `anthropic` |
| `--model` | Model ID | `claude-sonnet-5` |
| `--cache-dir` | Directory for caching results | `.skillproof-cache` |
| `--output-format` | `markdown`, `json`, `github-summary`, or `html` | `markdown` |
| `--output-file` | Write output to file instead of stdout | — |

## Providers

### Anthropic

```bash
export ANTHROPIC_API_KEY=your-api-key
skillproof --provider anthropic --model claude-sonnet-5 --skills-dir ...
```

### SAP AI Core

```bash
# Configure AI Core credentials (see https://sap.github.io/ai-sdk/docs/js/langchain/openai)
skillproof --provider aicore --model gpt-4o --skills-dir ...
```

## Caching

Results are cached in `.skillproof-cache/` (gitignored) and keyed by skill name + the HEAD commit SHA of the skills directory. A skill is only re-evaluated when its source has changed. If the cache expires or is deleted, all skills are re-evaluated from scratch.

## GitHub Actions

### Step Summary (always active)

```yaml
- name: Run Skillproof
  run: |
    agpm sync
    npx skillproof \
      --skills-dir .claude/plugins/sap-application-foundation-agent-skills/skills \
      --provider anthropic \
      --output-format github-summary
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

Results are automatically written to the GitHub Actions step summary.

### HTML Report on GitHub Pages (optional)

Publish a standalone HTML report to GitHub Pages on a schedule. The report is a static snapshot of the latest evaluation — no server needed.

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

      - name: Sync skills
        run: agpm sync

      - name: Run Skillproof
        run: |
          npx skillproof \
            --skills-dir .claude/plugins/sap-application-foundation-agent-skills/skills \
            --provider anthropic \
            --output-format html \
            --output-file skillproof-report.html
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Publish to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: .
          include_files: skillproof-report.html
          destination_dir: skillproof
          keep_files: true
```

The report is published to `https://<owner>.github.io/<repo>/skillproof/skillproof-report.html`.

> **Note:** GitHub Pages must be enabled for the repository (Settings → Pages → Source: Deploy from branch `gh-pages`). If your repo already uses Pages, the report is placed in the `/skillproof/` subdirectory to avoid conflicts.

## Output

```
# Skillproof Report

## Summary

| Skill                        | Status          |
|------------------------------|-----------------|
| sap-agent-instrumentation    | ✅ adopted      |
| sap-agent-guardrails         | ⚠️ partial      |
| sap-agent-bootstrap          | ❌ missing      |

## Details
...
```
