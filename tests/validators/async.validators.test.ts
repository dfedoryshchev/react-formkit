import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'
import { asyncCheck } from '../../src/validation/validators/async.validators'
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
