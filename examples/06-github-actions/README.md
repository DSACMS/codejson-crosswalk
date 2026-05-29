# Example: GitHub Actions — Automated Metadata Sync

A copy-paste-ready GitHub Actions workflow that keeps `codemeta.json` in sync with `code.json` automatically. Designed for federal agency repositories that need to maintain both metadata formats.

## What this solves

Agencies often maintain `code.json` (required for code.gov) and `codemeta.json` (used by schema.org tooling and research software registries) as separate hand-edited files. They drift apart over time. This workflow converts `code.json` → `codemeta.json` automatically whenever `code.json` changes, so only one file needs to be maintained manually.

## How it works

1. **Trigger** — workflow runs when `code.json` is pushed to `main`, manually, or on a monthly schedule
2. **Convert** — `npx codejson-crosswalk code.json --to codemeta --out codemeta.json`
3. **Validate** — `validate.sh` checks that required fields are present in the output
4. **Commit** — the updated `codemeta.json` is committed back to the branch automatically

## Copy the workflow to your repository

1. Copy `.github/workflows/sync-metadata.yml` to your repository at the same path
2. Copy `validate.sh` to your repository root
3. The `validate.sh` step in the workflow already references it as `bash validate.sh` — no path changes needed if both files are in the repository root

## Trigger modes

| Trigger | When to use |
|---------|-------------|
| `push` on `code.json` | Default — keeps codemeta.json updated on every change |
| `workflow_dispatch` | Run manually after an out-of-band code.json update |
| `schedule` (monthly) | Safety net to catch any drift |

Remove the `schedule` trigger if you want to keep the workflow runs minimal.

## Validation step

`validate.sh` checks the following fields in the converted output:

- `name`, `description`, `codeRepository`, `developmentStatus`, `license` (non-empty)
- `@context` equals `https://w3id.org/codemeta/3.0`
- `@type` equals `SoftwareSourceCode`

To add custom checks, extend `validate.sh` with additional `check_field` calls before the final `echo "Validation passed."` line.

## Pinning the version

By default, `npx` fetches the latest published version on each run. To pin to a specific version:

```sh
npx codejson-crosswalk@0.1.0 code.json --to codemeta --out codemeta.json
```

## Running locally before pushing

```sh
# From your repository root
npx codejson-crosswalk code.json --to codemeta --out codemeta.json
bash validate.sh
```

This is the same sequence the workflow runs, so local failures surface before CI.

## What you learn

- Path-filtered push triggers (`paths: ["code.json"]`) to avoid running on unrelated changes
- `workflow_dispatch` for manual trigger support
- Using `npx --yes` to skip the interactive install prompt in CI
- `[skip ci]` in commit messages to prevent infinite workflow loops
- `stefanzweifel/git-auto-commit-action` as a no-config solution for committing generated files
- `validate.sh` as a reusable local + CI validation script
