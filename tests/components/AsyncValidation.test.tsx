// @vitest-environment jsdom
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { BasicForm } from '../../src/form'
import { FormField } from '../../src/field'
import { asyncCheck } from '../../src/validation/validators/async.validators'
import { required } from '../../src/validation/validators/common.validators'

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
})
