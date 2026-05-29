# Examples

These examples cover the full range of ways to use `codejson-crosswalk` — from a quick CLI one-liner to a GitHub Actions workflow for federal agency repositories.

| # | Example | What you learn | Runtime |
|---|---------|----------------|---------|
| 01 | [convert-file](./01-convert-file/) | Convert a single file via CLI or code | npx / Node / Bun |
| 02 | [batch-convert](./02-batch-convert/) | Process a directory of files via shell loop or code | npx / Node / Bun |
| 03 | [validate-output](./03-validate-output/) | Post-conversion field validation as a CI quality gate | npx / Node / Bun |
| 04 | [cli-quickstart](./04-cli-quickstart/) | Every CLI invocation form in one place | npx only |
| 05 | [stdin-stdout-pipes](./05-stdin-stdout-pipes/) | Unix pipe composition, shell capture, round-trip | npx + jq |
| 06 | [github-actions](./06-github-actions/) | Automated sync workflow for federal agency repos | GitHub Actions |

## Prerequisites

### CLI (no project setup needed)

```sh
# Run any conversion without installing anything
npx codejson-crosswalk code.json --to codemeta

# Or install once globally
npm install -g codejson-crosswalk
codejson-crosswalk --help
```

### TypeScript examples (01–03, in-repo development)

```sh
bun install          # from the repo root
cd examples/01-convert-file
bun run convert.ts
```

The TypeScript examples import from `../../src/index.ts` so they run directly against the source. In your own project, replace that with `import { ... } from "codejson-crosswalk"`.
