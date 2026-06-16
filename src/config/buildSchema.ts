import { z, ZodTypeAny } from 'zod'
import type { FieldConfig, FormConfig, ValidationDescriptor } from './config.types'

const baseFor = (field: FieldConfig): ZodTypeAny => {
    switch (field.type) {
        case 'numeric':
            return z.coerce.number()
        case 'checkbox':
        case 'switch':
            return z.boolean()
        default:
            return z.string()
    }
}

// Array-valued field types are not modelled yet (see the FieldConfig TODO in
// config.types); leave their schema untouched until composite/array support lands.
const isArrayField = (type: FieldConfig['type']): boolean =>
    type === 'checkbox-group' || type === 'multiselect' || type === 'multi-autocomplete'

const applyRule = (schema: ZodTypeAny, rule: ValidationDescriptor): ZodTypeAny => {
    // `required` is handled separately in buildSchema; skip it here.
    if (rule === 'required') return schema
    switch (rule.rule) {
        case 'minLength':
            return (schema as z.ZodString).min(rule.value, rule.message)
        case 'maxLength':
            return (schema as z.ZodString).max(rule.value, rule.message)
        case 'email':
            return (schema as z.ZodString).email(rule.message)
        case 'min':
            return (schema as z.ZodNumber).min(rule.value, rule.message)
        case 'max':
            return (schema as z.ZodNumber).max(rule.value, rule.message)
        case 'pattern':
            return (schema as z.ZodString).regex(rule.value, rule.message)
        default:
            return schema
    }
}

// A required string must be non-empty; for non-string scalars, being required
// simply means not optional (their empty value already fails the base schema).
const enforceRequired = (schema: ZodTypeAny): ZodTypeAny =>
    schema instanceof z.ZodString ? schema.min(1, 'Required') : schema

export function buildSchema(config: FormConfig): z.ZodObject<any> {
    const shape: Record<string, ZodTypeAny> = {}
    for (const field of config) {
        let s = baseFor(field)
        const rules = field.validation ?? []
        for (const rule of rules) {
            s = applyRule(s, rule)
        }
        if (isArrayField(field.type)) {
            shape[field.name] = s
            continue
        }
        // Enforce required vs optional: required fields must carry a value
        // (strings non-empty), while non-required fields accept their empty
        // value (undefined / null) instead of silently failing validation.
        shape[field.name] = rules.includes('required') ? enforceRequired(s) : s.nullish()
    }
    return z.object(shape)
}
