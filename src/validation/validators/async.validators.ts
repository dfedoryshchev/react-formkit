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

// The channel belongs to the validator instance, not to a field name: the
// factory has no idea what the field ends up being called, and two forms may
// both have a `username`. Keying it off the schema `asyncCheck` returns means
// the handle is the one the form already publishes on
// `ValidationSchemaContext`, and nothing has to be registered or torn down.
const channels = new WeakMap<object, AsyncCheckChannel>()

/**
 * The pending channel of an `asyncCheck` schema, or `undefined` for anything
 * else. In a component, prefer `useIsAsyncValidating`, which finds the field's
 * schema and subscribes for you.
 *
 * Zod methods that clone rather than wrap - `.describe()` among them - produce
 * a new instance the channel is not attached to, so apply them to the base
 * schema and keep `asyncCheck` outermost.
 */
export const getAsyncCheckChannel = (schema: unknown): AsyncCheckChannel | undefined =>
    typeof schema === 'object' && schema !== null ? channels.get(schema) : undefined

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

/**
 * Wraps a schema in a debounced asynchronous check.
 *
 * `zodResolver` is built with no `mode` option (see `useFormConfig`), and that
 * default path calls `parseAsync`, so an async refinement already resolves end
 * to end - nothing about the resolver setup has to change for this.
 *
 * The debounce state lives in this closure rather than in React, because
 * validator factories run while the schema is built, outside rendering, and
 * there is no hook to reach from there. One `asyncCheck` call is therefore one
 * debounce channel: keep the schema stable (module scope, or the builder that
 * `BasicForm` memoises) or every render hands the field a fresh channel that
 * has never seen a keystroke.
 */
export const asyncCheck = <T extends ZodTypeAny>(
    base: T,
    check: AsyncCheckFn<T['_output']>,
    options: AsyncCheckOptions = {},
): ZodEffects<T, T['_output'], T['_input']> => {
    const { delay = DEFAULT_DELAY, message = getMessages().asyncCheck } = options

    let timer: ReturnType<typeof setTimeout> | undefined
    // One deferred is shared by every parse waiting on the current window, so
    // they all receive the verdict for the value that window ends on. That is
    // what makes the order they complete in stop mattering: an old parse can no
    // longer answer for a value the field has already left.
    let waiting: Deferred | null = null
    let latest: unknown
    let round = 0
    let settled: { value: unknown; ok: boolean } | undefined

    // The wait, published. It tracks the deferred rather than the request: a
    // keystroke that re-arms the window keeps one uninterrupted wait, which is
    // what a debounced field should show, and the cached and blank paths never
    // start one because they never make the field wait.
    const listeners = new Set<() => void>()
    let isPending = false

    const setIsPending = (next: boolean): void => {
        if (next === isPending) return
        isPending = next
        for (const listener of listeners) listener()
    }

    const channel: AsyncCheckChannel = {
        isPending: () => isPending,
        subscribe: (listener) => {
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
            }
        },
    }

    // `ok === undefined` means the check failed rather than returned a verdict.
    const finish = (mine: number, value: unknown, ok?: boolean): void => {
        // A newer check has launched, or a newer window is still counting down.
        // Either way that round owns the answer; dropping this one is what
        // stops a late result about an abandoned value from clearing or
        // inventing an error on the value now in the field.
        if (mine !== round || timer !== undefined) return
        if (ok !== undefined) settled = { value, ok }
        const pending = waiting
        waiting = null
        setIsPending(false)
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
    const cancel = (): void => {
        if (timer !== undefined) {
            clearTimeout(timer)
            timer = undefined
        }
        const pending = waiting
        waiting = null
        setIsPending(false)
        pending?.resolve(true)
    }

    const run = (): void => {
        timer = undefined
        const value = latest
        const mine = (round += 1)
        if (settled && Object.is(settled.value, value)) {
            finish(mine, value, settled.ok)
            return
        }
        Promise.resolve(check(value)).then(
            (ok) => finish(mine, value, ok),
            () => finish(mine, value, undefined),
        )
    }

    const ask = (value: unknown): Promise<boolean> => {
        // Submit re-parses the whole form. Without this the field would sit out
        // another quiet period, and a second request, for a value already
        // answered.
        if (!waiting && settled && Object.is(settled.value, value)) {
            return Promise.resolve(settled.ok)
        }
        latest = value
        if (!waiting) waiting = createDeferred()
        const pending = waiting
        if (timer !== undefined) clearTimeout(timer)
        timer = setTimeout(run, delay)
        setIsPending(true)
        return pending.promise
    }

    const schema = base.superRefine(async (value, ctx) => {
        // A failed string check leaves zod's status dirty, not aborted, so the
        // refinement still runs for an empty field; without this every untouched
        // required field would fire a request.
        if (isBlank(value)) {
            cancel()
            return
        }
        if (await ask(value)) return
        ctx.addIssue({ code: z.ZodIssueCode.custom, message })
    })

    channels.set(schema, channel)
    return schema
}
