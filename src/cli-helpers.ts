// Help Text
export const HELP = `
codejson-crosswalk — Convert between code.json and other metadata formats

Usage:
  codejson-crosswalk [input] --to <format> [options]
  codejson-crosswalk --help

Arguments:
  input              Path to input JSON file. Omit to read from stdin.

Options:
  --to, -t <format>  Target format (required). One of:
                       codemeta   Convert code.json → codemeta.json
                       codejson   Convert codemeta.json → code.json
  --out, -o <file>   Write output to a file instead of stdout.
  --help, -h         Show this help message.

Examples:
  codejson-crosswalk code.json --to codemeta
  codejson-crosswalk codemeta.json --to codejson --out code.json
  cat code.json | codejson-crosswalk --to codemeta > codemeta.json
`.trimStart()

// Helper Functions
interface ParsedArgs {
  input?: string
  to?: string
  out?: string
  help: boolean
}

export function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = { help: false }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === undefined) continue

    if (arg === "--help" || arg === "-h") {
      result.help = true
    } else if ((arg === "--to" || arg === "-t") && argv[i + 1]) {
      result.to = argv[++i]
    } else if ((arg === "--out" || arg === "-o") && argv[i + 1]) {
      result.out = argv[++i]
    } else if (!arg.startsWith("-")) {
      if (!result.input) result.input = arg
    } else {
      fatal(`Unknown option: ${arg}\n\nRun with --help for usage.`)
    }
  }

  return result
}

export function fatal(msg: string): never {
  process.stderr.write(`Error: ${msg}\n`)
  process.exit(1)
}

export async function readStdin(): Promise<string> {
  // if terminal is interactive then there is nothing to read
  if (process.stdin.isTTY) return ""

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk))
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    process.stdin.on("error", reject)
  })
}

export function parseJSON(raw: string, source: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    fatal(`${source} is not valid JSON.`)
  }
}