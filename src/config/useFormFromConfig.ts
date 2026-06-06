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

// Engine for config-driven forms: derives default values and the ordered field
// list from a FormConfig. The zod schema is wired in a follow-up (still null
// here, hence the wip).
export function useFormFromConfig(config: FormConfig) {
    // memoized on the `config` array reference. A caller passing an
    // inline array literal gets a new reference every render -> defaults rebuild
    // -> fields remount. Returned to later.
    const defaults = useMemo(
        () => Object.fromEntries(config.map((f) => [f.name, f.defaultValue ?? emptyValueFor(f.type)])),
        [config],
    )

    const fields = config

    // schema rebuilds on every render that passes a new config ref.
    const schema = useMemo(() => buildSchema(config), [config])

    return { defaults, fields, schema }
}
