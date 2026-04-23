import { describe, expect, test } from "bun:test"
import { getNestedValue, setNestedValue } from "../helpers/handle-nested-values"

describe("getNestedValue", () => {
  describe("happy paths", () => {
    test("reads a top level property", () => {
      expect(getNestedValue({ name: "foo" }, "name")).toBe("foo")
    })

    test("reads a one level deep nested property", () => {
      expect(getNestedValue({ date: { created: "2024" } }, "date.created")).toBe("2024")
    })

    test("reads a deeply nested property", () => {
      expect(getNestedValue({ a: { b: { c: { d: 42 } } } }, "a.b.c.d")).toBe(42)
    })

    test("returns falsy values as is in order to distinguish from missing", () => {
      expect(getNestedValue({ count: 0 }, "count")).toBe(0)
      expect(getNestedValue({ active: false }, "active")).toBe(false)
      expect(getNestedValue({ text: "" }, "text")).toBe("")
    })

    test("returns an array when the path lands on one", () => {
      expect(getNestedValue({ tags: ["a", "b"] }, "tags")).toEqual(["a", "b"])
    })

    test("returns null when the path lands on a null leaf", () => {
      expect(getNestedValue({ a: null } as Record<string, unknown>, "a")).toBeNull()
    })
  })

  describe("failure / edge cases", () => {
    test("returns undefined when the top-level key is missing", () => {
      expect(getNestedValue({ a: 1 }, "b")).toBeUndefined()
    })

    test("returns undefined when a nested key is missing", () => {
      expect(getNestedValue({ a: { b: 1 } }, "a.c")).toBeUndefined()
    })

    test("returns undefined when the path tries to traverse through a non-object (number)", () => {
      expect(getNestedValue({ a: 42 }, "a.b")).toBeUndefined()
    })

    test("returns undefined when the path traverses through null", () => {
      expect(getNestedValue({ a: null } as Record<string, unknown>, "a.b")).toBeUndefined()
    })

    test("returns undefined when the path traverses through undefined", () => {
      expect(getNestedValue({ a: undefined } as Record<string, unknown>, "a.b")).toBeUndefined()
    })

    test("returns undefined for an empty object with any non-empty path", () => {
      expect(getNestedValue({}, "a.b.c")).toBeUndefined()
    })
  })
})

describe("setNestedValue", () => {
  describe("happy paths", () => {
    test("writes a top-level property to an empty object", () => {
      const obj: Record<string, unknown> = {}

      setNestedValue(obj, "name", "foo")
      expect(obj).toEqual({ name: "foo" })
    })

    test("creates one intermediate object on the way to a nested leaf", () => {
      const obj: Record<string, unknown> = {}

      setNestedValue(obj, "date.created", "2024")
      expect(obj).toEqual({ date: { created: "2024" } })
    })

    test("creates a chain of intermediate objects for a deep path", () => {
      const obj: Record<string, unknown> = {}

      setNestedValue(obj, "a.b.c.d", 42)
      expect(obj).toEqual({ a: { b: { c: { d: 42 } } } })
    })

    test("merges into an existing nested object rather than overwriting it", () => {
      const obj: Record<string, unknown> = { date: { created: "2024" } }

      setNestedValue(obj, "date.lastModified", "2025")
      expect(obj).toEqual({ date: { created: "2024", lastModified: "2025" } })
    })

    test("supports multiple writes under a shared parent", () => {
      const obj: Record<string, unknown> = {}

      setNestedValue(obj, "permissions.licenses", [{ name: "MIT" }])
      setNestedValue(obj, "permissions.usageType", ["openSource"])
      setNestedValue(obj, "permissions.exemptionText", "")

      expect(obj).toEqual({
        permissions: {
          licenses: [{ name: "MIT" }],
          usageType: ["openSource"],
          exemptionText: "",
        },
      })
    })

    test("overwrites an existing leaf value at the same path", () => {
      const obj: Record<string, unknown> = { name: "old" }

      setNestedValue(obj, "name", "new")
      expect(obj).toEqual({ name: "new" })
    })

    test("writes falsy values faithfully", () => {
      const obj: Record<string, unknown> = {}

      setNestedValue(obj, "count", 0)
      setNestedValue(obj, "active", false)
      setNestedValue(obj, "text", "")
      setNestedValue(obj, "nothing", null)

      expect(obj).toEqual({ count: 0, active: false, text: "", nothing: null })
    })
  })

  describe("failure / edge cases", () => {
    test("replaces a non-object primitive intermediate with a fresh object", () => {
      const obj: Record<string, unknown> = { a: 42 }

      setNestedValue(obj, "a.b", "new")
      expect(obj).toEqual({ a: { b: "new" } })
    })

    test("replaces an array intermediate with a fresh object", () => {
      const obj: Record<string, unknown> = { a: [1, 2, 3] }

      setNestedValue(obj, "a.b", "new")
      expect(obj).toEqual({ a: { b: "new" } })
    })

    test("replaces a null intermediate with a fresh object", () => {
      const obj: Record<string, unknown> = { a: null }

      setNestedValue(obj, "a.b", "new")
      expect(obj).toEqual({ a: { b: "new" } })
    })

    test("replaces an undefined intermediate with a fresh object", () => {
      const obj: Record<string, unknown> = { a: undefined }
      
      setNestedValue(obj, "a.b", "new")
      expect(obj).toEqual({ a: { b: "new" } })
    })
  })
})