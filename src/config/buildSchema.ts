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

const applyRule = (schema: ZodTypeAny, rule: ValidationDescriptor): ZodTypeAny => {
    // `required` is a no-op beyond zod's defaults; required/optional
    // across types, async and cross-field rules are not handled here.
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

export function buildSchema(config: FormConfig): z.ZodObject<any> {
    const shape: Record<string, ZodTypeAny> = {}
    for (const field of config) {
        let s = baseFor(field)
        for (const rule of field.validation ?? []) {
            s = applyRule(s, rule)
        }
        // non-required fields are not made .optional(), so empty values
        // can slip through for fields without a 'required' descriptor.
        shape[field.name] = s
    }
    return z.object(shape)
}
