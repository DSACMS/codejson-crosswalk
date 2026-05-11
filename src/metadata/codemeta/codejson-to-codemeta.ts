import type { MappingEntry } from "../../types/MappingEntry"

export const codejsonToCodemetaMapping: MappingEntry[] = [
  { source: "name",
    target: "name",
    default: "" },

  { source: "description",
    target: "description",
    default: "" },

  { source: "repositoryURL",
    target: "codeRepository",
    default: "" },

  { source: "downloadURL",
    target: "downloadUrl",
    default: "" },

  { source: "homepageURL",
    target: "url",
    default: "" },

  { source: "version",
    target: "version",
    default: "",
    transform: (v) => String(v) },

  { source: "permissions.licenses",
    target: "license",
    default: "",
    transform: transformLicenseToCodemeta },

  { source: "contact",
    target: "author",
    default: { "@type": "Person" },
    transform: transformContactToAuthor },

  { source: "languages",
    target: "programmingLanguage",
    default: [],
    transform: transformLanguagesToCodemeta },

  { source: "tags",
    target: "keywords",
    default: [],
    transform: transformTagsToKeywords },

  { source: "date.created",
    target: "dateCreated",
    default: "",
    transform: stripMidnightUtc },

  { source: "date.lastModified",
    target: "dateModified",
    default: "",
    transform: stripMidnightUtc },

  { source: "feedbackMechanism",
    target: "issueTracker",
    default: "" },

  { source: "status",
    target: "developmentStatus",
    default: "active",
    transform: transformStatusToCodemeta },

  { target: "@context",
    default: "https://w3id.org/codemeta/3.0" },

  { target: "@type",
    default: "SoftwareSourceCode" },
]

// --------Transform Helpers-----------

// converts code.json `permissions.licenses` to codemeta `license`
function transformLicenseToCodemeta(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return ""

  const first = value[0] as Record<string, unknown> | undefined
  if (!first) return ""

  if (typeof first.URL === "string" && first.URL) {
    return first.URL
  }

  if (
    typeof first.name === "string" &&
    first.name &&
    first.name !== "Other" &&
    first.name !== "None"
  ) {
    return `https://spdx.org/licenses/${first.name}`
  }

  return ""
}

// converts code.json `contact` to codemeta `author`
function transformContactToAuthor(value: unknown): Record<string, unknown> {
  const result: Record<string, unknown> = { "@type": "Person" }

  if (!value || typeof value !== "object") return result
  const obj = value as Record<string, unknown>

  const name = typeof obj.name === "string" ? obj.name.trim() : ""
  if (name) {
    const tokens = name.split(/\s+/)
    if (tokens.length === 1) {
      result.givenName = tokens[0]
    } else {
      result.givenName = tokens[0]
      result.familyName = tokens.slice(1).join(" ")
    }
  }

  const email = typeof obj.email === "string" ? obj.email : ""
  if (email) result.email = email

  return result
}

// converts code.json `languages` to codemeta `programmingLanguage`
function transformLanguagesToCodemeta(value: unknown): unknown {
  if (!Array.isArray(value)) return []
  if (value.length === 1) return value[0]
  return value
}

// converts code.json `tags` to codemeta `keywords`
function transformTagsToKeywords(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((x): x is string => typeof x === "string")
  }
  if (typeof value === "string") {
    return value.split(",").map((s) => s.trim()).filter(Boolean)
  }
  return []
}

// strips a "T00:00:00Z" suffix from an ISO datetime
function stripMidnightUtc(value: unknown): string {
  if (typeof value !== "string") return ""
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T00:00:00(?:\.000)?Z$/)
  if (match && match[1]) return match[1]
  return value
}

// maps the code.json `status` enum to a codemeta `developmentStatus` value 
function transformStatusToCodemeta(value: unknown): string {
  if (typeof value !== "string") return "active"
  const map: Record<string, string> = {
    Ideation: "concept",
    Development: "wip",
    Alpha: "wip",
    Beta: "wip",
    "Release Candidate": "wip",
    Production: "active",
    Archival: "inactive",
  }
  return map[value] ?? "active"
}