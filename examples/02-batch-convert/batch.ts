import { fromCodejsonToCodemeta } from "../../src/index.ts"
import { readdirSync, mkdirSync, writeFileSync } from "node:fs"
import { join, basename } from "node:path"

const inputDir = "./inputs"
const outputDir = "./outputs"

mkdirSync(outputDir, { recursive: true })

const files = readdirSync(inputDir).filter((f) => f.endsWith(".json"))

for (const file of files) {
  const result = await fromCodejsonToCodemeta(join(inputDir, file))
  const outName = basename(file, ".json") + "-codemeta.json"
  writeFileSync(join(outputDir, outName), JSON.stringify(result, null, 2) + "\n")
  console.log(`${file} → outputs/${outName}`)
}

console.log(`\nConverted ${files.length} file(s).`)
