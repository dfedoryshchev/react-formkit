import { z, ZodEffects, ZodTypeAny } from 'zod'
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

// Keyed off the schema `asyncCheck` returns, so the handle is the one the form
// already publishes on `ValidationSchemaContext` and nothing has to be
// registered or torn down. The validator instance is only half the address: the
// same instance can sit on two fields, so the lookup takes the field path too.
const channels = new WeakMap<object, (path: string) => AsyncCheckChannel>()

/**
 * The pending channel of an `asyncCheck` schema for one field, or `undefined`
 * for anything else. `path` is the name react-hook-form uses for the field
 * (`username`, `contacts.0.email`); the default addresses a schema being parsed
 * on its own rather than as a member of an object. In a component, prefer
 * `useIsAsyncValidating`, which finds the field's schema and subscribes for you.
 *
 * Zod methods that clone rather than wrap - `.describe()` among them - produce
 * a new instance the channel is not attached to, so apply them to the base
 * schema and keep `asyncCheck` outermost.
 */
export const getAsyncCheckChannel = (schema: unknown, path = ''): AsyncCheckChannel | undefined =>
    typeof schema === 'object' && schema !== null ? channels.get(schema)?.(path) : undefined

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
 * Wraps a schema in a debounced asynchronous check.
 *
 * `zodResolver` is built with no `mode` option (see `useFormConfig`), and that
 * default path calls `parseAsync`, so an async refinement already resolves end
 * to end - nothing about the resolver setup has to change for this.
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
export const asyncCheck = <T extends ZodTypeAny>(
    base: T,
    check: AsyncCheckFn<T['_output']>,
    options: AsyncCheckOptions = {},
): ZodEffects<T, T['_output'], T['_input']> => {
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
        Promise.resolve(check(value)).then(
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

    const schema = base.superRefine(async (value, ctx) => {
        const state = stateFor(ctx.path.join('.'))
        // A failed string check leaves zod's status dirty, not aborted, so the
        // refinement still runs for an empty field; without this every untouched
        // required field would fire a request.
        if (isBlank(value)) {
            cancel(state)
            return
        }
        if (await ask(state, value)) return
        ctx.addIssue({ code: z.ZodIssueCode.custom, message })
    })

    channels.set(schema, (path) => stateFor(path).channel)
    return schema
}
