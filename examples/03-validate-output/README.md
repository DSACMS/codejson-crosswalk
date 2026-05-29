# Example: Convert with output validation

Converts `input.json` (a `codemeta.json` file) to `code.json` format, then checks that all required `code.json` fields are present. Exits with a non-zero status code if any required field is missing — useful as a CI quality gate.

## Via CLI + shell

```sh
# Convert and inspect required fields with jq
npx codejson-crosswalk input.json --to codejson --out out.json
jq '{name, description, repositoryURL, status, permissions}' out.json
```

Use the exit code as a gate in CI scripts:

```sh
set -e   # abort on first error
npx codejson-crosswalk input.json --to codejson --out out.json
# add your own field checks here, or use the validate.ts script below
```

## Programmatically (TypeScript / Node ESM)

```ts
import { fromCodemetaToCodejson } from "codejson-crosswalk"

const REQUIRED_FIELDS = ["name", "description", "repositoryURL", "status", "permissions"]

const result = await fromCodemetaToCodejson("./input.json")

const missing = REQUIRED_FIELDS.filter((f) => {
  const v = result[f]
  return v === undefined || v === null || v === ""
})

if (missing.length > 0) {
  console.error("Missing required fields:", missing)
  process.exit(1)
}
```

Run the in-repo version with Bun:

```sh
bun run validate.ts
```

## What it demonstrates

- Importing `fromCodemetaToCodejson` for the codemeta → code.json direction
- Post-conversion field validation as a pattern for CI quality gates
- Using `process.exit(1)` to signal failure to a calling process or CI runner
- Combining CLI output with `jq` for quick field inspection
