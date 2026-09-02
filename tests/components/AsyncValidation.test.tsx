// @vitest-environment jsdom
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { useFormContext } from 'react-hook-form'
import { BasicForm } from '../../src/form'
import { FormField } from '../../src/field'
import { asyncCheck } from '../../src/validation/validators/async.validators'
import { required } from '../../src/validation/validators/common.validators'
import { useIsAsyncValidating } from '../../src/validation/useIsAsyncValidating'

const TAKEN = 'That username is taken'

const deferred = <T,>() => {
    let resolve!: (value: T) => void
    const promise = new Promise<T>((res) => {
        resolve = res
    })
    return { promise, resolve }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 40))

const renderForm = (
    check: (value: string) => Promise<boolean>,
    mode: 'onChange' | 'onBlur',
    onSubmit = vi.fn(),
    extra?: React.ReactNode,
) => {
    const schema = z.object({
        username: asyncCheck(required(), check, { delay: 10, message: TAKEN }),
    })
    render(
        <BasicForm
            onSubmit={onSubmit}
            validationSchema={schema}
            defaultValues={{ username: '' }}
            mode={mode}
        >
            <FormField name="username" type="text" label="Username" />
            {extra}
            <button type="submit">Submit</button>
        </BasicForm>,
    )
    return { input: screen.getByRole('textbox'), onSubmit }
}

describe('debounced async validation through the form', () => {
    it('surfaces the async error on change once the window elapses', async () => {
        const { input } = renderForm(async (value) => value !== 'ada', 'onChange')

        fireEvent.change(input, { target: { value: 'ada' } })

        await waitFor(() => expect(screen.getByText(TAKEN)).toBeInTheDocument())
    })

    it('clears the async error once the value becomes available', async () => {
        const { input } = renderForm(async (value) => value !== 'ada', 'onChange')

        fireEvent.change(input, { target: { value: 'ada' } })
        await waitFor(() => expect(screen.getByText(TAKEN)).toBeInTheDocument())

        fireEvent.change(input, { target: { value: 'bob' } })
        await waitFor(() => expect(screen.queryByText(TAKEN)).not.toBeInTheDocument())
    })

    it('runs one check for a burst of keystrokes', async () => {
        const check = vi.fn(async (value: string) => value !== 'ada')
        const { input } = renderForm(check, 'onChange')

        fireEvent.change(input, { target: { value: 'a' } })
        fireEvent.change(input, { target: { value: 'ad' } })
        fireEvent.change(input, { target: { value: 'ada' } })

        await waitFor(() => expect(screen.getByText(TAKEN)).toBeInTheDocument())
        expect(check).toHaveBeenCalledTimes(1)
        expect(check).toHaveBeenCalledWith('ada')
    })

    it('works in onBlur mode too', async () => {
        const { input } = renderForm(async (value) => value !== 'ada', 'onBlur')

        fireEvent.change(input, { target: { value: 'ada' } })
        fireEvent.blur(input)

        await waitFor(() => expect(screen.getByText(TAKEN)).toBeInTheDocument())
    })

    it('does not spend a request on the empty field', async () => {
        const check = vi.fn(async () => true)
        const { input } = renderForm(check, 'onChange')

        fireEvent.change(input, { target: { value: 'a' } })
        fireEvent.change(input, { target: { value: '' } })
        await settle()

        expect(check).not.toHaveBeenCalled()
    })

    it('blocks submit while the value is taken, without a second request', async () => {
        const check = vi.fn(async (value: string) => value !== 'ada')
        const { input, onSubmit } = renderForm(check, 'onChange')

        fireEvent.change(input, { target: { value: 'ada' } })
        await waitFor(() => expect(screen.getByText(TAKEN)).toBeInTheDocument())

        fireEvent.click(screen.getByText('Submit'))
        await settle()

        expect(onSubmit).not.toHaveBeenCalled()
        expect(check).toHaveBeenCalledTimes(1)
    })

    it('keeps the required indicator through the async wrapper', () => {
        const { input } = renderForm(async () => true, 'onChange')
        expect(input).toHaveAttribute('aria-required', 'true')
    })

    // The whole point: a request for a value the user has already left comes
    // back last and says "free". It must not clear the error the current value
    // has earned.
    it('an out-of-order result does not clear the current value error', async () => {
        const slow = deferred<boolean>()
        const fast = deferred<boolean>()
        const check = vi.fn((value: string) => (value === 'ada' ? slow.promise : fast.promise))
        const { input } = renderForm(check, 'onChange')

        fireEvent.change(input, { target: { value: 'ada' } })
        await waitFor(() => expect(check).toHaveBeenCalledWith('ada'))

        fireEvent.change(input, { target: { value: 'bob' } })
        await waitFor(() => expect(check).toHaveBeenCalledWith('bob'))

        fast.resolve(false)
        await waitFor(() => expect(screen.getByText(TAKEN)).toBeInTheDocument())

        slow.resolve(true)
        await settle()

        expect(screen.getByText(TAKEN)).toBeInTheDocument()
        expect(input).toHaveValue('bob')
    })

    // The resolver parses the whole schema, so every keystroke in `note` asks
    // about `username` too, with a value nobody touched. Against a server that
    // answers slower than the quiet period, that is a request per keystroke and
    // an indicator that cannot clear.
    it('does not re-ask about a field the edit did not touch', async () => {
        const check = vi.fn(
            (value: string) =>
                new Promise<boolean>((resolve) => setTimeout(() => resolve(value !== 'ada'), 200)),
        )
        const schema = z.object({
            username: asyncCheck(required(), check, { delay: 20, message: TAKEN }),
            note: z.string().optional(),
        })
        render(
            <BasicForm
                onSubmit={vi.fn()}
                validationSchema={schema}
                defaultValues={{ username: 'ada', note: '' }}
                mode="onChange"
            >
                <FormField name="username" type="text" label="Username" />
                <FormField name="note" type="text" label="Note" />
                <Waiting name="username" />
                <button type="submit">Submit</button>
            </BasicForm>,
        )
        const note = screen.getAllByRole('textbox')[1]

        for (const value of ['h', 'he', 'hel', 'hell']) {
            fireEvent.change(note, { target: { value } })
            await new Promise((resolve) => setTimeout(resolve, 40))
        }

        await waitFor(() => expect(waiting('username')).toBe('false'))
        expect(check).toHaveBeenCalledTimes(1)
        expect(check).toHaveBeenCalledWith('ada')
    })
})

const Waiting = ({ name }: { name: string }) => (
    <span data-testid={`waiting-${name}`}>{String(useIsAsyncValidating(name))}</span>
)

const waiting = (name: string) => screen.getByTestId(`waiting-${name}`).textContent

// `plain` carries no remote check; `other` carries one and starts non-blank, so
// a parse triggered by any field reaches it.
const renderTwoAsyncFields = (
    check: (value: string) => Promise<boolean>,
    otherCheck: (value: string) => Promise<boolean>,
    probe?: React.ReactNode,
) => {
    const schema = z.object({
        username: asyncCheck(required(), check, { delay: 10, message: TAKEN }),
        other: asyncCheck(required(), otherCheck, { delay: 10, message: TAKEN }),
        plain: z.string().optional(),
    })
    render(
        <BasicForm
            onSubmit={vi.fn()}
            validationSchema={schema}
            defaultValues={{ username: '', other: 'seeded', plain: '' }}
            mode="onChange"
        >
            <FormField name="username" type="text" label="Username" />
            <FormField name="other" type="text" label="Other" />
            <FormField name="plain" type="text" label="Plain" />
            <Waiting name="username" />
            <Waiting name="other" />
            <Waiting name="plain" />
            <Waiting name="absent" />
            {probe}
            <button type="submit">Submit</button>
        </BasicForm>,
    )
    return { input: screen.getAllByRole('textbox')[0] }
}

describe('useIsAsyncValidating', () => {
    it('reports the field as waiting until its verdict lands', async () => {
        const gate = deferred<boolean>()
        const { input } = renderForm(
            () => gate.promise,
            'onChange',
            vi.fn(),
            <Waiting name="username" />,
        )

        expect(waiting('username')).toBe('false')

        fireEvent.change(input, { target: { value: 'ada' } })
        await waitFor(() => expect(waiting('username')).toBe('true'))

        gate.resolve(false)
        await waitFor(() => expect(screen.getByText(TAKEN)).toBeInTheDocument())
        expect(waiting('username')).toBe('false')
    })

    it('stops waiting when the field is emptied before the window elapses', async () => {
        const gate = deferred<boolean>()
        const { input } = renderForm(
            () => gate.promise,
            'onChange',
            vi.fn(),
            <Waiting name="username" />,
        )

        fireEvent.change(input, { target: { value: 'ada' } })
        await waitFor(() => expect(waiting('username')).toBe('true'))

        fireEvent.change(input, { target: { value: '' } })
        await waitFor(() => expect(waiting('username')).toBe('false'))
    })

    it('is false for a name the schema has no async check for', async () => {
        const gate = deferred<boolean>()
        renderTwoAsyncFields(
            () => gate.promise,
            () => gate.promise,
        )

        expect(waiting('plain')).toBe('false')
        expect(waiting('absent')).toBe('false')
    })

    it('reports every field the parse is actually waiting on, not just the edited one', async () => {
        const gate = deferred<boolean>()
        const otherCheck = vi.fn(() => gate.promise)
        const { input } = renderTwoAsyncFields(() => gate.promise, otherCheck)

        fireEvent.change(input, { target: { value: 'ada' } })

        // Editing `username` re-parses the whole schema, which asks about
        // `other` too. Both are waiting; `plain` never is.
        await waitFor(() => expect(otherCheck).toHaveBeenCalled())
        expect(waiting('username')).toBe('true')
        expect(waiting('other')).toBe('true')
        expect(waiting('plain')).toBe('false')

        gate.resolve(true)
        await waitFor(() => expect(waiting('username')).toBe('false'))
        expect(waiting('other')).toBe('false')
    })

    // Why the library carries its own signal. React Hook Form's per-field
    // `isValidating` names the field whose event started the parse; under a
    // resolver the parse is the whole schema, so on submit RHF marks every
    // mounted field - including one with no remote check at all.
    it('does not mark a field with no remote check while the form submits', async () => {
        const gate = deferred<boolean>()
        const RhfProbe = () => {
            const { formState } = useFormContext()
            return <span data-testid="rhf-plain">{String(!!formState.validatingFields.plain)}</span>
        }
        renderTwoAsyncFields(
            () => gate.promise,
            () => gate.promise,
            <RhfProbe />,
        )

        fireEvent.click(screen.getByText('Submit'))
        await waitFor(() => expect(screen.getByTestId('rhf-plain')).toHaveTextContent('true'))

        expect(waiting('plain')).toBe('false')
        expect(waiting('other')).toBe('true')

        gate.resolve(true)
        await waitFor(() => expect(waiting('other')).toBe('false'))
    })
})
