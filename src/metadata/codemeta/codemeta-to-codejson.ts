import type { MappingEntry } from "../../types/MappingEntry"

export const codemetaToCodeJsonMapping: MappingEntry[] = [
  { source: "name",
    target: "name",
    default: "" },

  { source: "description",
    target: "description",
    default: "" },

  { source: "codeRepository",
    target: "repositoryURL",
    default: "" },

  { source: "downloadUrl",
    target: "downloadURL",
    default: "" },

  { source: "url",
    target: "homepageURL",
    default: "" },

  { source: "version",
    target: "version",
    default: "",
    transform: (v) => String(v) },

  { source: "license",
    target: "permissions.licenses",
    default: [],
    transform: transformLicense },

  { source: "author",
    target: "contact",
    default: { name: "", email: "" },
    transform: transformAuthor },

  { source: "programmingLanguage",
    target: "languages",
    default: [],
    transform: transformProgrammingLanguage },

  { source: "keywords",
    target: "tags",
    default: [],
    transform: transformKeywords },

  { source: "dateCreated",
    target: "date.created",
    default: "",
    transform: transformDate },

  { source: "dateModified",
    target: "date.lastModified",
    default: "",
    transform: transformDate },

  { source: "dateModified",
    target: "date.metadataLastUpdated",
    default: new Date().toISOString(),
    transform: transformDate },

  { source: "issueTracker",
    target: "feedbackMechanism",
    default: "" },

  { source: "developmentStatus",
    target: "status",
    default: "Development",
    transform: transformDevelopmentStatus },

  // defaults for required code.json fields
  { target: "permissions.usageType",
    default: [] },

  { target: "permissions.exemptionText",
    default: "" },

  { target: "organization",
    default: "" },

  { target: "repositoryVisibility",
    default: "public" },

  { target: "vcs",
    default: "git" },

  { target: "laborHours",
    default: 0 },

  { target: "reuseFrequency",
    default: {} },

  { target: "maintenance",
    default: "none" },

  { target: "contractNumber",
    default: [] },

  { target: "SBOM",
    default: "None" },

  { target: "AIUseCaseID",
    default: "0" },
]

// --------Transform Helpers-----------

// turns a date value to an ISO 8601 datetime string
function transformDate(value: unknown): string {
  if (typeof value !== "string") return ""
  if (value.includes("T")) return value
  return `${value}T00:00:00Z`
}

// converts codemeta `license` to code.json `permissions.licenses`
function transformLicense(value: unknown): { name: string; URL: string }[] {
  if (Array.isArray(value)) {
    return value
      .map(extractLicenseObject)
      .filter((x): x is { name: string; URL: string } => x !== null)
  }
  const single = extractLicenseObject(value)
  return single ? [single] : []
}

function extractLicenseObject(value: unknown): { name: string; URL: string } | null {
  if (typeof value === "string") {
    return { name: extractSpdxId(value), URL: value }
  }
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>
    const url =
      (typeof obj.URL === "string" && obj.URL) ||
      (typeof obj.url === "string" && obj.url) ||
      (typeof obj["@id"] === "string" && obj["@id"]) ||
      (typeof obj.id === "string" && obj.id) ||
      ""
    if (!url) return null
    return { name: extractSpdxId(url), URL: url }
  }
  return null
}

// SPDX identifiers permitted by code.json schema
const SPDX_VALID = new Set([
  "CC0-1.0", "Apache-2.0", "MIT", "MPL-2.0",
  "GPL-2.0-only", "GPL-3.0-only", "GPL-3.0-or-later",
  "LGPL-2.1-only", "LGPL-3.0-only",
  "BSD-2-Clause", "BSD-3-Clause", "EPL-2.0",
])

function extractSpdxId(url: string): string {
  const match = url.match(/spdx\.org\/licenses\/([^/?#]+?)(?:\.html)?$/i)
  if (!match || !match[1]) return "Other"
  const finalMatch = match[1]
  return SPDX_VALID.has(finalMatch) ? finalMatch : "Other"
}

// converts codemeta `author` to code.json `contact`
function transformAuthor(value: unknown): { name: string; email: string } {
  const person = Array.isArray(value) ? value[0] : value
  if (!person || typeof person !== "object") {
    return { name: "", email: "" }
  }
  const obj = person as Record<string, unknown>

  let name = ""
  if (typeof obj.name === "string" && obj.name.trim()) {
    name = obj.name.trim()
  } else {
    const given = typeof obj.givenName === "string" ? obj.givenName : ""
    const family = typeof obj.familyName === "string" ? obj.familyName : ""
    name = [given, family].filter(Boolean).join(" ").trim()
  }

  const email = typeof obj.email === "string" ? obj.email : ""
  return { name, email }
}

// converts codemeta `programmingLanguage` to code.json `languages`
function transformProgrammingLanguage(value: unknown): string[] {
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item
        if (typeof item === "object" && item !== null) {
          const obj = item as Record<string, unknown>
          return typeof obj.name === "string" ? obj.name : ""
        }
        return ""
      })
      .filter((x): x is string => x !== "")
  }
  return []
}

// converts codemeta `keywords` to code.json `tags`
function transformKeywords(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((x): x is string => typeof x === "string")
  }
  if (typeof value === "string") {
    return value.split(",").map((s) => s.trim()).filter(Boolean)
  }
  return []
}

// maps codemeta `developmentStatus` to the code.json `status` enum
function transformDevelopmentStatus(value: unknown): string {
  if (typeof value !== "string") return "Development"
  const map: Record<string, string> = {
    concept: "Ideation",
    wip: "Development",
    active: "Production",
    inactive: "Archival",
    unsupported: "Archival",
    moved: "Archival",
    suspended: "Archival",
    abandoned: "Archival",
  }
  return map[value.toLowerCase()] ?? "Development"
}