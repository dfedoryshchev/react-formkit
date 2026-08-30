import { useMemo, useSyncExternalStore } from 'react'
import { ZodSchema } from 'zod'
import { useValidationSchema } from './ValidationSchemaContext'
import { unwrapField, unwrapObject } from './schema.utils'
import { AsyncCheckChannel, getAsyncCheckChannel } from './validators/async.validators'

// `asyncCheck` usually is the field schema, but `.optional()` and a further
// `.refine()` wrap it, so walk down to the first node that owns a channel.
const findChannel = (
    schema: ZodSchema | undefined,
    fieldName: string,
): AsyncCheckChannel | undefined => {
    const object = schema && unwrapObject(schema)
    if (!object) return undefined

    let current: unknown = object.shape[fieldName]
    while (current) {
        const channel = getAsyncCheckChannel(current)
        if (channel) return channel
        current = unwrapField(current)
    }
    return undefined
}

// Stable no-op store for a field with no remote check, so the hook obeys the
// rules of hooks without branching on whether it found one.
const neverChanges = () => () => {}
const notPending = () => false

/**
 * Whether the named field is waiting on its remote check right now: true from
 * the keystroke that arms the debounce window until the verdict lands.
 *
 * React Hook Form's own per-field `isValidating` answers a different question
 * under a resolver. The resolver parses the whole schema, so RHF marks the
 * field whose event started the parse - not the fields that are actually
 * waiting on a request - and on submit it marks every mounted field, remote
 * check or not. The wait is known inside the validator closure, so that is
 * where this reads it from.
 *
 * The field is found through `ValidationSchemaContext`, which means this works
 * anywhere inside a `Form` or `BasicForm` and returns false everywhere else.
 */
export const useIsAsyncValidating = (fieldName: string): boolean => {
    const schema = useValidationSchema()
    const channel = useMemo(() => findChannel(schema, fieldName), [schema, fieldName])

    return useSyncExternalStore(
        channel?.subscribe ?? neverChanges,
        channel?.isPending ?? notPending,
        notPending,
    )
}
