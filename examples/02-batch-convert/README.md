# Example: Batch-convert a directory

Converts every `code.json` file in `inputs/` to codemeta format and writes each result to `outputs/` as `<name>-codemeta.json`.

## Via CLI (shell loop)

```sh
# Using npx in a shell loop — no project setup needed
for f in inputs/*.json; do
  npx codejson-crosswalk "$f" --to codemeta --out "outputs/$(basename "$f" .json)-codemeta.json"
done
```

The `--out` flag writes each result directly to a file without shell redirection.

## Programmatically (TypeScript / Node ESM)

```ts
import { fromCodejsonToCodemeta } from "codejson-crosswalk"
import { readdirSync, mkdirSync, writeFileSync } from "node:fs"
import { join, basename } from "node:path"

const inputDir = "./inputs"
const outputDir = "./outputs"

mkdirSync(outputDir, { recursive: true })

const files = readdirSync(inputDir).filter((f) => f.endsWith(".json"))

for (const file of files) {
  const result = await fromCodejsonToCodemeta(join(inputDir, file))
  const outName = basename(file, ".json") + "-codemeta.json"
  writeFileSync(join(outputDir, outName), JSON.stringify(result, null, 2) + "\n")
  console.log(`${file} → outputs/${outName}`)
}
```

Run the in-repo version with Bun:

```sh
bun run batch.ts
```

The `outputs/` directory is created automatically if it does not exist.

## What it demonstrates

- Writing a shell loop over a directory with no Node project required
- The `--out` flag for direct file writing without shell redirection
- Looping over multiple input files programmatically with a single import
- A pattern suitable for bulk metadata migration or CI pipelines
