# Example: Convert a single file

Converts a `code.json` file to `codemeta.json` format and prints the result to stdout.

## Run

```sh
bun run convert.ts
```

Redirect to a file if you want to save the output:

```sh
bun run convert.ts > codemeta.json
```

## What it demonstrates

- Importing `fromCodejsonToCodemeta` from the library
- Passing a file path directly to the conversion function
- Printing the result as formatted JSON
