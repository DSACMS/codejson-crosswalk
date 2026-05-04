#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs"
import { fromCodejsonToCodemeta, fromCodemetaToCodejson } from "./metadata/codemeta/handler"
import { HELP, parseArgs, fatal, readStdin, parseJSON } from "./cli-helpers"

async function main() {
  const { input, to, out, help } = parseArgs(process.argv.slice(2))

  if (help) {
    process.stdout.write(HELP)
    process.exit(0)
  }

  if (!to) {
    fatal("--to <format> is required.\n\nRun with --help for usage.")
  }

  const FORMAT = ["codejson", "codemeta"] as const
  type Format = (typeof FORMAT)[number]

  if (!FORMAT.includes(to as Format)) {
    fatal(`Unknown format "${to}". Must be one of: ${FORMAT.join(", ")}.`)
  }

  const targetFormat = to as Format

  // read JSON string from file or stdin
  let raw: string
  if (input) {
    try {
      raw = readFileSync(input, "utf8")
    } catch (err) {
      fatal(`Cannot read file "${input}": ${(err as Error).message}`)
    }
  } else {
    raw = await readStdin()
    if (!raw.trim()) {
      fatal("No input provided. Pass a file path or pipe JSON to stdin.")
    }
  }

  const source = input ?? "stdin"
  const parsed = parseJSON(raw, source)

  let result: Record<string, unknown>

  try {
    result =
      targetFormat === "codemeta"
        ? await fromCodejsonToCodemeta(parsed)
        : await fromCodemetaToCodejson(parsed)
  } catch (err) {
    fatal(`Conversion failed: ${(err as Error).message}`)
  }

  const output = JSON.stringify(result, null, 2) + "\n"

  // write to file or stdout
  if (out) {
    try {
      writeFileSync(out, output, "utf8")
    } catch (err) {
      fatal(`Cannot write to "${out}": ${(err as Error).message}`)
    }
  } else {
    process.stdout.write(output)
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`Unexpected error: ${(err as Error).message}\n`)
  process.exit(1)
})