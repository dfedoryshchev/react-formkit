import { useMemo } from 'react'
import { ZodString, ZodOptional, ZodNullable, ZodPipe } from 'zod'
import { useValidationSchema } from './ValidationSchemaContext'
import { fieldAt, pipeSource } from './schema.utils'

const isSchemaRequired = (schema: unknown): boolean => {
    if (schema instanceof ZodOptional || schema instanceof ZodNullable) {
        return false
    }
    if (schema instanceof ZodPipe) {
        return isSchemaRequired(pipeSource(schema))
    }
    if (schema instanceof ZodString) {
        // check if it has .describe('required')
        if (schema.description === 'required') return true
        // check for min(1) which implies required
        return (schema.minLength ?? 0) >= 1
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

        return isSchemaRequired(fieldSchema)
    }, [schema, fieldName])
}
