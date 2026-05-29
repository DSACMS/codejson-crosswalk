# Example: CLI Quickstart

A complete tour of the `codejson-crosswalk` CLI. No Node project setup or file imports needed — just `npx`.

## Prerequisites

Node.js 18 or higher. No install step required when using `npx`.

## Run the demo

```sh
bash convert.sh
```

This script runs every CLI form shown below and cleans up any generated files afterward.

## CLI reference

### Convert a file to codemeta (stdout)

```sh
npx codejson-crosswalk code.json --to codemeta
```

### Convert a file and write directly to a file

```sh
npx codejson-crosswalk code.json --to codemeta --out codemeta.json
```

### Convert in the reverse direction (codemeta → code.json)

```sh
npx codejson-crosswalk codemeta.json --to codejson
npx codejson-crosswalk codemeta.json --to codejson --out code.json
```

### Short flags

`-t` is an alias for `--to`, and `-o` is an alias for `--out`:

```sh
npx codejson-crosswalk code.json -t codemeta -o codemeta.json
```

### Read from stdin

Omit the input argument and pipe JSON to the command:

```sh
cat code.json | npx codejson-crosswalk --to codemeta
cat code.json | npx codejson-crosswalk --to codemeta > codemeta.json
```

### Show help

```sh
npx codejson-crosswalk --help
```

## Error messages

| Situation | Error |
|-----------|-------|
| `--to` flag omitted | `Error: --to <format> is required.` |
| Unknown format value | `Error: Unknown format "xyz". Must be one of: codejson, codemeta.` |
| File not found | `Error: Cannot read file "missing.json": ENOENT: no such file or directory` |
| No input (no file, no stdin) | `Error: No input provided. Pass a file path or pipe JSON to stdin.` |
| Invalid JSON | `Error: <source> is not valid JSON: Unexpected token ...` |

## What you learn

- Every CLI invocation form: file, file + `--out`, reverse direction, stdin pipe
- Short flags (`-t`, `-o`) as alternatives to long flags
- Expected error messages for common mistakes
- The `codemeta.json` file in this directory is the pre-generated reference output for `code.json`
