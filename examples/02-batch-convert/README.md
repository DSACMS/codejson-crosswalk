# Example: Batch-convert a directory

Converts every `code.json` file in `inputs/` to codemeta format and writes each
result to `outputs/` as `<name>-codemeta.json`.

## Run

```sh
bun run batch.ts
```

The `outputs/` directory is created automatically if it does not exist.

## What it demonstrates

- Looping over multiple input files with a single import
- Writing each converted result to a separate output file
- A pattern suitable for CI pipelines or bulk metadata migration
