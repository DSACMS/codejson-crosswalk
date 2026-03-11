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
    transform: (x) => x },

  { source: "languages",
    target: "programmingLanguage", 
    default: [],
    transform: transformLanguagesToCodemeta },

  { source: "tags", 
    target: "keywords", 
    default: "",
    transform: transformTagsToKeywords },

  { source: "date.created", 
    target: "dateCreated", 
    default: "",
    transform: (x) => x },

  { source: "date.lastModified", 
    target: "dateModified", 
    default: "",
    transform: (x) => x },

  { target: "@context", 
    default: "https://doi.org/10.5063/schema/codemeta-2.0" },

  { target: "@type",
    default: "SoftwareSourceCode" },

  { target: "applicationCategory", 
    default: "" },

  { target: "applicationSubCategory", 
    default: "" },

  { target: "citation",
    default: "" },

  { target: "contributor",
    default: [] },

  { target: "copyrightHolder",
    default: "" },

  { target: "copyrightYear",
    default: "" },

  { target: "datePublished",
    default: "" },

  { target: "editor",
    default: "" },

  { target: "funder",
    default: "" },

  { target: "identifier",
    default: "" },

  { target: "isAccessibleForFree",
    default: "" },

  { target: "license", 
    default: "" },

  { target: "operatingSystem",
    default: "" },

  { target: "publisher",
    default: "" },

  { target: "relatedLink", 
    default: "" },

  { target: "releaseNotes", 
    default: "" },

  { target: "runtimePlatform", 
    default: "" },

  { target: "softwareRequirements", 
    default: "" },

  { target: "softwareVersion", 
    default: "" },

  { target: "sponsor", 
    default: "" },
]

// ─── Transform Helpers ────

/**
 * Converts code.json `permissions.licenses` to codemeta `license`.
 *
 * code.json licenses is an array of { name, URL } objects.
 * codemeta expects a single URL string.
 * Takes the URL from the first license entry.
 */
function transformLicenseToCodemeta(value: unknown): string {
    if (!Array.isArray(value) || value.length === 0) return ""
  
    const first = value[0] as Record<string, unknown> | undefined
    if (!first) return ""
  
    // Prefer the URL field, fall back to constructing an SPDX URL from the name
    if (typeof first.URL === "string" && first.URL) {
      return first.URL
    }
  
    if (typeof first.name === "string" && first.name && first.name !== "Other" && first.name !== "None") {
      return `https://spdx.org/licenses/${first.name}`
    }
  
    return ""
  }
  
  /**
   * Converts code.json `languages` array to codemeta `programmingLanguage`.
   *
   * code.json `languages` is a simple array of strings.
   * codemeta expects ComputerLanguage objects or plain strings.
   * We keep them as strings since that's valid codemeta.
   */
  function transformLanguagesToCodemeta(value: unknown): unknown {
    if (!Array.isArray(value)) return []
    if (value.length === 1) return value[0]
    return value
  }
  
  /**
   * Converts code.json `tags` array to codemeta `keywords`.
   *
   * code.json uses an array of strings.
   * codemeta spec says comma-delimited string.
   */
  function transformTagsToKeywords(value: unknown): string {
    if (Array.isArray(value)) return value.join(", ")
    if (typeof value === "string") return value
    return ""
  }
  