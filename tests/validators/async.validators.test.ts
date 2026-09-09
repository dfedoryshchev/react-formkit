import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'
import { asyncCheck, getAsyncCheckChannel } from '../../src/validation/validators/async.validators'
import { required } from '../../src/validation/validators/common.validators'
import { setMessages } from '../../src/validation/messages'

const deferred = <T>() => {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

const firstError = (result: z.SafeParseReturnType<unknown, unknown>) =>
    result.success ? undefined : result.error.issues[0].message

const issuePaths = (result: z.SafeParseReturnType<unknown, unknown>) =>
    result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))

beforeEach(() => {
    vi.useFakeTimers()
})

afterEach(() => {
    vi.useRealTimers()
    setMessages()
})

describe('asyncCheck', () => {
    it('passes the value through when the check accepts it', async () => {
        const check = vi.fn().mockResolvedValue(true)
        const schema = asyncCheck(z.string(), check, { delay: 50 })

        const result = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(60)

        const settled = await result
        expect(settled.success).toBe(true)
        expect(check).toHaveBeenCalledWith('ada')
    })

    it('reports the message-map default when the check rejects the value', async () => {
        const schema = asyncCheck(z.string(), () => Promise.resolve(false), { delay: 50 })

        const result = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(60)

        expect(firstError(await result)).toBe('This value is not available')
    })

    it('prefers an explicit message over the map', async () => {
        const schema = asyncCheck(z.string(), () => Promise.resolve(false), {
            delay: 50,
            message: 'That username is taken',
        })

        const result = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(60)

        expect(firstError(await result)).toBe('That username is taken')
    })

    it('reads the map at build time, like every other validator', async () => {
        setMessages({ asyncCheck: 'Deja pris' })
        const schema = asyncCheck(z.string(), () => Promise.resolve(false), { delay: 50 })

        const result = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(60)

        expect(firstError(await result)).toBe('Deja pris')
    })
})

// A failed string check leaves zod's status dirty rather than aborted, so the
// refinement still runs for an empty field. Without the guard every empty
// required field would fire a request on mount.
describe('asyncCheck - values it must not spend a request on', () => {
    it('skips an empty string and leaves the base error alone', async () => {
        const check = vi.fn().mockResolvedValue(true)
        const schema = asyncCheck(required(), check, { delay: 50 })

        expect(firstError(await schema.safeParseAsync(''))).toBe('This field is required')
        expect(check).not.toHaveBeenCalled()
    })

    it('cancels a window already counting down when the field is emptied', async () => {
        const check = vi.fn().mockResolvedValue(true)
        const schema = asyncCheck(required(), check, { delay: 50 })

        const typed = schema.safeParseAsync('a')
        const cleared = schema.safeParseAsync('')
        await vi.advanceTimersByTimeAsync(60)

        // The parse that opened the window has to settle, not hang on a window
        // that will never fire.
        expect((await typed).success).toBe(true)
        expect(firstError(await cleared)).toBe('This field is required')
        expect(check).not.toHaveBeenCalled()
    })

    it('skips a nullish value', async () => {
        const check = vi.fn().mockResolvedValue(true)
        const schema = asyncCheck(z.string().nullish(), check, { delay: 50 })

        expect((await schema.safeParseAsync(null)).success).toBe(true)
        expect((await schema.safeParseAsync(undefined)).success).toBe(true)
        expect(check).not.toHaveBeenCalled()
    })
})

describe('asyncCheck - debounce', () => {
    it('collapses the parses inside one window into a single check', async () => {
        const check = vi.fn().mockResolvedValue(true)
        const schema = asyncCheck(z.string(), check, { delay: 50 })

        const first = schema.safeParseAsync('a')
        const second = schema.safeParseAsync('ab')
        const third = schema.safeParseAsync('abc')
        await vi.advanceTimersByTimeAsync(60)
        await Promise.all([first, second, third])

        expect(check).toHaveBeenCalledTimes(1)
        expect(check).toHaveBeenCalledWith('abc')
    })

    it('starts a new window once the previous one has settled', async () => {
        const check = vi.fn().mockResolvedValue(true)
        const schema = asyncCheck(z.string(), check, { delay: 50 })

        const first = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(60)
        await first

        const second = schema.safeParseAsync('bob')
        await vi.advanceTimersByTimeAsync(60)
        await second

        expect(check).toHaveBeenCalledTimes(2)
    })

    it('answers a repeat parse of the settled value without another check', async () => {
        const check = vi.fn().mockResolvedValue(false)
        const schema = asyncCheck(z.string(), check, { delay: 50, message: 'taken' })

        const typed = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(60)
        expect(firstError(await typed)).toBe('taken')

        // What submit does: re-parse the whole form. It must not wait out
        // another debounce window, so this resolves with no timer advanced.
        expect(firstError(await schema.safeParseAsync('ada'))).toBe('taken')
        expect(check).toHaveBeenCalledTimes(1)
    })

    it('keeps two validator instances on their own debounce channels', async () => {
        const free = vi.fn().mockResolvedValue(true)
        const taken = vi.fn().mockResolvedValue(false)
        const freeSchema = asyncCheck(z.string(), free, { delay: 50 })
        const takenSchema = asyncCheck(z.string(), taken, { delay: 50, message: 'taken' })

        const a = freeSchema.safeParseAsync('x')
        const b = takenSchema.safeParseAsync('x')
        await vi.advanceTimersByTimeAsync(60)

        expect((await a).success).toBe(true)
        expect(firstError(await b)).toBe('taken')
    })
})

// The value can move on while a request is in flight. A verdict about the value
// the user has already left must never decide the value now in the field.
describe('asyncCheck - stale results', () => {
    it('gives a superseded parse the verdict of the value that won the window', async () => {
        const check = vi.fn(async (value: string) => value !== 'bob')
        const schema = asyncCheck(z.string(), check, { delay: 50, message: 'taken' })

        const stale = schema.safeParseAsync('ada')
        const current = schema.safeParseAsync('bob')
        await vi.advanceTimersByTimeAsync(60)

        expect(check).toHaveBeenCalledTimes(1)
        expect(check).toHaveBeenCalledWith('bob')
        expect(firstError(await current)).toBe('taken')
        expect(firstError(await stale)).toBe('taken')
    })

    it('does not let an out-of-order result overwrite the newer verdict', async () => {
        const slow = deferred<boolean>()
        const fast = deferred<boolean>()
        const check = vi.fn((value: string) => (value === 'ada' ? slow.promise : fast.promise))
        const schema = asyncCheck(z.string(), check, { delay: 10, message: 'taken' })

        const stale = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(20)
        expect(check).toHaveBeenCalledWith('ada')

        const current = schema.safeParseAsync('bob')
        await vi.advanceTimersByTimeAsync(20)
        expect(check).toHaveBeenCalledWith('bob')

        // 'bob' is taken, and only then does the request for 'ada' come back
        // saying 'ada' was free. The late answer must not clear bob's error.
        fast.resolve(false)
        await vi.advanceTimersByTimeAsync(0)
        slow.resolve(true)
        await vi.advanceTimersByTimeAsync(0)

        expect(firstError(await current)).toBe('taken')
        expect(firstError(await stale)).toBe('taken')
    })

    it('does not let a result for an abandoned value answer for the current one', async () => {
        const abandoned = deferred<boolean>()
        const current = deferred<boolean>()
        const check = vi.fn((value: string) =>
            value === 'ada' ? abandoned.promise : current.promise,
        )
        const schema = asyncCheck(z.string(), check, { delay: 10, message: 'taken' })

        const stale = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(20)
        const fresh = schema.safeParseAsync('bob')
        await vi.advanceTimersByTimeAsync(20)

        // 'ada' comes back free while 'bob' is still in flight. Nobody is on
        // 'ada' any more, so that answer decides nothing.
        abandoned.resolve(true)
        await vi.advanceTimersByTimeAsync(0)
        current.resolve(false)
        await vi.advanceTimersByTimeAsync(0)

        expect(firstError(await fresh)).toBe('taken')
        expect(firstError(await stale)).toBe('taken')
    })

    it('does not settle a window that is still counting down', async () => {
        const inFlight = deferred<boolean>()
        const check = vi.fn((value: string) =>
            value === 'ada' ? inFlight.promise : Promise.resolve(true),
        )
        const schema = asyncCheck(z.string(), check, { delay: 10, message: 'taken' })

        const stale = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(20)

        // The user types on, arming a fresh window, and only then does the
        // request for 'ada' report it taken. Nothing has been asked about 'bob'
        // yet, so nothing may be decided about it.
        const fresh = schema.safeParseAsync('bob')
        inFlight.resolve(false)
        await vi.advanceTimersByTimeAsync(0)
        await vi.advanceTimersByTimeAsync(20)

        expect((await fresh).success).toBe(true)
        expect((await stale).success).toBe(true)
        expect(check).toHaveBeenCalledWith('bob')
    })

    it('does not cache the stale verdict either', async () => {
        const slow = deferred<boolean>()
        const fast = deferred<boolean>()
        const check = vi.fn((value: string) => (value === 'ada' ? slow.promise : fast.promise))
        const schema = asyncCheck(z.string(), check, { delay: 10, message: 'taken' })

        const stale = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(20)
        const current = schema.safeParseAsync('bob')
        await vi.advanceTimersByTimeAsync(20)

        fast.resolve(false)
        await vi.advanceTimersByTimeAsync(0)
        slow.resolve(true)
        await vi.advanceTimersByTimeAsync(0)
        await Promise.all([stale, current])

        // The settled verdict is still bob's, so a re-parse of 'bob' is free.
        expect(firstError(await schema.safeParseAsync('bob'))).toBe('taken')
        expect(check).toHaveBeenCalledTimes(2)
    })
})

// A resolver parses the whole schema, so a change to any field re-runs this
// refinement too - with a value this field never left. That parse is not a
// keystroke and must not be treated as one.
describe('asyncCheck - a parse that does not change the value', () => {
    it('does not push the quiet period out', async () => {
        const check = vi.fn().mockResolvedValue(true)
        const schema = asyncCheck(z.string(), check, { delay: 50 })

        const typed = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(30)
        const neighbour = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(30)

        // 60ms since the value last changed, and the quiet period is 50.
        expect(check).toHaveBeenCalledTimes(1)
        await Promise.all([typed, neighbour])
    })

    it('does not discard the request already in flight for that value', async () => {
        const answer: Array<(ok: boolean) => void> = []
        const check = vi.fn(() => new Promise<boolean>((resolve) => answer.push(resolve)))
        const schema = asyncCheck(z.string(), check, { delay: 10, message: 'taken' })

        const typed = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(20)
        expect(check).toHaveBeenCalledTimes(1)

        const neighbour = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(20)
        answer[0](false)
        await vi.advanceTimersByTimeAsync(0)

        expect(check).toHaveBeenCalledTimes(1)
        expect(firstError(await typed)).toBe('taken')
        expect(firstError(await neighbour)).toBe('taken')
    })

    it('leaves one wait open, so the answer to it still clears the indicator', async () => {
        const answer: Array<(ok: boolean) => void> = []
        const check = vi.fn(() => new Promise<boolean>((resolve) => answer.push(resolve)))
        const schema = asyncCheck(z.string(), check, { delay: 10 })
        const channel = getAsyncCheckChannel(schema)!

        const typed = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(20)

        // Five keystrokes in a neighbouring field while the request is out.
        for (let i = 0; i < 5; i += 1) {
            void schema.safeParseAsync('ada')
            await vi.advanceTimersByTimeAsync(20)
        }

        // The one request that was made is answered.
        answer[0](true)
        await vi.advanceTimersByTimeAsync(0)

        expect(check).toHaveBeenCalledTimes(1)
        expect(channel.isPending()).toBe(false)
        expect((await typed).success).toBe(true)
    })

    it('still re-arms when the value did change', async () => {
        const check = vi.fn().mockResolvedValue(true)
        const schema = asyncCheck(z.string(), check, { delay: 50 })

        const typed = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(30)
        const retyped = schema.safeParseAsync('bob')
        await vi.advanceTimersByTimeAsync(30)
        expect(check).not.toHaveBeenCalled()

        await vi.advanceTimersByTimeAsync(30)
        expect(check).toHaveBeenCalledTimes(1)
        expect(check).toHaveBeenCalledWith('bob')
        await Promise.all([typed, retyped])
    })
})

// The verdict is not the only thing a field needs from a remote check: it also
// needs to be able to say it is waiting. The wait is owned by the closure, so
// the closure is what publishes it.
describe('asyncCheck - pending channel', () => {
    it('gives no channel for a schema that is not an async check', () => {
        expect(getAsyncCheckChannel(z.string())).toBeUndefined()
        expect(getAsyncCheckChannel(undefined)).toBeUndefined()
    })

    it('is pending from the moment the window is armed until the verdict lands', async () => {
        const gate = deferred<boolean>()
        const schema = asyncCheck(z.string(), () => gate.promise, { delay: 50 })
        const channel = getAsyncCheckChannel(schema)!

        expect(channel.isPending()).toBe(false)

        const result = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(0)
        expect(channel.isPending()).toBe(true)

        // The window has elapsed and the request is out; still waiting.
        await vi.advanceTimersByTimeAsync(60)
        expect(channel.isPending()).toBe(true)

        gate.resolve(true)
        await result
        expect(channel.isPending()).toBe(false)
    })

    it('reports one wait, not two, when a keystroke re-arms the window', async () => {
        const schema = asyncCheck(z.string(), () => Promise.resolve(true), { delay: 50 })
        const channel = getAsyncCheckChannel(schema)!
        const seen: boolean[] = []
        channel.subscribe(() => seen.push(channel.isPending()))

        const first = schema.safeParseAsync('a')
        await vi.advanceTimersByTimeAsync(0)
        const second = schema.safeParseAsync('ab')
        await vi.advanceTimersByTimeAsync(60)
        await Promise.all([first, second])

        // One indicator across the burst is the whole point of the debounce.
        expect(seen).toEqual([true, false])
    })

    it('stops waiting when the field is emptied and the window is cancelled', async () => {
        const check = vi.fn().mockResolvedValue(true)
        const schema = asyncCheck(required(), check, { delay: 50 })
        const channel = getAsyncCheckChannel(schema)!

        const typed = schema.safeParseAsync('a')
        await vi.advanceTimersByTimeAsync(0)
        expect(channel.isPending()).toBe(true)

        const cleared = schema.safeParseAsync('')
        await vi.advanceTimersByTimeAsync(0)
        expect(channel.isPending()).toBe(false)

        await Promise.all([typed, cleared])
        expect(check).not.toHaveBeenCalled()
    })

    it('stops waiting when the check throws', async () => {
        const schema = asyncCheck(z.string(), () => Promise.reject(new Error('network down')), {
            delay: 10,
        })
        const channel = getAsyncCheckChannel(schema)!

        const result = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(20)

        expect((await result).success).toBe(true)
        expect(channel.isPending()).toBe(false)
    })

    it('does not wait at all for a repeat parse answered from the settled verdict', async () => {
        const check = vi.fn().mockResolvedValue(true)
        const schema = asyncCheck(z.string(), check, { delay: 50 })
        const channel = getAsyncCheckChannel(schema)!

        const first = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(60)
        await first

        const seen: boolean[] = []
        channel.subscribe(() => seen.push(channel.isPending()))

        // What submit does. No request, so nothing to wait for.
        await schema.safeParseAsync('ada')
        expect(seen).toEqual([])
        expect(channel.isPending()).toBe(false)
        expect(check).toHaveBeenCalledTimes(1)
    })

    it('stops notifying an unsubscribed listener', async () => {
        const schema = asyncCheck(z.string(), () => Promise.resolve(true), { delay: 50 })
        const channel = getAsyncCheckChannel(schema)!
        const seen: boolean[] = []
        const unsubscribe = channel.subscribe(() => seen.push(channel.isPending()))

        const first = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(60)
        await first
        expect(seen).toEqual([true, false])

        unsubscribe()
        const second = schema.safeParseAsync('bob')
        await vi.advanceTimersByTimeAsync(60)
        await second
        expect(seen).toEqual([true, false])
    })

    it('keeps two validator instances on their own channels', async () => {
        const slow = deferred<boolean>()
        const slowSchema = asyncCheck(z.string(), () => slow.promise, { delay: 50 })
        const fastSchema = asyncCheck(z.string(), () => Promise.resolve(true), { delay: 50 })
        const slowChannel = getAsyncCheckChannel(slowSchema)!
        const fastChannel = getAsyncCheckChannel(fastSchema)!

        const pending = slowSchema.safeParseAsync('ada')
        const settling = fastSchema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(60)
        await settling

        expect(fastChannel.isPending()).toBe(false)
        expect(slowChannel.isPending()).toBe(true)

        slow.resolve(true)
        await pending
        expect(slowChannel.isPending()).toBe(false)
    })
})

// Every public doc tells a consumer to hoist the schema to module scope, so one
// `asyncCheck` instance landing on two fields is the shape the library asks for
// rather than an exotic one.
describe('asyncCheck - one instance on more than one field', () => {
    const twoFields = (check: (value: string) => Promise<boolean>, delay = 50) => {
        const emailCheck = asyncCheck(z.string(), check, { delay, message: 'taken' })
        return { emailCheck, schema: z.object({ primary: emailCheck, backup: emailCheck }) }
    }

    it('asks about every field that shares the instance', async () => {
        const check = vi.fn(async (value: string) => value !== 'taken@x.com')
        const { schema } = twoFields(check)

        const result = schema.safeParseAsync({ primary: 'taken@x.com', backup: 'free@x.com' })
        await vi.advanceTimersByTimeAsync(60)
        await result

        expect(check).toHaveBeenCalledTimes(2)
        expect(check).toHaveBeenCalledWith('taken@x.com')
        expect(check).toHaveBeenCalledWith('free@x.com')
    })

    it('does not let an accepted field carry a rejected one through', async () => {
        const check = vi.fn(async (value: string) => value !== 'taken@x.com')
        const { schema } = twoFields(check)

        const result = schema.safeParseAsync({ primary: 'taken@x.com', backup: 'free@x.com' })
        await vi.advanceTimersByTimeAsync(60)

        expect(issuePaths(await result)).toEqual(['primary'])
    })

    it('rejects both fields when both values are taken', async () => {
        const check = vi.fn(async () => false)
        const { schema } = twoFields(check)

        const result = schema.safeParseAsync({ primary: 'one@x.com', backup: 'two@x.com' })
        await vi.advanceTimersByTimeAsync(60)

        expect(issuePaths(await result)).toEqual(['primary', 'backup'])
    })

    it('caches each field verdict separately, so submit re-parses for free', async () => {
        const check = vi.fn(async (value: string) => value !== 'taken@x.com')
        const { schema } = twoFields(check)

        const first = schema.safeParseAsync({ primary: 'taken@x.com', backup: 'free@x.com' })
        await vi.advanceTimersByTimeAsync(60)
        await first

        const resubmit = await schema.safeParseAsync({
            primary: 'taken@x.com',
            backup: 'free@x.com',
        })

        expect(issuePaths(resubmit)).toEqual(['primary'])
        expect(check).toHaveBeenCalledTimes(2)
    })

    it('waits per field rather than for whichever field parsed last', async () => {
        const gate = deferred<boolean>()
        const check = vi.fn((value: string) =>
            value === 'slow@x.com' ? gate.promise : Promise.resolve(true),
        )
        const { emailCheck, schema } = twoFields(check)
        const primary = getAsyncCheckChannel(emailCheck, 'primary')!
        const backup = getAsyncCheckChannel(emailCheck, 'backup')!

        const result = schema.safeParseAsync({ primary: 'slow@x.com', backup: 'free@x.com' })
        await vi.advanceTimersByTimeAsync(60)

        expect(backup.isPending()).toBe(false)
        expect(primary.isPending()).toBe(true)

        gate.resolve(true)
        await result
        expect(primary.isPending()).toBe(false)
    })

    it('gives every row of a field array its own wait', async () => {
        const gate = deferred<boolean>()
        const check = vi.fn((value: string) =>
            value === 'slow' ? gate.promise : Promise.resolve(true),
        )
        const nameCheck = asyncCheck(z.string(), check, { delay: 50 })
        const schema = z.object({ rows: z.array(z.object({ username: nameCheck })) })
        const first = getAsyncCheckChannel(nameCheck, 'rows.0.username')!
        const second = getAsyncCheckChannel(nameCheck, 'rows.1.username')!

        const result = schema.safeParseAsync({ rows: [{ username: 'slow' }, { username: 'fast' }] })
        await vi.advanceTimersByTimeAsync(60)

        expect(second.isPending()).toBe(false)
        expect(first.isPending()).toBe(true)

        gate.resolve(true)
        await result
        expect(first.isPending()).toBe(false)
    })
})

describe('asyncCheck - failure', () => {
    it('fails open when the check rejects, so a network blip cannot block the form', async () => {
        const check = vi.fn().mockRejectedValue(new Error('network down'))
        const schema = asyncCheck(z.string(), check, { delay: 10, message: 'taken' })

        const result = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(20)

        expect((await result).success).toBe(true)
    })

    it('does not cache a failure, so the next parse asks again', async () => {
        const check = vi
            .fn()
            .mockRejectedValueOnce(new Error('network down'))
            .mockResolvedValueOnce(false)
        const schema = asyncCheck(z.string(), check, { delay: 10, message: 'taken' })

        const first = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(20)
        expect((await first).success).toBe(true)

        const second = schema.safeParseAsync('ada')
        await vi.advanceTimersByTimeAsync(20)
        expect(firstError(await second)).toBe('taken')
        expect(check).toHaveBeenCalledTimes(2)
    })
})
