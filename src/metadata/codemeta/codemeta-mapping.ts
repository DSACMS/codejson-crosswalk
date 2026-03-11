import type { MappingEntry } from "../../types/MappingEntry";

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
      transform: (x) => x },

    { source: "author",    
      target: "contact", 
      default: { name: "", email: "" },
      transform: (x) => x },

    { source: "programmingLanguage",  
      target: "languages", 
      default: [],
      transform: (x) => x },

    { source: "keywords",
      target: "tags", 
      default: [],
      transform: (x) => x },

    { source: "dateCreated", 
      target: "date.created", 
      default: "",
      transform: transformDate },

    { source: "dateModified", 
      target: "date.lastModified", 
      default: "",
      transform: transformDate },

    { target: "status",
      default: "" },

    { target: "permissions.usageType",
      default: [] },

    { target: "permissions.exemptionText",
      default: "" },

    { target: "organization",
      default: "" },

    { target: "repositoryVisibility",
      default: "" },

    { target: "vcs",
      default: "" },

    { target: "laborHours",
      default: 0 },

    { target: "reuseFrequency",
      default: {} },

    { target: "maintenance",
      default: "" },

    { target: "contractNumber",
      default: [] },

    { target: "SBOM",
      default: "" },

    { target: "date.metadataLastUpdated",
      default: "" },

    { target: "feedbackMechanism",
      default: "" },

    { target: "AIUseCaseID",
      default: "" },

    { target: "disclaimerURL",
      default: "" },

    { target: "disclaimerText",
      default: "" },

    { target: "relatedCode",
      default: [] },

    { target: "reusedCode",
      default: [] },

    { target: "partners",
      default: [] },
]

// ─── Transform Helpers ────

/**
* Coerces a date value to an ISO 8601 datetime string.
* codemeta dates may be plain dates like "2024-01-15".
* code.json expects full datetime format.
*/
function transformDate(value: unknown): string {
if (typeof value !== "string") return ""
if (value.includes("T")) return value
return `${value}T00:00:00Z`
}
