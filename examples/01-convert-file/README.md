# Example: Convert a single file

Converts `input.json` (a `code.json` file) to `codemeta.json` format.

## Via CLI (npx — no install required)

```sh
# Print to stdout
npx codejson-crosswalk input.json --to codemeta

# Write directly to a file
npx codejson-crosswalk input.json --to codemeta --out codemeta.json
```

## Via CLI (globally installed)

```sh
codejson-crosswalk input.json --to codemeta
```

## Programmatically (TypeScript / Node ESM)

```ts
import { fromCodejsonToCodemeta } from "codejson-crosswalk"

const result = await fromCodejsonToCodemeta("./input.json")
process.stdout.write(JSON.stringify(result, null, 2) + "\n")
```

Run the in-repo version with Bun:

```sh
bun run convert.ts
```

You can also pass a parsed object instead of a file path:

```ts
const data = JSON.parse(fs.readFileSync("./input.json", "utf8"))
const result = await fromCodejsonToCodemeta(data)
```

## What it demonstrates

- Three ways to invoke the conversion: npx, global CLI, programmatic
- Passing a file path directly to the conversion function
- The `--out` flag as an alternative to shell redirection
- Output shape: codemeta v3.0 with `@context` and `@type` injected automatically
