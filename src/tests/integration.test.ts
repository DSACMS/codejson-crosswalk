import { describe, expect, test } from "bun:test"
import { join } from "path"
import { fromCodemetaToCodejson, fromCodejsonToCodemeta } from "../metadata/codemeta/handler"

const FIXTURES = join(import.meta.dir, "fixtures")

const PROJECT_CODEMETA = (await import(join(FIXTURES, "codemeta/project.json"))).default as Record<string, unknown>
const SPDX_CODEMETA = (await import(join(FIXTURES, "codemeta/spdx-license.json"))).default as Record<string, unknown>
const MINIMAL_CODEMETA = (await import(join(FIXTURES, "codemeta/minimal.json"))).default as Record<string, unknown>
const PROJECT_CODEJSON = (await import(join(FIXTURES, "codejson/project.json"))).default as Record<string, unknown>
const ROUNDTRIP_INPUT = (await import(join(FIXTURES, "codejson/roundtrip-input.json"))).default as Record<string, unknown>

// codemeta → code.json
describe("Integration: codemeta → code.json", () => {
  test("reads from the project codemeta.json file on disk", async () => {
    const repoRoot = join(import.meta.dir, "../..")
    const result = await fromCodemetaToCodejson(join(repoRoot, "codemeta.json"))
    expect(result.name).toBe("codejson-crosswalk")
    expect(result.repositoryURL).toBe("https://github.com/DSACMS/codejson-crosswalk")
  })

  test("preserves direct 1:1 fields", async () => {
    const result = await fromCodemetaToCodejson(PROJECT_CODEMETA)
    expect(result.name).toBe("codejson-crosswalk")
    expect(result.description).toBe(
      "An NPM package that converts code.json to a variety of different metadata types in both directions"
    )
    expect(result.repositoryURL).toBe("https://github.com/DSACMS/codejson-crosswalk")
    expect(result.feedbackMechanism).toBe("https://github.com/DSACMS/codejson-crosswalk/issues")
  })

  test("converts programmingLanguage string to a languages array", async () => {
    const result = await fromCodemetaToCodejson(PROJECT_CODEMETA)
    expect(result.languages).toEqual(["TypeScript"])
  })

  test("converts keywords array to a tags array", async () => {
    const result = await fromCodemetaToCodejson(PROJECT_CODEMETA)
    expect(result.tags).toEqual(["codejson", "converter", "crosswalk", "healthcare"])
  })

  test("preserves existing ISO datetimes unchanged", async () => {
    const result = await fromCodemetaToCodejson(PROJECT_CODEMETA)
    const date = result.date as Record<string, string>
    expect(date.created).toBe("2026-02-10T20:27:00Z")
    expect(date.lastModified).toBe("2026-02-19T21:33:44Z")
    expect(date.metadataLastUpdated).toBe("2026-02-19T21:33:44Z")
  })

  test("appends T00:00:00Z to plain date strings", async () => {
    const result = await fromCodemetaToCodejson({
      dateCreated: "2024-03-01",
      dateModified: "2024-09-15",
    })
    const date = result.date as Record<string, string>
    expect(date.created).toBe("2024-03-01T00:00:00Z")
    expect(date.lastModified).toBe("2024-09-15T00:00:00Z")
  })

  test("extracts license name from a valid SPDX URL", async () => {
    const result = await fromCodemetaToCodejson({ license: "https://spdx.org/licenses/MIT" })
    const licenses = (result.permissions as Record<string, unknown>)
      .licenses as Array<Record<string, string>>
    expect(licenses).toHaveLength(1)
    expect(licenses[0]?.name).toBe("MIT")
    expect(licenses[0]?.URL).toBe("https://spdx.org/licenses/MIT")
  })

  test("sets license name to 'Other' when URL is not a recognised SPDX URL", async () => {
    // PROJECT_CODEMETA uses a GitHub blob URL, not an spdx.org URL
    const result = await fromCodemetaToCodejson(PROJECT_CODEMETA)
    const licenses = (result.permissions as Record<string, unknown>)
      .licenses as Array<Record<string, string>>
    expect(licenses[0]?.name).toBe("Other")
    expect(licenses[0]?.URL).toBe(
      "https://github.com/DSACMS/codejson-crosswalk/blob/main/LICENSE"
    )
  })

  test("maps developmentStatus repostatus values to code.json status enum", async () => {
    const cases: [string, string][] = [
      ["active", "Production"],
      ["wip", "Development"],
      ["concept", "Ideation"],
      ["inactive", "Archival"],
    ]
    for (const [devStatus, expectedStatus] of cases) {
      const result = await fromCodemetaToCodejson({ developmentStatus: devStatus })
      expect(result.status).toBe(expectedStatus)
    }
  })

  test("inserts required code.json defaults for fields absent from codemeta", async () => {
    const result = await fromCodemetaToCodejson(PROJECT_CODEMETA)
    const permissions = result.permissions as Record<string, unknown>
    expect(permissions.usageType).toEqual([])
    expect(permissions.exemptionText).toBe("")
    expect(result.organization).toBe("")
    expect(result.repositoryVisibility).toBe("public")
    expect(result.vcs).toBe("git")
    expect(result.laborHours).toBe(0)
    expect(result.reuseFrequency).toEqual({})
    expect(result.maintenance).toBe("none")
    expect(result.contractNumber).toEqual([])
    expect(result.SBOM).toBe("None")
    expect(result.AIUseCaseID).toBe("0")
  })

  test("drops codemeta-only fields that have no code.json equivalent", async () => {
    const result = await fromCodemetaToCodejson(PROJECT_CODEMETA)
    // JSON-LD structure
    expect(result["@context"]).toBeUndefined()
    expect(result["@type"]).toBeUndefined()
    // Descriptive fields not covered by the mapping
    expect(result.applicationCategory).toBeUndefined()
    expect(result.operatingSystem).toBeUndefined()
    expect(result.runtimePlatform).toBeUndefined()
    expect(result.softwareRequirements).toBeUndefined()
    // Organisational metadata not mapped
    expect(result.audience).toBeUndefined()
    expect(result.maintainer).toBeUndefined()
    expect(result.producer).toBeUndefined()
    expect(result.provider).toBeUndefined()
    expect(result.isAccessibleForFree).toBeUndefined()
    expect(result.additionalProperty).toBeUndefined()
    // codemeta VCS key differs from code.json key
    expect(result.versionControlSystem).toBeUndefined()
  })
})

// code.json → codemeta
describe("Integration: code.json → codemeta", () => {
  test("reads from the project code.json file on disk", async () => {
    const repoRoot = join(import.meta.dir, "../..")
    const result = await fromCodejsonToCodemeta(join(repoRoot, "code.json"))
    expect(result.name).toBe("codejson-crosswalk")
    expect(result.codeRepository).toBe("https://github.com/DSACMS/codejson-crosswalk")
  })

  test("preserves direct 1:1 fields", async () => {
    const result = await fromCodejsonToCodemeta(PROJECT_CODEJSON)
    expect(result.name).toBe("codejson-crosswalk")
    expect(result.description).toBe("Package that converts code.json to other metadata types")
    expect(result.codeRepository).toBe("https://github.com/DSACMS/codejson-crosswalk")
    expect(result.issueTracker).toBe("https://github.com/DSACMS/codejson-crosswalk/issues")
  })

  test("unwraps a single-element languages array to a programmingLanguage string", async () => {
    const result = await fromCodejsonToCodemeta(PROJECT_CODEJSON)
    expect(result.programmingLanguage).toBe("Typescript")
  })

  test("keeps a multi-element languages array as programmingLanguage array", async () => {
    const result = await fromCodejsonToCodemeta({ languages: ["Python", "JavaScript"] })
    expect(result.programmingLanguage).toEqual(["Python", "JavaScript"])
  })

  test("produces an empty programmingLanguage array when languages is empty", async () => {
    const result = await fromCodejsonToCodemeta({ languages: [] })
    expect(result.programmingLanguage).toEqual([])
  })

  test("produces an empty keywords array when tags is empty", async () => {
    const result = await fromCodejsonToCodemeta({ tags: [] })
    expect(result.keywords).toEqual([])
  })

  test("converts tags array to a keywords array", async () => {
    const result = await fromCodejsonToCodemeta(PROJECT_CODEJSON)
    expect(result.keywords).toEqual(["codejson", "converter", "crosswalk"])
  })

  test("strips midnight-UTC suffix from ISO datetime to produce a plain date", async () => {
    const result = await fromCodejsonToCodemeta({
      date: { created: "2024-03-01T00:00:00Z", lastModified: "2024-09-15T00:00:00Z" },
    })
    expect(result.dateCreated).toBe("2024-03-01")
    expect(result.dateModified).toBe("2024-09-15")
  })

  test("leaves non-midnight datetimes unchanged", async () => {
    const result = await fromCodejsonToCodemeta(PROJECT_CODEJSON)
    expect(result.dateCreated).toBe("2026-02-10T20:27:00Z")
    expect(result.dateModified).toBe("2026-02-19T21:33:44Z")
  })

  test("uses the license URL from the first entry in permissions.licenses", async () => {
    const result = await fromCodejsonToCodemeta(PROJECT_CODEJSON)
    expect(result.license).toBe(
      "https://github.com/DSACMS/codejson-crosswalk/blob/main/LICENSE"
    )
  })

  test("converts contact to a Person author, splitting name into given/familyName", async () => {
    const result = await fromCodejsonToCodemeta(PROJECT_CODEJSON)
    const author = result.author as Record<string, unknown>
    expect(author["@type"]).toBe("Person")
    expect(author.givenName).toBe("CMS")
    expect(author.familyName).toBe("Open Source Program Office")
    expect(author.email).toBe("opensource@cms.hhs.gov")
  })

  test("maps code.json status enum to codemeta developmentStatus", async () => {
    const cases: [string, string][] = [
      ["Production", "active"],
      ["Development", "wip"],
      ["Ideation", "concept"],
      ["Archival", "inactive"],
      ["Alpha", "wip"],
      ["Beta", "wip"],
    ]
    for (const [status, expectedDev] of cases) {
      const result = await fromCodejsonToCodemeta({ status })
      expect(result.developmentStatus).toBe(expectedDev)
    }
  })

  test("injects required codemeta JSON-LD defaults", async () => {
    const result = await fromCodejsonToCodemeta(PROJECT_CODEJSON)
    expect(result["@context"]).toBe("https://w3id.org/codemeta/3.0")
    expect(result["@type"]).toBe("SoftwareSourceCode")
  })

  test("drops code.json-only fields that have no codemeta equivalent", async () => {
    const result = await fromCodejsonToCodemeta(PROJECT_CODEJSON)
    // Government-/agency-specific fields
    expect(result.longDescription).toBeUndefined()
    expect(result.organization).toBeUndefined()
    expect(result.repositoryVisibility).toBeUndefined()
    expect(result.vcs).toBeUndefined()
    expect(result.laborHours).toBeUndefined()
    expect(result.reuseFrequency).toBeUndefined()
    expect(result.maintenance).toBeUndefined()
    expect(result.contractNumber).toBeUndefined()
    expect(result.SBOM).toBeUndefined()
    expect(result.AIUseCaseID).toBeUndefined()
    // Nested fields not in the mapping
    expect(result["permissions.usageType"]).toBeUndefined()
  })
})

// minimal codemeta → code.json
describe("Integration: minimal codemeta → code.json", () => {
  test("converts name and description without error", async () => {
    const result = await fromCodemetaToCodejson(MINIMAL_CODEMETA)
    expect(result.name).toBe("minimal-tool")
    expect(result.description).toBe("A tool with only the required codemeta fields populated")
  })

  test("fills all required code.json fields with defaults when codemeta fields are absent", async () => {
    const result = await fromCodemetaToCodejson(MINIMAL_CODEMETA)
    const permissions = result.permissions as Record<string, unknown>
    expect(permissions.usageType).toEqual([])
    expect(result.organization).toBe("")
    expect(result.repositoryVisibility).toBe("public")
    expect(result.vcs).toBe("git")
    expect(result.laborHours).toBe(0)
    expect(result.reuseFrequency).toEqual({})
    expect(result.maintenance).toBe("none")
    expect(result.contractNumber).toEqual([])
    expect(result.SBOM).toBe("None")
    expect(result.AIUseCaseID).toBe("0")
  })

  test("produces an empty repositoryURL when codemeta has no codeRepository", async () => {
    const result = await fromCodemetaToCodejson(MINIMAL_CODEMETA)
    expect(result.repositoryURL).toBe("")
  })
})

// code.json → codemeta → code.json
describe("Round-trip: code.json → codemeta → code.json", () => {
  // ROUNDTRIP_INPUT contains code.json-only fields (organization, laborHours, etc.)
  // to verify they revert to defaults after the full round-trip.
  // See fixtures/codejson/roundtrip-input.json.

  test("preserved: core metadata fields survive the full round-trip", async () => {
    const intermediate = await fromCodejsonToCodemeta(ROUNDTRIP_INPUT)
    const result = await fromCodemetaToCodejson(intermediate)

    expect(result.name).toBe("roundtrip-test")
    expect(result.description).toBe("Testing round-trips")
    expect(result.repositoryURL).toBe("https://github.com/example/roundtrip-test")
    expect(result.feedbackMechanism).toBe("https://github.com/example/roundtrip-test/issues")
    expect(result.languages).toEqual(["TypeScript", "JavaScript"])
    expect(result.tags).toEqual(["testing", "roundtrip"])
  })

  test("preserved: status survives a round-trip through the two enums", async () => {
    const intermediate = await fromCodejsonToCodemeta(ROUNDTRIP_INPUT)
    // Production → "active" (codemeta) → Production (code.json)
    expect(intermediate.developmentStatus).toBe("active")
    const result = await fromCodemetaToCodejson(intermediate)
    expect(result.status).toBe("Production")
  })

  test("preserved: contact/author name and email survive the round-trip", async () => {
    const intermediate = await fromCodejsonToCodemeta(ROUNDTRIP_INPUT)
    const author = intermediate.author as Record<string, unknown>
    expect(author.givenName).toBe("Jane")
    expect(author.familyName).toBe("Doe")

    const result = await fromCodemetaToCodejson(intermediate)
    const contact = result.contact as Record<string, string>
    expect(contact.name).toBe("Jane Doe")
    expect(contact.email).toBe("jane@example.com")
  })

  test("preserved: SPDX license URL and name survive the round-trip", async () => {
    const intermediate = await fromCodejsonToCodemeta(ROUNDTRIP_INPUT)
    expect(intermediate.license).toBe("https://spdx.org/licenses/MIT")

    const result = await fromCodemetaToCodejson(intermediate)
    const licenses = (result.permissions as Record<string, unknown>)
      .licenses as Array<Record<string, string>>
    expect(licenses[0]?.name).toBe("MIT")
    expect(licenses[0]?.URL).toBe("https://spdx.org/licenses/MIT")
  })

  test("preserved: midnight-UTC dates survive without data loss", async () => {
    const intermediate = await fromCodejsonToCodemeta(ROUNDTRIP_INPUT)
    // Midnight UTC is stripped to a plain date in codemeta
    expect(intermediate.dateCreated).toBe("2024-01-15")
    expect(intermediate.dateModified).toBe("2024-06-30")

    const result = await fromCodemetaToCodejson(intermediate)
    const date = result.date as Record<string, string>
    // Plain date is re-inflated to midnight UTC in code.json
    expect(date.created).toBe("2024-01-15T00:00:00Z")
    expect(date.lastModified).toBe("2024-06-30T00:00:00Z")
  })

  test("lossy: status granularity collapses — Alpha, Beta, 'Release Candidate' all become Development", async () => {
    for (const lostStatus of ["Alpha", "Beta", "Release Candidate"]) {
      const intermediate = await fromCodejsonToCodemeta({ status: lostStatus })
      // All three map to "wip" in codemeta
      expect(intermediate.developmentStatus).toBe("wip")
      const result = await fromCodemetaToCodejson(intermediate)
      // "wip" maps back to "Development", not the original value
      expect(result.status).toBe("Development")
      expect(result.status).not.toBe(lostStatus)
    }
  })

  test("lossy: code.json-only fields are replaced by defaults after the round-trip", async () => {
    const intermediate = await fromCodejsonToCodemeta(ROUNDTRIP_INPUT)
    const result = await fromCodemetaToCodejson(intermediate)

    // organization: no codemeta equivalent → default ""
    expect(result.organization).toBe("")
    expect(ROUNDTRIP_INPUT.organization).toBe("Example Org")

    // repositoryVisibility: no codemeta equivalent → default "public"
    expect(result.repositoryVisibility).toBe("public")
    expect(ROUNDTRIP_INPUT.repositoryVisibility).toBe("private")

    // laborHours: no codemeta equivalent → default 0
    expect(result.laborHours).toBe(0)
    expect(ROUNDTRIP_INPUT.laborHours).toBe(100)

    // SBOM: no codemeta equivalent → default "None"
    expect(result.SBOM).toBe("None")

    // maintenance: no codemeta equivalent → default "none"
    expect(result.maintenance).toBe("none")
    expect(ROUNDTRIP_INPUT.maintenance).toBe("internal")

    // reuseFrequency: no codemeta equivalent → default {}
    expect(result.reuseFrequency).toEqual({})
    expect(ROUNDTRIP_INPUT.reuseFrequency).toEqual({ forks: 3 })

    // contractNumber: no codemeta equivalent → default []
    expect(result.contractNumber).toEqual([])
    expect(ROUNDTRIP_INPUT.contractNumber).toEqual(["CTR-2024-001"])

    // AIUseCaseID: no codemeta equivalent → default "0"
    expect(result.AIUseCaseID).toBe("0")
    expect(ROUNDTRIP_INPUT.AIUseCaseID).toBe("AI-001")
  })
})

// codemeta → code.json → codemeta
describe("Round-trip: codemeta → code.json → codemeta", () => {
  test("preserved: core metadata fields survive the full round-trip", async () => {
    const intermediate = await fromCodemetaToCodejson(SPDX_CODEMETA)
    const result = await fromCodejsonToCodemeta(intermediate)

    expect(result.name).toBe("sample-tool")
    expect(result.description).toBe("A sample open-source tool")
    expect(result.codeRepository).toBe("https://github.com/example/sample-tool")
    expect(result.issueTracker).toBe("https://github.com/example/sample-tool/issues")
    expect(result.keywords).toEqual(["tool", "sample", "open-source"])
  })

  test("preserved: SPDX license URL survives the round-trip", async () => {
    const intermediate = await fromCodemetaToCodejson(SPDX_CODEMETA)
    const licenses = (intermediate.permissions as Record<string, unknown>)
      .licenses as Array<Record<string, string>>
    expect(licenses[0]?.name).toBe("MIT")

    const result = await fromCodejsonToCodemeta(intermediate)
    expect(result.license).toBe("https://spdx.org/licenses/MIT")
  })

  test("preserved: multi-language array survives the round-trip intact", async () => {
    const intermediate = await fromCodemetaToCodejson(SPDX_CODEMETA)
    expect(intermediate.languages).toEqual(["Python", "JavaScript"])

    const result = await fromCodejsonToCodemeta(intermediate)
    expect(result.programmingLanguage).toEqual(["Python", "JavaScript"])
  })

  test("preserved: author given/familyName survive the round-trip", async () => {
    const intermediate = await fromCodemetaToCodejson(SPDX_CODEMETA)
    const contact = intermediate.contact as Record<string, string>
    expect(contact.name).toBe("Alice Smith")
    expect(contact.email).toBe("alice@example.com")

    const result = await fromCodejsonToCodemeta(intermediate)
    const author = result.author as Record<string, unknown>
    expect(author["@type"]).toBe("Person")
    expect(author.givenName).toBe("Alice")
    expect(author.familyName).toBe("Smith")
    expect(author.email).toBe("alice@example.com")
  })

  test("preserved: plain dates survive the round-trip (stripped then re-inflated)", async () => {
    const intermediate = await fromCodemetaToCodejson(SPDX_CODEMETA)
    const date = intermediate.date as Record<string, string>
    // Plain dates are inflated to midnight UTC in code.json
    expect(date.created).toBe("2024-01-01T00:00:00Z")
    expect(date.lastModified).toBe("2024-06-15T00:00:00Z")

    const result = await fromCodejsonToCodemeta(intermediate)
    // Midnight UTC is stripped back to a plain date in codemeta
    expect(result.dateCreated).toBe("2024-01-01")
    expect(result.dateModified).toBe("2024-06-15")
  })

  test("preserved: developmentStatus survives the round-trip", async () => {
    const intermediate = await fromCodemetaToCodejson(SPDX_CODEMETA)
    // active → Production
    expect(intermediate.status).toBe("Production")

    const result = await fromCodejsonToCodemeta(intermediate)
    // Production → active
    expect(result.developmentStatus).toBe("active")
  })

  test("lossy: @context is replaced by the v3.0 default on the return trip", async () => {
    // Source uses codemeta 2.0 context
    expect(SPDX_CODEMETA["@context"]).toBe("https://doi.org/10.5063/schema/codemeta-2.0")

    const intermediate = await fromCodemetaToCodejson(SPDX_CODEMETA)
    const result = await fromCodejsonToCodemeta(intermediate)

    // The round-tripped codemeta always uses the v3.0 context default
    expect(result["@context"]).toBe("https://w3id.org/codemeta/3.0")
    expect(result["@context"]).not.toBe(SPDX_CODEMETA["@context"])
  })

  test("lossy: non-SPDX license URL causes the license name to become 'Other'", async () => {
    const blobUrl = "https://github.com/example/repo/blob/main/LICENSE"
    const intermediate = await fromCodemetaToCodejson({ license: blobUrl })
    const licenses = (intermediate.permissions as Record<string, unknown>)
      .licenses as Array<Record<string, string>>
    // URL is preserved but the extracted name is "Other"
    expect(licenses[0]?.URL).toBe(blobUrl)
    expect(licenses[0]?.name).toBe("Other")

    const result = await fromCodejsonToCodemeta(intermediate)
    // On the return leg, transformLicenseToCodemeta picks the URL, so the URL survives
    expect(result.license).toBe(blobUrl)
  })

  test("lossy: codemeta-only fields are silently dropped during conversion", async () => {
    const intermediate = await fromCodemetaToCodejson(SPDX_CODEMETA)
    const result = await fromCodejsonToCodemeta(intermediate)

    // These fields exist in SPDX_CODEMETA but are never written to code.json,
    // so they cannot appear in the round-tripped codemeta output.
    expect(result.applicationCategory).toBeUndefined()
    expect(result.softwareRequirements).toBeUndefined()
    expect(result.maintainer).toBeUndefined()
  })
})
