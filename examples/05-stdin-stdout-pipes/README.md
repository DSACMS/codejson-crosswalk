# Example: stdin/stdout Pipes

Shows how to compose `codejson-crosswalk` with other Unix tools using stdin and stdout. No temporary files needed.

## Prerequisites

- Node.js 18+
- [`jq`](https://jqlang.github.io/jq/) for patterns 2–4

## Run the demo

```sh
bash pipeline.sh
```

## Pattern 1: stdin pipe

Pipe any JSON source directly to the command:

```sh
cat code.json | npx codejson-crosswalk --to codemeta
cat code.json | npx codejson-crosswalk --to codemeta > codemeta.json
```

Useful when the input comes from a tool that writes to stdout (curl, jq, etc.) rather than a file.

## Pattern 2: capture to a shell variable

Capture the conversion output in a variable and process it further:

```sh
CODEMETA=$(cat code.json | npx codejson-crosswalk --to codemeta)
echo "$CODEMETA" | jq '.codeRepository'
echo "$CODEMETA" | jq '{name, license, developmentStatus}'
```

## Pattern 3: round-trip conversion

Chain two conversions together:

```sh
cat code.json \
  | npx codejson-crosswalk --to codemeta \
  | npx codejson-crosswalk --to codejson \
  | jq '{name, status, repositoryURL}'
```

**Note on field loss:** `code.json` has fields that have no codemeta equivalent (`laborHours`, `organization`, `contractNumber`, `SBOM`, `AIUseCaseID`, etc.). These are dropped on the first conversion and will not survive the round trip. Use the round-trip pattern to verify only the fields that map bidirectionally.

## Pattern 4: modify before converting

Use `jq` to transform the input before handing it to `codejson-crosswalk`:

```sh
# Override status before converting
cat code.json \
  | jq '.status = "Production"' \
  | npx codejson-crosswalk --to codemeta \
  | jq '.developmentStatus'
# → "active"
```

## What you learn

- Piping stdin into the conversion without a file argument
- Capturing stdout in a shell variable for downstream processing
- Round-trip behavior and which fields survive both directions
- Combining `jq` transformations in a pipeline
