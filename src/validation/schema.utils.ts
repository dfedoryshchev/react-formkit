import { ZodDefault, ZodEffects, ZodNullable, ZodObject, ZodOptional, ZodSchema } from 'zod'

// A schema carrying refinements (any form with conditional fields does) arrives
// wrapped in ZodEffects, which hides the object shape. Peel the wrappers off
// before looking for the field, or every field on such a form reads optional.
export const unwrapObject = (schema: ZodSchema): ZodObject<any> | null => {
    let current: ZodSchema = schema
    while (current instanceof ZodEffects) {
        current = current.innerType()
    }
    return current instanceof ZodObject ? current : null
}

// One layer off a field schema, or `undefined` when there is nothing left to
// peel. The wrappers keep their inner schema behind different method names, so
// walking a field means asking each of them in turn.
export const unwrapField = (schema: unknown): unknown => {
    if (schema instanceof ZodEffects) return schema.innerType()
    if (schema instanceof ZodOptional || schema instanceof ZodNullable) return schema.unwrap()
    if (schema instanceof ZodDefault) return schema.removeDefault()
    return undefined
}
