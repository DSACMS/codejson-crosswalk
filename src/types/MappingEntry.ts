export type MappingEntry = {
    source?: string
    target: string
    transform?: (value: unknown) => unknown
    default?: unknown
}