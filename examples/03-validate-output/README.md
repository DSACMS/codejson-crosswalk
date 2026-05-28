# Example: Convert with output validation

Converts a `codemeta.json` file to `code.json` format, then checks that all
required `code.json` fields are present in the output. Exits with a non-zero
status code and a descriptive error if any required field is missing.

## Run

```sh
bun run validate.ts
```

## What it demonstrates

- Importing `fromCodemetaToCodejson` for the reverse direction
- Post-conversion validation as a pattern for CI quality gates
- Using the exit code to signal success or failure to a calling process
