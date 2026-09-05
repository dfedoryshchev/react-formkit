import { useMemo } from 'react'
import { ZodString, ZodEffects, ZodOptional, ZodNullable, ZodSchema } from 'zod'
import { useValidationSchema } from './ValidationSchemaContext'
import { fieldAt } from './schema.utils'

const isSchemaRequired = (schema: ZodSchema): boolean => {
    if (schema instanceof ZodOptional || schema instanceof ZodNullable) {
        return false
    }
    if (schema instanceof ZodEffects) {
        return isSchemaRequired(schema.innerType())
    }
    if (schema instanceof ZodString) {
        // check if it has .describe('required')
        if (schema.description === 'required') return true
        // check for min(1) which implies required
        const checks = (schema as any)._def?.checks || []
        return checks.some((c: any) => c.kind === 'min' && c.value >= 1)
    }
    return true
}

export const useIsFieldRequired = (fieldName: string): boolean => {
    const schema = useValidationSchema()

    return useMemo(() => {
        if (!schema) return false

        // A field inside an array is named by its path (`contacts.0.email`),
        // so the lookup walks one. It used to be a flat `shape[fieldName]`,
        // which meant every field in a field array read as not-required no
        // matter what the element schema said.
        const fieldSchema = fieldAt(schema, fieldName)
        if (!fieldSchema) return false

        return isSchemaRequired(fieldSchema as ZodSchema)
    }, [schema, fieldName])
}
