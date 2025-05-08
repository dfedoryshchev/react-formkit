import { useMemo } from 'react'
import { ZodObject, ZodString, ZodEffects, ZodOptional, ZodNullable, ZodSchema } from 'zod'
import { useValidationSchema } from './ValidationSchemaContext'

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
        if (!(schema instanceof ZodObject)) return false

        const shape = schema.shape
        const fieldSchema = shape[fieldName]
        if (!fieldSchema) return false

        return isSchemaRequired(fieldSchema)
    }, [schema, fieldName])
}
