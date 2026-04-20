/**
 * Reads a value from a nested object using a dot-notation path.
 *
 * getNestedValue({ a: { b: { c: 42 } } }, "a.b.c") → 42
 * getNestedValue({ a: 1 }, "a.b.c") → undefined
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const keys = path.split(".")
    let current: unknown = obj
  
    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== "object") {
        return undefined
      }
      current = (current as Record<string, unknown>)[key]
    }
  
    return current
  }
  
/**
 * Writes a value to a nested object using a dot-notation path.
 *
 * const obj = {}
 * setNestedValue(obj, "a.b.c", 42)   → { a: { b: { c: 42 } } }
 * setNestedValue(obj, "a.b.d", 99)   → { a: { b: { c: 42, d: 99 } } }
 */
export function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split(".")
    let current: Record<string, unknown> = obj

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (key === undefined) continue
      if (
        current[key] === undefined ||
        current[key] === null ||
        typeof current[key] !== "object" ||
        Array.isArray(current[key])
      ) {
        current[key] = {}
      }
      current = current[key] as Record<string, unknown>
    }

    const lastKey = keys[keys.length - 1]
    
    if (lastKey !== undefined) {
      current[lastKey] = value
    }
}