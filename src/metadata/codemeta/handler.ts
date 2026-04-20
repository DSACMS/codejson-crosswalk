import { codemetaToCodeJsonMapping } from "./codemeta-mapping"
import { codejsonToCodemetaMapping } from "./codejson-mapping"
import { convert } from "../../helpers/convert"

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
