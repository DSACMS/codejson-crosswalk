# Mapping Files

This document explains how the mapping files work and how to create new ones. Mapping files are the core of the hub-and-spoke architecture — they contain all the knowledge about how fields in one metadata format relate to fields in another. The conversion engine is generic and reusable, but each mapping file is specific to a pair of formats.

## What a Mapping File Is

A mapping file is a TypeScript module that exports an array of `MappingEntry` objects. Each entry describes one field-level relationship between a source format and a target format. The engine processes these entries in order, reading from the source object and writing to the target object according to what each entry says.

Think of a mapping file as a translation dictionary. If the source format is French and the target format is English, each entry says "this French word means this English word." Some words translate directly (1:1 renames). Some words need extra context to translate correctly (transforms). And some English words have no French equivalent at all, so you provide a placeholder (target-only defaults).

A mapping file also contains any transform functions that are specific to that format pair. These live in the same file as the mapping array because they are tightly coupled — a transform function for codemeta's `license` field only makes sense in the context of converting to code.json's `permissions.licenses` structure.

## The MappingEntry Type

Every entry in a mapping array has this shape:

```typescript
type MappingEntry = {
  source?: string                          // dot-notation path to read from the source object
  target: string                           // dot-notation path to write to in the target object
  transform?: (value: unknown) => unknown  // optional function to reshape the value
  default?: unknown                        // fallback value when source is missing
}
```

The only required field is `target`, because every entry must write somewhere. Everything else is optional, and which fields are present determines how the engine processes the entry.

## Three Categories of Entries

### 1:1 Renames

These are the simplest entries. The source format and target format both have a field that holds the same data — only the key name differs. The value moves from one key to another without any modification.

```typescript
{ source: "codeRepository", target: "repositoryURL", default: "" }
```

This entry says: read the value at `codeRepository` in the source object and write it to `repositoryURL` in the target object. If `codeRepository` doesn't exist in the source, write an empty string instead. The engine calls `getNestedValue(source, "codeRepository")` to read, and if it finds a value, calls `setNestedValue(target, "repositoryURL", value)` to write. No reshaping happens.

The `default` field matters here because it controls what ends up in the target when the source doesn't have this field. For string fields, an empty string `""` is the standard placeholder. For array fields, an empty array `[]`. For number fields, `0`. The default should match the type that the target schema expects for that field.

Sometimes the key names are identical in both formats. That's fine — the entry still needs to exist so the engine knows to copy the value:

```typescript
{ source: "name", target: "name", default: "" }
```

This looks like a no-op, but it's important. Without this entry, the engine wouldn't know that `name` should appear in the output at all. The mapping array is an explicit list of what gets included. If a field isn't in the mapping, it doesn't exist in the output.

### Transformed Fields

These entries have a `transform` function because the source and target formats represent the same concept in structurally different ways. The transform function receives the raw value from the source and returns the reshaped value that the target expects.

```typescript
{ source: "license", target: "permissions.licenses", default: [],
  transform: transformLicense }
```

This entry says: read `license` from the source, pass it through `transformLicense`, and write the result to `permissions.licenses` in the target. The `default` of `[]` is used if the source has no `license` field — in that case the transform never runs, and the target gets an empty array.

The transform function itself lives in the same file, above the mapping array:

```typescript
function transformLicense(value: unknown): { name: string; URL: string }[] {
  if (typeof value === "string") {
    return [{ name: extractSpdxId(value), URL: value }]
  }
  // ... handle other cases
  return []
}
```

Notice the type signature. The input is `unknown` because the engine doesn't know what type the source value will be — it passes whatever it finds. The transform is responsible for checking the type and handling different cases. This is by design. Codemeta's `license` field can be either a URL string or a CreativeWork object, and the transform needs to handle both.

The transform function should always return a value that matches what the target schema expects. In this case, code.json's `permissions.licenses` is an array of objects with `name` and `URL` fields, so that's what the transform returns.

Transforms also appear in the reverse mapping. Converting code.json back to codemeta requires inverse transforms that undo what the forward transforms did:

```typescript
// Forward (codemeta → code.json):
// "https://spdx.org/licenses/MIT" → [{ name: "MIT", URL: "https://..." }]

// Reverse (code.json → codemeta):
// [{ name: "MIT", URL: "https://..." }] → "https://spdx.org/licenses/MIT"
```

These inverse transforms are not automatically generated. They live in the reverse mapping file (`codejson-to-codemeta-mapping.ts`) and are written by hand. This is intentional — some conversions are lossy, and the inverse transform needs to make explicit decisions about what to do when information was lost in the forward direction.

### Target-Only Defaults

These entries have no `source` field at all. They represent fields that are required (or useful) in the target format but have no equivalent in the source format. Since there's nothing to read from the source, the entry just writes a default value to the target.

```typescript
{ target: "status", default: "" }
```

This entry says: write an empty string to `status` in the target. There is no source path to read from, and no transform to run. The engine sees that `source` is absent, skips the reading step entirely, and writes the default directly.

Target-only defaults exist so that the output is structurally complete. Code.json requires a `status` field with values like "Production" or "Alpha", but codemeta has no concept of development status. Rather than omitting the field (which would make the output invalid), the mapping writes an empty placeholder. The user can then fill it in manually or programmatically.

The `default` value should match the type the target schema expects. For enum string fields like `status`, an empty string signals "not yet set." For required array fields, an empty array `[]`. For required number fields, `0`. For nullable fields, `null`.

## Dot-Notation Paths

Both `source` and `target` fields use dot-notation strings to express nested paths. The path `"permissions.licenses"` means "the `licenses` property inside the `permissions` object." The path `"date.created"` means "the `created` property inside the `date` object."

This notation keeps the mapping entries declarative and readable. Instead of writing a transform function just to put a value inside a nested object, you express the nesting in the path string and let the engine's `setNestedValue` helper build the structure automatically.

Dot-notation paths work for both reading and writing. On the source side, `"date.created"` tells the engine to walk into `source.date` and then read `.created`. On the target side, `"permissions.licenses"` tells the engine to create a `permissions` object in the target (if it doesn't exist yet) and write `licenses` inside it.

When multiple entries write to different properties under the same parent, the engine merges them. For example, these three entries all write under `permissions`:

```typescript
{ source: "license", target: "permissions.licenses", default: [], transform: transformLicense }
{ target: "permissions.usageType", default: [] }
{ target: "permissions.exemptionText", default: null }
```

The first entry creates the `permissions` object and writes `licenses` into it. The second entry sees that `permissions` already exists and writes `usageType` alongside `licenses` without overwriting anything. The third entry does the same for `exemptionText`. The final result is a single `permissions` object containing all three fields.

This merge behavior means you can spread related fields across multiple entries without worrying about ordering. However, it's good practice to group entries that write to the same parent object near each other in the mapping array, simply for readability.

## Writing a Transform Function

Transform functions follow a consistent pattern. They receive an `unknown` value (because the engine can't predict the source data type), validate or narrow the type, reshape it, and return the result.

Here is the general structure:

```typescript
function transformSomething(value: unknown): TargetType {
  // Step 1: Handle the most common case
  if (typeof value === "string") {
    return reshapeString(value)
  }

  // Step 2: Handle alternative representations
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>
    return reshapeObject(obj)
  }

  // Step 3: Handle arrays if the source field can be an array
  if (Array.isArray(value)) {
    return value.map(item => reshapeSingleItem(item))
  }

  // Step 4: Return a safe fallback if none of the above matched
  return defaultValue
}
```

Not every transform needs all four steps. A simple transform like version coercion is a one-liner:

```typescript
transform: (v) => String(v)
```

A complex transform like `transformAuthor` needs to handle single objects, arrays, and missing properties. The complexity of the transform should match the complexity of the mismatch between formats. Don't write a full function when an inline arrow function will do, and don't use an inline arrow function when the logic warrants a named function with clear steps.

When writing transforms, keep these principles in mind.

**Always handle `unknown` defensively.** The engine passes whatever it finds in the source object. If the codemeta spec says `license` is a URL string but a real-world file has it as an object, the transform should handle both cases rather than crashing.

**Return the exact shape the target schema expects.** If code.json's `permissions.licenses` is an array of `{ name, URL }` objects, that's what your transform must return. The engine doesn't validate the output — it trusts the transform.

**Keep transforms pure.** A transform receives a value and returns a value. It should not read from external state, make network calls, or mutate anything. This makes transforms predictable and testable in isolation.

**Name helper functions clearly.** If a transform uses helper logic (like `extractSpdxId` for parsing SPDX identifiers from URLs), extract it into a named function with a docstring. Future contributors will encounter these functions when adding or modifying mappings.

## Lossy Conversions

Some conversions lose data, and the mapping files should make this explicit through code comments and documentation. Data loss happens in two directions.

**Fields with no equivalent.** Codemeta has `copyrightHolder`, but code.json has no place for it. When converting codemeta → code.json, copyright holder information is silently dropped because there's simply no mapping entry for it. The same is true in reverse — code.json's `laborHours` has no codemeta equivalent.

**Structural mismatch.** Code.json's `contact` is a single object, but codemeta's `author` can be an array of Person objects. The `transformAuthor` function takes the first author and drops the rest. In the reverse direction, `transformContactToAuthor` takes a single contact and creates a single Person — any co-authors that existed in the original codemeta are permanently lost after a round trip.

This is a known and accepted limitation. The mapping files document these decisions so that users understand what data survives a conversion and what doesn't. When round-trip fidelity matters, both mapping files should be reviewed together to identify which fields lose data in each direction.

## Adding a New Spoke Format

The hub-and-spoke architecture means code.json is always the center. Every other format connects to code.json through a pair of mapping files — one for each direction. Adding support for a new metadata format (e.g., `citation.cff`) requires three steps.

**First**, study the new format's schema alongside the code.json schema. Build a field mapping table that categorizes every field into one of three buckets: 1:1 renames, transform needed, or no equivalent. This table is the blueprint for both mapping files and should be saved as reference documentation.

**Second**, create the forward mapping file (e.g., `citation-to-codejson-mapping.ts`). Start with the 1:1 renames to establish the pattern, then add target-only defaults for required code.json fields that have no equivalent in the new format, and finally write transforms for fields that need reshaping. Test each category incrementally.

**Third**, create the reverse mapping file (e.g., `codejson-to-citation-mapping.ts`). This is the inverse of the forward mapping. Many transforms will need inverse functions. Pay attention to lossy conversions — document which fields lose data in each direction.

You also need a thin coordinator function for each direction (e.g., `to-citation.ts`) that reads input and calls the engine with the appropriate mapping. These coordinators follow the exact same pattern as the existing `to-codejson.ts` and `to-codemeta.ts` files.

The engine itself should not change when adding a new format. If you find yourself wanting to modify the engine to support a new format, that's a signal that the format's complexity should be handled in the mapping's transform functions instead.

## Existing Mapping Files

The following mapping files are currently implemented.

**`codemeta-to-codejson-mapping.ts`** converts codemeta.json to code.json. It maps 12 codemeta fields to their code.json equivalents (5 as 1:1 renames, 7 with transforms) and provides target-only defaults for all required code.json fields that have no codemeta equivalent. Transform highlights include `transformLicense` (URL string → array of license objects with SPDX extraction), `transformAuthor` (Person object → contact object with name joining), and `transformKeywords` (comma-delimited string → array of strings).

**`codejson-to-codemeta-mapping.ts`** converts code.json to codemeta.json. It maps the same 12 fields in reverse and provides target-only defaults for common codemeta fields including `@context` and `@type` (required JSON-LD fields). Transform highlights include `transformLicenseToCodemeta` (array of license objects → single URL string), `transformContactToAuthor` (contact object → Person object with name splitting), and `transformTagsToKeywords` (array of strings → comma-delimited string).