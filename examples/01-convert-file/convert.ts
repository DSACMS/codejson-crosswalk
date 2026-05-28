import { fromCodejsonToCodemeta } from "../../src/index.ts"

const result = await fromCodejsonToCodemeta("./input.json")

process.stdout.write(JSON.stringify(result, null, 2) + "\n")
