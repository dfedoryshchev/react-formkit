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

const signatureOf = (config: FormConfig) => config.map((f) => `${f.name}:${f.type}`).join('|')

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

    // Memoize on a stable signature (field names + types) so an inline config
    // array literal no longer rebuilds defaults/schema on every render.
    // Trade-off: changing validation rules without changing names/types will
    // not refresh the schema.
    const sig = signatureOf(config)

    const defaults = useMemo(
        () => Object.fromEntries(config.map((f) => [f.name, f.defaultValue ?? emptyValueFor(f.type)])),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [sig],
    )

    const schema = useMemo(
        () => buildSchema(config),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [sig],
    )

    const fields = config

    return { defaults, fields, schema }
}
