import { useMemo } from 'react'
import { z, ZodTypeAny } from 'zod'
import type { FormConfig, FieldConfig } from './config.types'

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

    // wip: rough first pass. Everything is treated as a string and only the
    // length rules are honoured; `required` is a no-op and numeric/boolean
    // fields, min/max, email and pattern are not handled yet. Reworked later.
    const schema = useMemo(() => {
        const shape: Record<string, ZodTypeAny> = {}
        for (const field of config) {
            let s: ZodTypeAny = z.string()
            for (const rule of field.validation ?? []) {
                if (rule === 'required') continue
                if (rule.rule === 'minLength') s = (s as z.ZodString).min(rule.value, rule.message)
                if (rule.rule === 'maxLength') s = (s as z.ZodString).max(rule.value, rule.message)
            }
            shape[field.name] = s
        }
        return z.object(shape)
    }, [config])

    return { defaults, fields, schema }
}
