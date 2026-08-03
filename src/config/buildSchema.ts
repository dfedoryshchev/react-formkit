import { z, ZodTypeAny } from 'zod'
import { matchesCondition } from '@/field'
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

// A field carrying `showWhen` is validated only while its condition holds. Its
// key in the object stays lenient and the real schema runs in the refinement
// below, because a required field inside a hidden branch would otherwise fail
// submit with an error the user cannot see or reach.
interface ConditionalEntry {
    field: FieldConfig
    schema: ZodTypeAny
}

export function buildSchema(config: FormConfig): ZodTypeAny {
    const shape: Record<string, ZodTypeAny> = {}
    const conditional: ConditionalEntry[] = []

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
        const enforced = rules.includes('required') ? enforceRequired(s) : s.nullish()

        if (field.showWhen) {
            // Lenient key = the bare base type, not `enforced` and not `s`:
            // rules like minLength would otherwise still reject the leftover
            // value of a hidden field.
            shape[field.name] = baseFor(field).nullish()
            conditional.push({ field, schema: enforced })
            continue
        }
        shape[field.name] = enforced
    }

    const object = z.object(shape)
    if (conditional.length === 0) return object

    return object.superRefine((values, ctx) => {
        for (const { field, schema } of conditional) {
            const condition = field.showWhen as NonNullable<FieldConfig['showWhen']>
            const watched = (values as Record<string, unknown>)[condition.field]
            if (!matchesCondition(watched, condition)) continue

            const result = schema.safeParse((values as Record<string, unknown>)[field.name])
            if (result.success) continue
            for (const issue of result.error.issues) {
                // Re-anchor onto the field's own path so the message lands on
                // the input rather than at the form root.
                ctx.addIssue({ ...issue, path: [field.name, ...issue.path] })
            }
        }
    })
}
