import { fromCodemetaToCodejson } from "../../src/index.ts"

// Fields that every valid code.json document must have a non-empty value for.
const REQUIRED_FIELDS: string[] = [
  "name",
  "description",
  "repositoryURL",
  "status",
  "permissions",
]

const result = await fromCodemetaToCodejson("./input.json")

const missing = REQUIRED_FIELDS.filter((field) => {
  const value = result[field]
  return value === undefined || value === null || value === ""
})

if (missing.length > 0) {
  console.error("Conversion succeeded but output is missing required fields:")
  for (const field of missing) {
    console.error(`  - ${field}`)
  }
  console.error("\nAdd these fields to your codemeta source and retry.")
  process.exit(1)
}

console.log("All required fields present:\n")
for (const field of REQUIRED_FIELDS) {
  console.log(`  ${field}: ${JSON.stringify(result[field])}`)
}

console.log("\nFull output:\n")
process.stdout.write(JSON.stringify(result, null, 2) + "\n")
