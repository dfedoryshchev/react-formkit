import { useMemo } from 'react'
import type { FormConfig, FieldConfig } from './config.types'
import { buildSchema } from './buildSchema'

const emptyValueFor = (type: FieldConfig['type']): unknown => {
    switch (type) {
        case 'numeric':
            return undefined
        case 'checkbox':
        case 'switch':
            return false
        case 'select':
        case 'radio':
            return null
        case 'checkbox-group':
        case 'multiselect':
        case 'multi-autocomplete':
            return []
        default:
            return ''
    }
}

const functionIds = new WeakMap<object, number>()
let nextFunctionId = 0

const functionId = (fn: object): number => {
    let id = functionIds.get(fn)
    if (id === undefined) {
        id = nextFunctionId++
        functionIds.set(fn, id)
    }
    return id
}

// JSON.stringify writes a RegExp as {} and drops functions, so both would be
// invisible to the memo. A function is keyed by identity: its source text
// cannot see the values its closure reads.
const encode = (_key: string, value: unknown): unknown => {
    if (value instanceof RegExp) return `regexp:${String(value)}`
    if (typeof value === 'function') return `function:${functionId(value)}`
    return value
}

const schemaSignatureOf = (config: FormConfig) =>
    JSON.stringify(
        config.map((f) => [f.name, f.type, f.validation, f.showWhen]),
        encode,
    )

const defaultsSignatureOf = (config: FormConfig) =>
    JSON.stringify(
        config.map((f) => [f.name, f.type, f.defaultValue]),
        encode,
    )

const duplicateNames = (config: FormConfig): string[] => {
    const seen = new Set<string>()
    const dupes = new Set<string>()
    for (const field of config) {
        if (seen.has(field.name)) dupes.add(field.name)
        seen.add(field.name)
    }
    return [...dupes]
}

// Engine for config-driven forms: derives default values, the ordered field
// list, and the zod schema from a FormConfig.
export function useFormFromConfig(config: FormConfig) {
    // Duplicate field names would silently last-win in both the defaults and
    // the derived schema; surface it as a configuration error instead.
    const dupes = duplicateNames(config)
    if (dupes.length > 0) {
        throw new Error(`useFormFromConfig: duplicate field name(s): ${dupes.join(', ')}`)
    }

    const defaultsSig = defaultsSignatureOf(config)
    const schemaSig = schemaSignatureOf(config)

    const defaults = useMemo(
        () =>
            Object.fromEntries(
                config.map((f) => [f.name, f.defaultValue ?? emptyValueFor(f.type)]),
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [defaultsSig],
    )

    const schema = useMemo(
        () => buildSchema(config),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [schemaSig],
    )

    const fields = config

    return { defaults, fields, schema }
}
