import { describe, expect, test, mock } from "bun:test"
import { convert } from "../helpers/convert"
import type { MappingEntry } from "../types/MappingEntry"

describe("convert", () => {
  describe("1:1 renames", () => {
    test("copies a value from source key to target key", () => {
      const mapping: MappingEntry[] = [{ source: "name", target: "title" }]
      expect(convert({ name: "foo" }, mapping)).toEqual({ title: "foo" })
    })

    test("copies multiple fields in one pass", () => {
      const mapping: MappingEntry[] = [
        { source: "name", target: "title" },
        { source: "description", target: "summary" },
      ]
      expect(convert({ name: "foo", description: "bar" }, mapping)).toEqual({
        title: "foo",
        summary: "bar",
      })
    })

    test("copies a value to a target with the same key name", () => {
      const mapping: MappingEntry[] = [{ source: "name", target: "name" }]
      expect(convert({ name: "foo" }, mapping)).toEqual({ name: "foo" })
    })
  })

  describe("transforms", () => {
    test("runs the transform on the source value", () => {
      const mapping: MappingEntry[] = [
        { source: "version", target: "version", transform: (v) => String(v) },
      ]
      expect(convert({ version: 2 }, mapping)).toEqual({ version: "2" })
    })

    test("does not call the transform when the source value is missing", () => {
      const transform = mock((v: unknown) => String(v))
      const mapping: MappingEntry[] = [
        { source: "missing", target: "x", transform, default: "fallback" },
      ]
      const result = convert({}, mapping)
      expect(transform).not.toHaveBeenCalled()
      expect(result).toEqual({ x: "fallback" })
    })

    test("does not call the transform when the source value is null", () => {
      const transform = mock((v: unknown) => String(v))
      const mapping: MappingEntry[] = [
        { source: "empty", target: "x", transform, default: "fallback" },
      ]
      const result = convert({ empty: null }, mapping)
      expect(transform).not.toHaveBeenCalled()
      expect(result).toEqual({ x: "fallback" })
    })

    test("passes the raw value through when no transform is given", () => {
      const mapping: MappingEntry[] = [{ source: "tags", target: "keywords" }]
      expect(convert({ tags: ["a", "b"] }, mapping)).toEqual({ keywords: ["a", "b"] })
    })
  })

  describe("defaults for sourced entries", () => {
    test("writes default when the source path is absent", () => {
      const mapping: MappingEntry[] = [{ source: "a", target: "b", default: "fallback" }]
      expect(convert({}, mapping)).toEqual({ b: "fallback" })
    })

    test("writes default when the source value is null", () => {
      const mapping: MappingEntry[] = [{ source: "a", target: "b", default: "fallback" }]
      expect(convert({ a: null }, mapping)).toEqual({ b: "fallback" })
    })

    test("writes default when the source value is undefined", () => {
      const mapping: MappingEntry[] = [{ source: "a", target: "b", default: "fallback" }]
      expect(convert({ a: undefined }, mapping)).toEqual({ b: "fallback" })
    })

    test("writes nothing when source is absent AND no default is provided", () => {
      const mapping: MappingEntry[] = [{ source: "a", target: "b" }]
      expect(convert({}, mapping)).toEqual({})
    })

    test("does NOT use default for falsy but present values", () => {
      const mapping: MappingEntry[] = [{ source: "v", target: "v", default: "fallback" }]

      expect(convert({ v: 0 }, mapping)).toEqual({ v: 0 })
      expect(convert({ v: "" }, mapping)).toEqual({ v: "" })
      expect(convert({ v: false }, mapping)).toEqual({ v: false })
    })
  })

  describe("target-only entries", () => {
    test("writes the default when there's no source path", () => {
      const mapping: MappingEntry[] = [{ target: "status", default: "" }]
      expect(convert({}, mapping)).toEqual({ status: "" })
    })

    test("writes the target-only default regardless of source contents", () => {
      const mapping: MappingEntry[] = [{ target: "status", default: "Production" }]
      expect(convert({ status: "Alpha" }, mapping)).toEqual({ status: "Production" })
    })

    test("skips a target-only entry with no default", () => {
      const mapping: MappingEntry[] = [{ target: "status" }]
      expect(convert({}, mapping)).toEqual({})
    })
  })

  describe("nested paths", () => {
    test("writes to a nested target, creating intermediate objects", () => {
      const mapping: MappingEntry[] = [{ source: "license", target: "permissions.licenses" }]
      expect(convert({ license: "MIT" }, mapping)).toEqual({
        permissions: { licenses: "MIT" },
      })
    })

    test("reads from a nested source path", () => {
      const mapping: MappingEntry[] = [{ source: "date.created", target: "createdAt" }]
      expect(convert({ date: { created: "2024" } }, mapping)).toEqual({
        createdAt: "2024",
      })
    })

    test("merges multiple entries writing to the same parent", () => {
      const mapping: MappingEntry[] = [
        { source: "license", target: "permissions.licenses", default: [] },
        { target: "permissions.usageType", default: [] },
        { target: "permissions.exemptionText", default: "" },
      ]
      expect(convert({ license: "MIT" }, mapping)).toEqual({
        permissions: {
          licenses: "MIT",
          usageType: [],
          exemptionText: "",
        },
      })
    })
  })

  describe("integration of all three categories", () => {
    test("processes rename, transform, and target only default in one pass", () => {
      const mapping: MappingEntry[] = [
        { source: "name", target: "name", default: "" },
        { source: "version", target: "version", default: "", transform: (v) => String(v) },
        { target: "status", default: "Production" },
      ]
      expect(convert({ name: "thing", version: 2 }, mapping)).toEqual({
        name: "thing",
        version: "2",
        status: "Production",
      })
    })

    test("returns an empty object when the mapping is empty", () => {
      expect(convert({ name: "foo" }, [])).toEqual({})
    })
  })
})