import { codemetaToCodeJsonMapping } from "./codemeta-to-codejson"
import { codejsonToCodemetaMapping } from "./codejson-to-codemeta"
import { convert } from "../../helpers/convert"

/**
 * Converts a codemeta document to a code.json document.
 *
 * Accepts either a file path (read via Bun's file API) or an already-parsed
 * object. Field mapping is driven by the internal codemeta-to-code.json mapping table.
 *
 * @param input - Path to a codemeta JSON file, or a pre-parsed codemeta object.
 * @returns A code.json-shaped object with all mapped fields populated.
 *
 * @example
 * ```ts
 * // from a file
 * const codejson = await fromCodemetaToCodejson("codemeta.json")
 *
 * // from an object
 * const codejson = await fromCodemetaToCodejson({ name: "my-project", ... })
 * ```
 */
export async function fromCodemetaToCodejson(input: string | Record<string, unknown>): Promise<Record<string, unknown>> {
    let source: Record<string, unknown>
  
    if (typeof input === "string") {
      const file = Bun.file(input)
      source = await file.json()
    } else {
      source = input
    }
    const result = convert(source, codemetaToCodeJsonMapping)

    return result
  }

/**
 * Converts a code.json document to a codemeta document.
 *
 * Accepts either a file path (read via Bun's file API) or an already-parsed
 * object. Field mapping is driven by the internal code.json-to-codemeta mapping table.
 *
 * @param input - Path to a code.json file, or a pre-parsed code.json object.
 * @returns A codemeta-shaped object with all mapped fields populated, including
 *   the required `@context` and `@type` properties.
 *
 * @example
 * ```ts
 * // from a file
 * const codemeta = await fromCodejsonToCodemeta("code.json")
 *
 * // from an object
 * const codemeta = await fromCodejsonToCodemeta({ name: "my-project", ... })
 * ```
 */
export async function fromCodejsonToCodemeta(input: string | Record<string, unknown>): Promise<Record<string, unknown>> {
    let source: Record<string, unknown>
  
    if (typeof input === "string") {
      const file = Bun.file(input)

      source = await file.json()
    } else {
      source = input
    }

    const result = convert(source, codejsonToCodemetaMapping)

    return result
  }
