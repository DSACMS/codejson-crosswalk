# Conversion Engine

This document explains how the generic conversion engine works. The engine is responsible for converting metadata between formats (e.g., codemeta.json → code.json and back). It has no knowledge of any specific metadata format — all format-specific logic lives in mapping files.

## Architecture Overview

The conversion system has three parts that work together:

**Mapping files** describe the relationship between two metadata formats. Each mapping file is an array of entries that say "this field in the source maps to that field in the target." Mapping files live in format-specific modules (e.g., `codemeta-to-codejson-mapping.ts`) and contain all the domain knowledge about how fields relate to each other.

**The engine** (`engine.ts`) is a generic loop that reads from a source object, optionally transforms the value, and writes to a target object. It consumes any mapping file and works identically regardless of which metadata formats are involved.

**Coordinator functions** (e.g., `to-codejson.ts`, `to-codemeta.ts`) are thin wrappers that read input, select the right mapping file, and call the engine. They're the public API surface.

The data flows like this:

```
Input (file or object)
    │
    ▼
Coordinator (reads input, selects mapping)
    │
    ▼
Engine (loops through mapping, calls helpers)
    │    ├── getNestedValue() to read from source
    │    ├── transform() to reshape values (when needed)
    │    └── setNestedValue() to write to target
    │
    ▼
Output (converted metadata object)
```

## Mapping Entries

Each entry in a mapping array has the following shape:

```typescript
type MappingEntry = {
  source?: string                          // dot-notation path to read from the source object
  target: string                           // dot-notation path to write to in the target object
  transform?: (value: unknown) => unknown  // optional function to reshape the value
  default?: unknown                        // fallback value when source is missing
}
```

Entries fall into three categories depending on which fields are present.

**1:1 renames** have a `source` and `target` with no transform. The value moves from one key name to another unchanged. For example, codemeta's `codeRepository` field holds the same data as code.json's `repositoryURL` — only the key name differs. These entries look like `{ source: "codeRepository", target: "repositoryURL", default: "" }`.

**Transformed fields** have a `source`, `target`, and a `transform` function. The value needs to be reshaped during conversion because the two formats represent the same concept differently. For example, codemeta stores `license` as a URL string like `"https://spdx.org/licenses/MIT"`, while code.json expects `permissions.licenses` to be an array of objects like `[{ name: "MIT", URL: "..." }]`. The transform function handles that reshaping.

**Target-only defaults** have a `target` and `default` but no `source`. These represent fields that are required in the target format but have no equivalent in the source format. For example, code.json requires a `status` field (with values like "Production" or "Alpha"), but codemeta has no concept of development status. These entries ensure the output always includes the field with a placeholder value, so the user knows it needs to be filled in.

## Helper Functions

### `getNestedValue(obj, path)`

This function reads a value from an object using a dot-notation string path. It exists because JavaScript doesn't natively support reading nested properties with a string like `"date.created"` — you'd normally have to write `obj.date.created`, which requires knowing the path at compile time. Since our mapping paths are dynamic strings, we need a function that can walk into an object step by step.

The function works by splitting the path on `.` to get an array of keys, then walking through the object one key at a time. At each step, it moves a pointer one level deeper into the object. If it encounters `null`, `undefined`, or a non-object at any point along the path, it returns `undefined` immediately rather than crashing.

Here is a concrete example. Given this source object and the path `"date.created"`:

```typescript
const source = {
  date: {
    created: "2024-06-15",
    lastModified: "2025-02-20"
  }
}

getNestedValue(source, "date.created")
```

The function splits `"date.created"` into `["date", "created"]`. It starts with a pointer to the top-level `source` object. On the first iteration, it reads `source["date"]` and moves the pointer to the inner object `{ created: "2024-06-15", lastModified: "2025-02-20" }`. On the second iteration, it reads `["created"]` from that inner object and gets `"2024-06-15"`. The loop ends and the function returns `"2024-06-15"`.

For a flat path like `"name"`, the split produces `["name"]`, the loop runs once, and it reads `source["name"]` directly. The same function handles both flat and nested reads.

When a path doesn't exist in the source, the function safely returns `undefined`. For example, calling `getNestedValue(source, "permissions.licenses")` on a source with no `permissions` key would read `source["permissions"]` and get `undefined`. The safety check catches this before trying to read `undefined["licenses"]` (which would crash), and returns `undefined` instead. The engine interprets this as "the source doesn't have this field" and falls through to the default value.

### `setNestedValue(obj, path, value)`

This function writes a value into an object at a dot-notation path, creating any intermediate objects that don't exist yet. It's the counterpart to `getNestedValue` — one reads, the other writes.

The key design detail is that the function loops through **all keys except the last one**. The keys before the last one are "containers" — objects that need to exist for the final write to have somewhere to land. The last key is the "destination" where the actual value gets written.

Here is a concrete example. Given an empty target object and the path `"date.created"`:

```typescript
const target = {}
setNestedValue(target, "date.created", "2024-06-15T00:00:00Z")
```

The function splits the path into `["date", "created"]`. It loops through all keys except the last, so it only processes `"date"`. It checks whether `target["date"]` exists — it doesn't, so the function creates it as an empty object `{}`. The pointer moves into that new object. After the loop, the function writes the value at the last key: `target["date"]["created"] = "2024-06-15T00:00:00Z"`. The result is `{ date: { created: "2024-06-15T00:00:00Z" } }`.

**Merge behavior** is critical to understand. When the engine later processes `dateModified` and calls `setNestedValue(target, "date.lastModified", "2025-02-20T00:00:00Z")`, the function checks whether `target["date"]` exists. This time it does — it's the object created by the previous call. Since it already exists and is a valid object, the function does **not** overwrite it with `{}`. It moves the pointer into the existing object and writes `lastModified` alongside the existing `created` field. The result is:

```typescript
{
  date: {
    created: "2024-06-15T00:00:00Z",
    lastModified: "2025-02-20T00:00:00Z"
  }
}
```

This merge behavior is how the `permissions` object gets built correctly. The `license` transform writes to `permissions.licenses`, and later entries write to `permissions.usageType` and `permissions.exemptionText`. Each call sees that `permissions` already exists and writes into it rather than replacing it.

For a flat path like `"name"`, the split produces `["name"]`. The loop condition `i < keys.length - 1` evaluates to `i < 0`, so the loop never runs — there are no containers to create. The function jumps straight to writing `target["name"] = value`.

## The Engine Loop

The `convert` function ties everything together. It takes a source object and a mapping array, creates an empty target object, and processes each mapping entry in sequence. Here is the logic with annotations:

```typescript
function convert(source, mapping) {
  const target = {}

  for (const entry of mapping) {
    if (entry.source) {
      // This entry reads from the source object
      const raw = getNestedValue(source, entry.source)

      if (raw !== undefined && raw !== null) {
        // Value exists — apply transform if present, then write
        const value = entry.transform ? entry.transform(raw) : raw
        setNestedValue(target, entry.target, value)
      } else if (entry.default !== undefined) {
        // Value missing — write the default instead
        setNestedValue(target, entry.target, entry.default)
      }

    } else if (entry.default !== undefined) {
      // No source path — this is a target-only default
      setNestedValue(target, entry.target, entry.default)
    }
  }

  return target
}
```

The engine makes a series of decisions for each entry, structured as a decision tree:

```
Does this entry have a source path?
│
├── YES → Read from source using getNestedValue
│   │
│   ├── Value found → Apply transform (if any), write to target
│   │
│   └── Value not found → Write default to target (if default exists)
│
└── NO → This is a target-only entry, write default to target
```

Each category of mapping entry follows a different path through this tree. A 1:1 rename goes through the "YES → Value found" branch with no transform. A transformed field goes through the same branch but runs the transform function before writing. A field where the source doesn't have the expected data goes through "YES → Value not found" and falls back to the default. A target-only default goes through the "NO" branch and writes directly.

## Full Conversion Example

To see everything working together, consider converting this codemeta.json file to code.json:

```json
{
  "name": "my-cool-tool",
  "description": "A tool that does cool things",
  "license": "https://spdx.org/licenses/MIT",
  "keywords": "healthcare, open source, FHIR",
  "dateCreated": "2024-06-15"
}
```

The engine processes the mapping entries in order, building up the target object incrementally:

```
Entry: { source: "name", target: "name", default: "" }
  → getNestedValue reads "my-cool-tool"
  → setNestedValue writes target.name = "my-cool-tool"
  → target: { name: "my-cool-tool" }

Entry: { source: "description", target: "description", default: "" }
  → getNestedValue reads "A tool that does cool things"
  → setNestedValue writes target.description = "A tool..."
  → target: { name: "my-cool-tool", description: "A tool..." }

Entry: { source: "license", target: "permissions.licenses", transform: transformLicense }
  → getNestedValue reads "https://spdx.org/licenses/MIT"
  → transformLicense converts it to [{ name: "MIT", URL: "https://..." }]
  → setNestedValue creates target.permissions = {}, then writes licenses inside it
  → target: { ..., permissions: { licenses: [{ name: "MIT", URL: "..." }] } }

Entry: { source: "keywords", target: "tags", transform: transformKeywords }
  → getNestedValue reads "healthcare, open source, FHIR"
  → transformKeywords splits into ["healthcare", "open source", "FHIR"]
  → setNestedValue writes target.tags = [...]
  → target: { ..., tags: ["healthcare", "open source", "FHIR"] }

Entry: { source: "dateCreated", target: "date.created", transform: transformDate }
  → getNestedValue reads "2024-06-15"
  → transformDate converts to "2024-06-15T00:00:00Z"
  → setNestedValue creates target.date = {}, then writes created inside it
  → target: { ..., date: { created: "2024-06-15T00:00:00Z" } }

Entry: { target: "status", default: "" }
  → No source path, target-only default
  → setNestedValue writes target.status = ""
  → target: { ..., status: "" }

Entry: { target: "permissions.usageType", default: [] }
  → No source path, target-only default
  → setNestedValue sees target.permissions already exists, merges into it
  → target: { ..., permissions: { licenses: [...], usageType: [] } }

...remaining entries continue building target...
```

The final output contains every required code.json field. Fields that had codemeta equivalents are populated with converted data. Fields that had no equivalent are present with placeholder defaults for the user to fill in. The engine processed all three categories of mapping entries through the same loop without any format-specific logic.