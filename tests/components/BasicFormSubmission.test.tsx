// @vitest-environment jsdom
import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { z } from 'zod'
import { BasicForm } from '../../src/form'
import { FormField } from '../../src/field'

const overlay = () => document.querySelector('.fk-form-loading-overlay') as HTMLElement | null

const formNode = () => document.querySelector('form') as HTMLFormElement | null

const deferred = () => {
    let resolve!: () => void
    const promise = new Promise<void>((res) => {
        resolve = () => res()
    })
    return { promise, resolve }
}

const renderForm = (props: Record<string, any> = {}) =>
    render(
        <BasicForm onSubmit={() => {}} defaultValues={{ name: 'Ada' }} {...props}>
            <FormField name="name" type="text" label="Name" />
            <button type="submit">Submit</button>
        </BasicForm>,
    )

const submitButton = () => screen.getByRole('button', { name: 'Submit' })

describe('BasicForm loading overlay', () => {
    it('renders no overlay while submitting when loadingOverlay is not set', async () => {
        const user = userEvent.setup()
        const gate = deferred()
        renderForm({ onSubmit: () => gate.promise })

        await user.click(submitButton())
        expect(overlay()).toBeNull()

        await act(async () => {
            gate.resolve()
            await gate.promise
        })
    })

    it('blocks pointer interaction with the form while the overlay is up', async () => {
        const user = userEvent.setup()
        const gate = deferred()
        renderForm({ loadingOverlay: true, onSubmit: () => gate.promise })

        await user.click(submitButton())
        await waitFor(() => expect(overlay()).not.toBeNull())

        await expect(user.click(screen.getByRole('textbox'))).rejects.toThrow(
            /pointer-events: none/,
        )

        await act(async () => {
            gate.resolve()
            await gate.promise
        })
        await waitFor(() => expect(overlay()).toBeNull())
        expect(formNode()?.style.pointerEvents).toBeFalsy()
    })

    it('stacks the overlay above positioned form content', async () => {
        const user = userEvent.setup()
        const gate = deferred()
        renderForm({ loadingOverlay: true, onSubmit: () => gate.promise })

        await user.click(submitButton())
        await waitFor(() => expect(overlay()).not.toBeNull())

        // react-select paints its menu at z-index 1, so an overlay left on the
        // auto stacking level is not above everything the form can render.
        const zIndex = Number(window.getComputedStyle(overlay() as HTMLElement).zIndex)
        expect(Number.isNaN(zIndex)).toBe(false)
        expect(zIndex).toBeGreaterThan(1)

        await act(async () => {
            gate.resolve()
            await gate.promise
        })
    })

    it('takes focus when it opens and hands it back when it closes', async () => {
        const user = userEvent.setup()
        const gate = deferred()
        renderForm({ loadingOverlay: true, onSubmit: () => gate.promise })

        const submit = submitButton()
        await user.click(submit)
        await waitFor(() => expect(overlay()).not.toBeNull())
        expect(document.activeElement).toBe(overlay())

        await act(async () => {
            gate.resolve()
            await gate.promise
        })
        await waitFor(() => expect(overlay()).toBeNull())
        expect(document.activeElement).toBe(submit)
    })

    it('keeps Tab and Shift+Tab inside the overlay', async () => {
        const user = userEvent.setup()
        const gate = deferred()
        renderForm({ loadingOverlay: true, onSubmit: () => gate.promise })

        await user.click(submitButton())
        await waitFor(() => expect(overlay()).not.toBeNull())

        await user.tab()
        expect(document.activeElement).toBe(overlay())

        await user.tab({ shift: true })
        expect(document.activeElement).toBe(overlay())

        await act(async () => {
            gate.resolve()
            await gate.promise
        })
    })

    it('pulls focus back when something else takes it while the overlay is up', async () => {
        const user = userEvent.setup()
        const gate = deferred()
        renderForm({ loadingOverlay: true, onSubmit: () => gate.promise })

        await user.click(submitButton())
        await waitFor(() => expect(overlay()).not.toBeNull())

        await act(async () => {
            ;(screen.getByRole('textbox') as HTMLInputElement).focus()
        })
        expect(document.activeElement).toBe(overlay())

        await act(async () => {
            gate.resolve()
            await gate.promise
        })
    })
})

describe('BasicForm submission outcome', () => {
    it('passes the submitted values to onSubmit', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn()
        renderForm({ onSubmit })

        await user.click(submitButton())
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'Ada' })
    })

    it('clears the form after a successful submit when resetOnSubmit is set', async () => {
        const user = userEvent.setup()
        renderForm({ defaultValues: { name: '' }, resetOnSubmit: true })

        const input = screen.getByRole('textbox') as HTMLInputElement
        await user.type(input, 'Grace')
        expect(input.value).toBe('Grace')

        await user.click(submitButton())
        await waitFor(() => expect(input.value).toBe(''))
    })

    it('calls onSuccess with the submit result once the handler has resolved', async () => {
        const user = userEvent.setup()
        const onSuccess = vi.fn()
        const order: string[] = []
        const onSubmit = async () => {
            order.push('submit')
            return 'created-1'
        }
        renderForm({
            onSubmit,
            onSuccess: (...args: unknown[]) => {
                order.push('success')
                onSuccess(...args)
            },
        })

        await user.click(submitButton())
        await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
        expect(onSuccess).toHaveBeenCalledWith('created-1', { name: 'Ada' })
        expect(order).toEqual(['submit', 'success'])
    })

    it('replaces the form with successContent after a successful submit', async () => {
        const user = userEvent.setup()
        renderForm({ successContent: <p>Thanks, Ada</p> })

        expect(screen.queryByText('Thanks, Ada')).toBeNull()

        await user.click(submitButton())
        await waitFor(() => expect(screen.getByText('Thanks, Ada')).toBeInTheDocument())
        expect(formNode()).toBeNull()
        expect(screen.queryByRole('textbox')).toBeNull()
    })

    it('keeps the form beside the success content when keepFormOnSuccess is set', async () => {
        const user = userEvent.setup()
        renderForm({ successContent: <p>Thanks, Ada</p>, keepFormOnSuccess: true })

        await user.click(submitButton())
        await waitFor(() => expect(screen.getByText('Thanks, Ada')).toBeInTheDocument())
        expect(formNode()).not.toBeNull()
        expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('shows the success content when resetOnSubmit clears the form too', async () => {
        const user = userEvent.setup()
        renderForm({
            defaultValues: { name: '' },
            resetOnSubmit: true,
            keepFormOnSuccess: true,
            successContent: <p>Thanks, Ada</p>,
        })

        const input = screen.getByRole('textbox') as HTMLInputElement
        await user.type(input, 'Grace')
        await user.click(submitButton())

        await waitFor(() => expect(screen.getByText('Thanks, Ada')).toBeInTheDocument())
        expect(input.value).toBe('')
    })

    it('announces the success content to assistive technology', async () => {
        const user = userEvent.setup()
        renderForm({ successContent: <p>Thanks, Ada</p> })

        await user.click(submitButton())
        await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Thanks, Ada'))
    })

    it('does not announce success when validation blocks the submit', async () => {
        const user = userEvent.setup()
        const onSuccess = vi.fn()
        renderForm({
            defaultValues: { name: '' },
            validationSchema: z.object({ name: z.string().min(1, 'Required') }),
            successContent: <p>Thanks, Ada</p>,
            onSuccess,
        })

        await user.click(submitButton())
        await waitFor(() => expect(screen.getByText('Required')).toBeInTheDocument())
        expect(screen.queryByText('Thanks, Ada')).toBeNull()
        expect(onSuccess).not.toHaveBeenCalled()
    })

    it('hides the previous success content while the next submit is in flight', async () => {
        const user = userEvent.setup()
        const gate = deferred()
        let call = 0
        const onSubmit = () => {
            call += 1
            return call === 1 ? undefined : gate.promise
        }
        renderForm({ onSubmit, successContent: <p>Thanks, Ada</p>, keepFormOnSuccess: true })

        await user.click(submitButton())
        await waitFor(() => expect(screen.getByText('Thanks, Ada')).toBeInTheDocument())

        await user.click(submitButton())
        await waitFor(() => expect(screen.queryByText('Thanks, Ada')).toBeNull())

        await act(async () => {
            gate.resolve()
            await gate.promise
        })
        await waitFor(() => expect(screen.getByText('Thanks, Ada')).toBeInTheDocument())
    })
})
