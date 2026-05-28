import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { parseArgs, parseJSON } from "../cli-helpers"
import { fromCodemetaToCodejson, fromCodejsonToCodemeta } from "../metadata/codemeta/handler"
import { convert } from "../helpers/convert"

// helpers to intercept process.exit and process.stderr in CLI helper tests
let capturedStderr: string
let capturedExitCode: number | undefined
const originalStderrWrite = process.stderr.write.bind(process.stderr)
const originalExit = process.exit.bind(process)

function installMocks() {
  capturedStderr = ""
  capturedExitCode = undefined
  // Capture all stderr writes
  process.stderr.write = (msg: string | Uint8Array) => {
    capturedStderr += typeof msg === "string" ? msg : Buffer.from(msg).toString()
    return true
  }
  // Turn process.exit into a catchable throw
  ;(process as NodeJS.Process).exit = ((code: number) => {
    capturedExitCode = code
    throw new Error(`__exit_${code}`)
  }) as typeof process.exit
}

function removeMocks() {
  process.stderr.write = originalStderrWrite as typeof process.stderr.write
  process.exit = originalExit
}

// Runs fn, catches the synthetic __exit_ throw, and returns captured values.
function runFatal(fn: () => unknown): { stderr: string; code: number | undefined } {
  try {
    fn()
  } catch (err) {
    if (!(err instanceof Error) || !err.message.startsWith("__exit_")) throw err
  }
  return { stderr: capturedStderr, code: capturedExitCode }
}

// CLI: parseArgs error paths
describe("parseArgs: error paths", () => {
  beforeEach(installMocks)
  afterEach(removeMocks)

  test("unknown option: message names the bad flag", () => {
    const { stderr, code } = runFatal(() => parseArgs(["--unknown-flag"]))
    expect(code).toBe(1)
    expect(stderr).toContain("Unknown option: --unknown-flag")
  })

  test("unknown short option: message names the bad flag", () => {
    const { stderr, code } = runFatal(() => parseArgs(["-z"]))
    expect(code).toBe(1)
    expect(stderr).toContain("Unknown option: -z")
  })

  test("unknown option: message includes hint to run --help", () => {
    const { stderr } = runFatal(() => parseArgs(["--bad"]))
    expect(stderr).toContain("--help")
  })
})

// CLI: parseJSON error paths
describe("parseJSON: error paths", () => {
  beforeEach(installMocks)
  afterEach(removeMocks)

  test("malformed JSON: message names the source file", () => {
    const { stderr, code } = runFatal(() => parseJSON("{ bad json }", "myfile.json"))
    expect(code).toBe(1)
    expect(stderr).toContain("myfile.json")
  })

  test("malformed JSON: message includes native parse detail (position)", () => {
    const { stderr } = runFatal(() => parseJSON("{ bad json }", "myfile.json"))
    // The native SyntaxError message always contains "JSON" and a position reference
    expect(stderr.toLowerCase()).toMatch(/json|position|unexpected/i)
  })

  test("malformed JSON from stdin: message says 'stdin'", () => {
    const { stderr } = runFatal(() => parseJSON("not-json", "stdin"))
    expect(stderr).toContain("stdin")
  })

  test("empty object literal is valid JSON: no error", () => {
    // Sanity-check: valid input must not call fatal
    const result = parseJSON("{}", "source.json")
    expect(result).toEqual({})
    expect(capturedExitCode).toBeUndefined()
  })
})

// Handler: file I/O error paths (fromCodemetaToCodejson)
describe("fromCodemetaToCodejson: file error paths", () => {
  test("non-existent file: message names the missing path", async () => {
    const path = "/tmp/__nonexistent_codemeta_test__.json"
    await expect(fromCodemetaToCodejson(path)).rejects.toThrow(path)
  })

  test("non-existent file: message identifies failure as a read error", async () => {
    const path = "/tmp/__nonexistent_codemeta_test__.json"
    await expect(fromCodemetaToCodejson(path)).rejects.toThrow("Cannot read file")
  })

  test("invalid JSON file: message names the file", async () => {
    const path = join(import.meta.dir, "__tmp_invalid_codemeta__.json")
    writeFileSync(path, "{ not valid json }")
    try {
      await expect(fromCodemetaToCodejson(path)).rejects.toThrow(path)
    } finally {
      unlinkSync(path)
    }
  })

  test("invalid JSON file: message identifies failure as a JSON parse error", async () => {
    const path = join(import.meta.dir, "__tmp_invalid_codemeta2__.json")
    writeFileSync(path, "{ not valid json }")
    try {
      await expect(fromCodemetaToCodejson(path)).rejects.toThrow("is not valid JSON")
    } finally {
      unlinkSync(path)
    }
  })
})

// Handler: file I/O error paths (fromCodejsonToCodemeta)
describe("fromCodejsonToCodemeta: file error paths", () => {
  test("non-existent file: message names the missing path", async () => {
    const path = "/tmp/__nonexistent_codejson_test__.json"
    await expect(fromCodejsonToCodemeta(path)).rejects.toThrow(path)
  })

  test("non-existent file: message identifies failure as a read error", async () => {
    const path = "/tmp/__nonexistent_codejson_test__.json"
    await expect(fromCodejsonToCodemeta(path)).rejects.toThrow("Cannot read file")
  })

  test("invalid JSON file: message names the file", async () => {
    const path = join(import.meta.dir, "__tmp_invalid_codejson__.json")
    writeFileSync(path, "[ broken")
    try {
      await expect(fromCodejsonToCodemeta(path)).rejects.toThrow(path)
    } finally {
      unlinkSync(path)
    }
  })

  test("invalid JSON file: message identifies failure as a JSON parse error", async () => {
    const path = join(import.meta.dir, "__tmp_invalid_codejson2__.json")
    writeFileSync(path, "[ broken")
    try {
      await expect(fromCodejsonToCodemeta(path)).rejects.toThrow("is not valid JSON")
    } finally {
      unlinkSync(path)
    }
  })
})

// convert(): transform error paths
describe("convert: transform error paths", () => {
  test("throwing transform: error message names the target field", () => {
    expect(() =>
      convert({ name: "test" }, [
        {
          source: "name",
          target: "result.nested",
          transform: () => {
            throw new Error("boom")
          },
        },
      ])
    ).toThrow('Transform failed for field "result.nested"')
  })

  test("throwing transform: original error detail is preserved in message", () => {
    expect(() =>
      convert({ name: "test" }, [
        {
          source: "name",
          target: "output",
          transform: () => {
            throw new Error("original detail here")
          },
        },
      ])
    ).toThrow("original detail here")
  })

  test("non-throwing transform on missing source: no error", () => {
    // When source field is absent, transform is never called — no error
    const result = convert({}, [
      {
        source: "missing",
        target: "output",
        transform: () => {
          throw new Error("should not be called")
        },
        default: "fallback",
      },
    ])
    expect(result.output).toBe("fallback")
  })
})
