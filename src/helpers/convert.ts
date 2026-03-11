import type { MappingEntry } from "../types/MappingEntry"
import { getNestedValue, setNestedValue } from "./handle-nested-values"

/**
 * Converts a source object to a target object using the provided mapping.
 *
 * For each entry in the mapping:
 *   1. If a source path exists, try to read the value from the source object
 *   2. If a value is found, apply the transform (if any) and write to target
 *   3. If no value is found, write the default (if any) to target
 *   4. If no source path exists (target-only entry), write the default to target
 */
export function convert(
  source: Record<string, unknown>,
  mapping: MappingEntry[]
): Record<string, unknown> {
  const target: Record<string, unknown> = {}

  for (const entry of mapping) {
    if (entry.source) {
      const raw = getNestedValue(source, entry.source)

      if (raw !== undefined && raw !== null) {
        const value = entry.transform ? entry.transform(raw) : raw
        setNestedValue(target, entry.target, value)
      } else if (entry.default !== undefined) {
        setNestedValue(target, entry.target, entry.default)
      }
    } else if (entry.default !== undefined) {
      setNestedValue(target, entry.target, entry.default)
    }
  }

  return target
}