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

## GitHub Action

Use Skillproof via the dedicated [skillproof-action](https://github.com/konradschewe/skillproof-action):

```yaml
- uses: actions/checkout@v4

- uses: konradschewe/skillproof-action@v1
  with:
    skills-dir: .claude/plugins/my-skills/skills
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

See [konradschewe/skillproof-action](https://github.com/konradschewe/skillproof-action) for full documentation including GitHub Pages publishing.

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
