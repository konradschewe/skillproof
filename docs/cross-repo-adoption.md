# Cross-Repo Skill Adoption Tracking

## Problem

Skillproof runs per-repo via GitHub Actions. There is no way to see adoption across repositories — management cannot answer "which repos have adopted skill X?"

## Goal

A cross-org view: for any skill or set of skills, show which repos have adopted them, which haven't, and the current status.

## Architecture: Hub-Repo Pattern

Inspired by [Allstar (OpenSSF)](https://github.com/ossf/allstar) and [RepoSwarm](https://github.com/reposwarm/reposwarm), which both use a central repository as the aggregation point.

```
GitHub App Token (auth)
        │
        ▼
Hub-Repo Workflow (compute, scheduled)
  ├── clones each org repo
  ├── runs skillproof with centrally-defined skills
  └── commits results/{org}__{repo}/latest.json
        │
        ▼
Hub-Repo (storage: results/*.json)
        │
        ▼
GitHub Pages (read-only dashboard)
```

### Components

**Hub Repo** (`skillproof-hub`) — the only new repo needed:
- `results/{org}__{repo}/latest.json` — per-repo evaluation results
- `.github/workflows/collect.yml` — scheduled pull workflow
- `.github/workflows/dashboard.yml` — regenerates HTML on every push to `results/**`
- `index.html` → served via GitHub Pages

**GitHub App** — auth only, no server:
- Registered once, installed per org
- Gives the hub workflow org-wide read access to clone repos
- Alternative for getting started: fine-grained PAT as org secret

**Result Schema** — `EvaluationReport` (from `@skillproof/cli`) enriched with GitHub context:
```json
{
  "repo": "my-org/my-repo",
  "repoUrl": "https://github.com/my-org/my-repo",
  "sha": "abc123",
  "pushedAt": "2026-10-27T...",
  "report": { }
}
```

## Design Principles

**Nothing locked in.** The hub repo is transport-agnostic — results land in `results/*.json` regardless of how they got there:

| Variant | How results reach the hub | Status |
|---|---|---|
| Serverless Pull | Hub workflow clones + evaluates on schedule | **Priority** |
| Push | `skillproof-action` commits after each CI run | Planned |
| Server | Backend service pushes via API/git | Future |

The JSON schema is the contract. All variants write the same format.

## Why Not a Server?

GitHub Pages is static-only (no API, no uploads). GitHub has no native always-on hosting. A server would enable real-time webhook-driven evaluation but is unnecessary for adoption tracking, where a nightly schedule is sufficient.

A GitHub App with a backend server remains a valid future option for orgs that need real-time updates.

## Why Not Per-Repo Workflows?

The original `skillproof-action` requires each consumer repo to add a workflow. For org-wide adoption tracking this creates friction — the hub pull model requires zero setup in consumer repos.

`skillproof-action` remains useful as an optional add-on for teams that want PR-level status checks or faster per-repo feedback.

## Implementation Order

1. **Hub-Repo template** (`skillproof-hub`) with collect + dashboard workflows
2. **Fine-grained PAT** as org secret to get started (migrate to GitHub App later)
3. **Push variant** in `skillproof-action` (optional `hub-repo` input)
4. **GitHub App** when rolling out to multiple orgs
