import {
    ZodArray,
    ZodDefault,
    ZodNullable,
    ZodObject,
    ZodOptional,
    ZodPipe,
    ZodTransform,
    ZodType,
} from 'zod'

// The side of a pipe the field's value is checked against first: the schema
// itself under a preprocess, the source schema under a transform.
export const pipeSource = (pipe: ZodPipe): unknown =>
    pipe.in instanceof ZodTransform ? pipe.out : pipe.in

// One layer off a field schema, or `undefined` when there is nothing left to
// peel. The wrappers keep their inner schema behind different method names, so
// walking a field means asking each of them in turn.
export const unwrapField = (schema: unknown): unknown => {
    if (schema instanceof ZodPipe) return pipeSource(schema)
    if (schema instanceof ZodOptional || schema instanceof ZodNullable) return schema.unwrap()
    if (schema instanceof ZodDefault) return schema.unwrap()
    return undefined
}

// Every layer off, for when the wrappers are in the way of the shape rather
// than being the answer.
const unwrapAll = (schema: unknown): unknown => {
    let current = schema
    for (;;) {
        const inner = unwrapField(current)
        if (inner === undefined) return current
        current = inner
    }
}

// The schema for one field, found by the name react-hook-form uses for it -
// `email`, `address.street`, `contacts.0.email`. Returns undefined when the
// path leaves the schema, which is the same answer as a field that is not in it.
//
// Two things this deliberately does. It unwraps each CONTAINER on the way down,
// so an optional array or a refined object does not stop the walk; and it hands
// back the field it lands on WITHOUT unwrapping it, because whether that field
// is optional is exactly what a caller is usually asking.
//
// An array index is matched as digits and then thrown away. Every element of an
// array shares one schema, so the row number is the form's business - which is
// also why a stale index, the one render after a row is removed, still answers.
export const fieldAt = (schema: ZodType, path: string): unknown => {
    let current: unknown = schema
    for (const segment of path.split('.')) {
        const container = unwrapAll(current)
        if (container instanceof ZodObject) {
            current = (container.shape as Record<string, unknown>)[segment]
        } else if (container instanceof ZodArray) {
            if (!/^\d+$/.test(segment)) return undefined
            current = container.element
        } else {
            return undefined
        }
        if (current === undefined) return undefined
    }
    return current
}
