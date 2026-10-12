import {
    z,
    ZodArray,
    ZodCatch,
    ZodDefault,
    ZodDiscriminatedUnion,
    ZodNullable,
    ZodObject,
    ZodOptional,
    ZodPipe,
    ZodReadonly,
    ZodRecord,
    ZodTuple,
    ZodType,
} from 'zod'
import { getMessages } from '../messages'

// A remote check: resolves true when the value is acceptable. The canonical
// case is "is this username still free?".
export type AsyncCheckFn<T = any> = (value: T) => boolean | Promise<boolean>

export interface AsyncCheckOptions {
    // Quiet period, in ms, between the last change and the request.
    delay?: number
    // Shown when the check rejects the value; defaults to the message map.
    message?: string
}

// What a field needs besides the verdict: whether it is waiting for one right
// now, so a consumer can put a spinner next to it.
export interface AsyncCheckChannel {
    // True from the moment a parse arms the debounce window until the verdict
    // for the value that window ended on has landed.
    isPending: () => boolean
    // Called on every change of `isPending`. Returns an unsubscribe.
    subscribe: (listener: () => void) => () => void
}

interface AsyncCheckTag {
    message: string
    channel: (path: string) => AsyncCheckChannel
    // False only when the check rejected the value.
    verdict: (path: string, value: unknown) => boolean | Promise<boolean>
}

// Keyed off the schema `asyncCheck` returns, so the handle is the one the form
// already publishes on `ValidationSchemaContext` and nothing has to be
// registered or torn down. The validator instance is only half the address: the
// same instance can sit on two fields, so every lookup takes the field path too.
const tags = new WeakMap<object, AsyncCheckTag>()

// A `withAsyncChecks` wrapper and the schema it runs the checks of, both ways.
const rootOf = new WeakMap<object, ZodType>()
const wrapperOf = new WeakMap<object, ZodType>()

// `.refine()`, `.describe()` and the other check-adding methods return a clone
// rather than a wrapper, and the clone keeps the schema it came from as
// `_zod.parent`. The tag and the wrapper mark are found by walking that chain.
const findUp = <T>(schema: unknown, pick: (node: object) => T | undefined): T | undefined => {
    let current: unknown = schema
    while (typeof current === 'object' && current !== null) {
        const found = pick(current)
        if (found !== undefined) return found
        current = (current as { _zod?: { parent?: unknown } })._zod?.parent
    }
    return undefined
}

const tagOf = (schema: unknown): AsyncCheckTag | undefined =>
    findUp(schema, (node) => tags.get(node))

const isWrapped = (schema: unknown): boolean =>
    findUp(schema, (node) => (rootOf.has(node) ? true : undefined)) ?? false

/**
 * The pending channel of an `asyncCheck` schema for one field, or `undefined`
 * for anything else. `path` is the name react-hook-form uses for the field
 * (`username`, `contacts.0.email`); the default addresses a schema being parsed
 * on its own rather than as a member of an object. In a component, prefer
 * `useIsAsyncValidating`, which finds the field's schema and subscribes for you.
 */
export const getAsyncCheckChannel = (schema: unknown, path = ''): AsyncCheckChannel | undefined =>
    tagOf(schema)?.channel(path)

const DEFAULT_DELAY = 300

// Nothing to ask a server about, and the base schema already has its own
// opinion about these.
const isBlank = (value: unknown): boolean => value === undefined || value === null || value === ''

interface Deferred {
    promise: Promise<boolean>
    resolve: (ok: boolean) => void
}

const createDeferred = (): Deferred => {
    let resolve!: (ok: boolean) => void
    const promise = new Promise<boolean>((res) => {
        resolve = res
    })
    return { promise, resolve }
}

interface FieldState {
    timer: ReturnType<typeof setTimeout> | undefined
    // One deferred is shared by every parse waiting on the current window, so
    // they all receive the verdict for the value that window ends on. That is
    // what makes the order they complete in stop mattering: an old parse can no
    // longer answer for a value the field has already left.
    waiting: Deferred | null
    latest: unknown
    round: number
    settled: { value: unknown; ok: boolean } | undefined
    listeners: Set<() => void>
    isPending: boolean
    channel: AsyncCheckChannel
}

/**
 * Marks a field schema for a debounced asynchronous check, which
 * `withAsyncChecks` runs from the root of the schema the field sits in. The
 * check never sees a value the field's own schema rejects.
 *
 * `zodResolver` is built with no `mode` option (see `useFormConfig`), and that
 * default path calls `parseAsync`, so an async check already resolves end to
 * end - nothing about the resolver setup has to change for this.
 *
 * The debounce state lives in this closure rather than in React, because
 * validator factories run while the schema is built, outside rendering, and
 * there is no hook to reach from there. It is kept per FIELD PATH rather than
 * per call: one validator hoisted to module scope is the shape every doc here
 * recommends, and the same instance then lands on every field that reuses it -
 * two addresses on one form, or one row of a field array per index. Keep the
 * schema stable (module scope, or the builder that `BasicForm` memoises) or
 * every render hands the field a fresh channel that has never seen a keystroke.
 */
export const asyncCheck = <T extends ZodType>(
    base: T,
    check: AsyncCheckFn<z.output<T>>,
    options: AsyncCheckOptions = {},
): T => {
    const { delay = DEFAULT_DELAY, message = getMessages().asyncCheck } = options

    const fields = new Map<string, FieldState>()

    const stateFor = (path: string): FieldState => {
        const found = fields.get(path)
        if (found) return found

        const state: FieldState = {
            timer: undefined,
            waiting: null,
            latest: undefined,
            round: 0,
            settled: undefined,
            listeners: new Set(),
            isPending: false,
            // The wait, published. It tracks the deferred rather than the
            // request: a keystroke that re-arms the window keeps one
            // uninterrupted wait, which is what a debounced field should show,
            // and the cached and blank paths never start one because they never
            // make the field wait.
            channel: {
                isPending: () => state.isPending,
                subscribe: (listener) => {
                    state.listeners.add(listener)
                    return () => {
                        state.listeners.delete(listener)
                    }
                },
            },
        }
        fields.set(path, state)
        return state
    }

    const setIsPending = (state: FieldState, next: boolean): void => {
        if (next === state.isPending) return
        state.isPending = next
        for (const listener of state.listeners) listener()
    }

    // `ok === undefined` means the check failed rather than returned a verdict.
    const finish = (state: FieldState, mine: number, value: unknown, ok?: boolean): void => {
        // A newer check has launched, or a newer window is still counting down.
        // Either way that round owns the answer; dropping this one is what
        // stops a late result about an abandoned value from clearing or
        // inventing an error on the value now in the field.
        if (mine !== state.round || state.timer !== undefined) return
        if (ok !== undefined) state.settled = { value, ok }
        const pending = state.waiting
        state.waiting = null
        setIsPending(state, false)
        // Fail open: a transport failure is not a verdict, and the server is
        // the authority at submit anyway. Nothing is cached, so the next parse
        // asks again.
        pending?.resolve(ok ?? true)
    }

    // The field was emptied while a window was counting down. The request is
    // pointless now, but the parse that opened the window is still holding the
    // deferred: cancelling without releasing it would leave that `parseAsync`
    // unsettled forever. Release it as acceptable - the base schema owns the
    // empty case.
    const cancel = (state: FieldState): void => {
        if (state.timer !== undefined) {
            clearTimeout(state.timer)
            state.timer = undefined
        }
        const pending = state.waiting
        state.waiting = null
        setIsPending(state, false)
        pending?.resolve(true)
    }

    const run = (state: FieldState): void => {
        state.timer = undefined
        const value = state.latest
        const mine = (state.round += 1)
        if (state.settled && Object.is(state.settled.value, value)) {
            finish(state, mine, value, state.settled.ok)
            return
        }
        Promise.resolve(check(value as z.output<T>)).then(
            (ok) => finish(state, mine, value, ok),
            () => finish(state, mine, value, undefined),
        )
    }

    const ask = (state: FieldState, value: unknown): Promise<boolean> => {
        // Submit re-parses the whole form. Without this the field would sit out
        // another quiet period, and a second request, for a value already
        // answered.
        if (!state.waiting && state.settled && Object.is(state.settled.value, value)) {
            return Promise.resolve(state.settled.ok)
        }
        // The parse that reaches this field is the parse of the whole schema,
        // so a change to any other field asks about this one too, with a value
        // it never left. Re-arming on that would push the quiet period out for
        // as long as the neighbour is being typed into, and would strand the
        // request already in flight for the same value behind the timer guard
        // in `finish`, buying a duplicate request and an indicator that cannot
        // clear. Only a change to this value is a reason to start over.
        if (state.waiting && Object.is(state.latest, value)) return state.waiting.promise
        state.latest = value
        if (!state.waiting) state.waiting = createDeferred()
        const pending = state.waiting
        if (state.timer !== undefined) clearTimeout(state.timer)
        state.timer = setTimeout(() => run(state), delay)
        setIsPending(state, true)
        return pending.promise
    }

    // A node of its own to carry the tag: tagging `base` itself would also tag
    // every other schema built on that same instance.
    const schema = base.superRefine(() => {})

    tags.set(schema, {
        message,
        channel: (path) => stateFor(path).channel,
        verdict: (path, value) => {
            const decide = (own: z.ZodSafeParseResult<unknown>) => {
                const state = stateFor(path)
                if (!own.success || isBlank(own.data)) {
                    cancel(state)
                    return true
                }
                return ask(state, own.data)
            }
            // Synchronously when the field allows it: a parse that waits a tick
            // longer than needed lets a verdict already in flight settle the
            // window before this newer value can claim it.
            let own: z.ZodSafeParseResult<unknown>
            try {
                own = schema.safeParse(value)
            } catch {
                return schema.safeParseAsync(value).then(decide)
            }
            return decide(own)
        },
    })
    return schema
}

interface FoundCheck {
    tag: AsyncCheckTag
    path: (string | number)[]
    value: unknown
}

type Step = [schema: unknown, value: unknown, segment?: string | number]

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

// Wrappers that hand their inner schemas the value they were given. The walk
// reads the parsed value, so a default has already been filled in.
const sameValueInner = (node: unknown): unknown[] | undefined => {
    if (node instanceof ZodReadonly || node instanceof ZodCatch || node instanceof ZodDefault) {
        return [node.unwrap()]
    }
    if (node instanceof ZodPipe) return [node.in, node.out]
    return undefined
}

const innerSchemas = (node: unknown): unknown[] => {
    const same = sameValueInner(node)
    if (same) return same
    if (node instanceof ZodOptional || node instanceof ZodNullable) return [node.unwrap()]
    if (node instanceof ZodObject) return Object.values(node.shape)
    if (node instanceof ZodArray) return [node.element]
    if (node instanceof ZodTuple) return [...node._zod.def.items, node._zod.def.rest]
    if (node instanceof ZodRecord) return [node.valueType]
    if (node instanceof ZodDiscriminatedUnion) return [...node.options]
    return []
}

const steps = (node: unknown, value: unknown): Step[] => {
    const same = sameValueInner(node)
    if (same) return same.map((inner) => [inner, value])
    if (node instanceof ZodOptional) return value === undefined ? [] : [[node.unwrap(), value]]
    if (node instanceof ZodNullable) return value === null ? [] : [[node.unwrap(), value]]
    if (node instanceof ZodObject) {
        if (!isRecord(value)) return []
        return Object.entries(node.shape as Record<string, unknown>).map(([key, field]) => [
            field,
            value[key],
            key,
        ])
    }
    if (node instanceof ZodArray) {
        return Array.isArray(value) ? value.map((item, index) => [node.element, item, index]) : []
    }
    if (node instanceof ZodTuple) {
        if (!Array.isArray(value)) return []
        const { items, rest } = node._zod.def
        return value.map((item, index) => [items[index] ?? rest, item, index])
    }
    if (node instanceof ZodRecord) {
        if (!isRecord(value)) return []
        return Object.entries(value).map(([key, item]) => [node.valueType, item, key])
    }
    if (node instanceof ZodDiscriminatedUnion) {
        if (!isRecord(value)) return []
        const key = node._zod.def.discriminator
        const option = node.options.find((candidate) =>
            candidate._zod.propValues?.[key]?.has(value[key] as never),
        )
        return option ? [[option, value]] : []
    }
    return []
}

const reachesCheck = (node: unknown, seen: Set<unknown>): boolean => {
    if (typeof node !== 'object' || node === null || seen.has(node)) return false
    seen.add(node)
    if (isWrapped(node)) return false
    if (tagOf(node)) return true
    return innerSchemas(node).some((inner) => reachesCheck(inner, seen))
}

const collect = (
    node: unknown,
    value: unknown,
    path: (string | number)[],
    found: FoundCheck[],
): void => {
    if (typeof node !== 'object' || node === null) return
    // A nested wrapper runs its own checks.
    if (isWrapped(node)) return
    const tag = tagOf(node)
    if (tag) {
        found.push({ tag, path, value })
        return
    }
    for (const [inner, innerValue, segment] of steps(node, value)) {
        collect(inner, innerValue, segment === undefined ? path : [...path, segment], found)
    }
}

const runChecks = (
    root: ZodType,
    value: unknown,
    ctx: z.RefinementCtx,
): Promise<void> | undefined => {
    const found: FoundCheck[] = []
    collect(root, value, [], found)
    if (!found.length) return undefined

    return Promise.all(
        found.map((check) => check.tag.verdict(check.path.join('.'), check.value)),
    ).then((verdicts) => {
        verdicts.forEach((ok, index) => {
            if (ok) return
            const { tag, path } = found[index]
            ctx.addIssue({ code: 'custom', message: tag.message, path })
        })
    })
}

/**
 * Runs every `asyncCheck` inside `schema` from the top, each one under the path
 * of the field it sits on (`username`, `contacts.0.email`), so one hoisted
 * validator on several fields or field-array rows keeps a wait per field.
 *
 * `Form` and `BasicForm` apply this themselves. A schema parsed anywhere else
 * needs it, or its async checks never run. Applying it more than once is
 * harmless, and a schema with no `asyncCheck` in it comes back unchanged.
 */
export const withAsyncChecks = <T extends ZodType>(schema: T): T => {
    if (isWrapped(schema) || !reachesCheck(schema, new Set())) return schema
    const existing = wrapperOf.get(schema)
    if (existing) return existing as T

    // A refinement is skipped once anything beneath it has a type error, which
    // would silence every remote check on the form while one unrelated field
    // holds the wrong type; `when` runs it regardless. A preprocess cannot
    // stand in: an issue raised on the input side of a pipe skips the schema
    // behind it, hiding every other field's error while a check rejects.
    const wrapper = schema.superRefine((value, ctx) => runChecks(schema, value, ctx), {
        when: () => true,
    })
    rootOf.set(wrapper, schema)
    wrapperOf.set(schema, wrapper)
    return wrapper
}
