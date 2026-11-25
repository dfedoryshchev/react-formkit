// @vitest-environment jsdom
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { z } from 'zod'
import { Form, FormField, FormFieldArray, email, required } from '../../src'

const schema = z.object({
    name: required(),
    contacts: z.array(z.object({ email: email() })),
})

const defaults = { name: '', contacts: [{ email: 'ada@example.com' }] }

const renderLifecycle = (props: Record<string, any> = {}) => {
    const onSubmit = vi.fn(async (data: any) => ({ id: 7, count: data.contacts.length }))
    const onSuccess = vi.fn()
    const view = render(
        <Form
            onSubmit={onSubmit}
            onSuccess={onSuccess}
            validationSchema={schema}
            defaultValues={defaults}
            successContent={<p>Saved</p>}
            buttonLabel="Save"
            {...props}
        >
            <FormField name="name" type="text" label="Name" />
            <FormFieldArray
                name="contacts"
                actions={({ append }) => (
                    <button type="button" onClick={() => append({ email: 'not-an-email' })}>
                        Add contact
                    </button>
                )}
            >
                {({ name, index, remove }) => (
                    // A type="email" input would let the browser's own constraint
                    // check block the submit before the schema ever sees the row.
                    <>
                        <FormField name={`${name}.email`} type="text" label={`Email ${index}`} />
                        <button type="button" onClick={remove}>{`Remove ${index}`}</button>
                    </>
                )}
            </FormFieldArray>
        </Form>,
    )
    return { ...view, onSubmit, onSuccess }
}

const save = () => screen.getByRole('button', { name: 'Save' })
const requiredError = () => screen.queryByText('This field is required')
const emailError = () => screen.queryByText('Invalid email address')

describe('form lifecycle', () => {
    it('fails a submit, recovers, takes an invalid appended row, and then succeeds', async () => {
        const user = userEvent.setup()
        const { onSubmit, onSuccess } = renderLifecycle()

        await user.click(save())
        await waitFor(() => expect(requiredError()).toBeInTheDocument())
        expect(onSubmit).not.toHaveBeenCalled()

        await user.type(screen.getByLabelText(/Name/), 'Ada')
        await waitFor(() => expect(requiredError()).not.toBeInTheDocument())

        await user.click(screen.getByRole('button', { name: 'Add contact' }))
        await waitFor(() => expect(screen.getByLabelText(/Email 1/)).toBeInTheDocument())
        await waitFor(() => expect(emailError()).toBeInTheDocument())

        await user.clear(screen.getByLabelText(/Email 1/))
        await user.type(screen.getByLabelText(/Email 1/), 'grace@example.com')
        await waitFor(() => expect(emailError()).not.toBeInTheDocument())

        await user.click(save())
        await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument())

        const values = {
            name: 'Ada',
            contacts: [{ email: 'ada@example.com' }, { email: 'grace@example.com' }],
        }
        expect(onSubmit).toHaveBeenCalledTimes(1)
        expect(onSubmit.mock.calls[0][0]).toEqual(values)
        expect(onSuccess).toHaveBeenCalledWith({ id: 7, count: 2 }, values)
        expect(document.querySelector('form')).toBeNull()
    })

    it('clears a row error when the invalid row is removed, and lets the submit through', async () => {
        const user = userEvent.setup()
        const { onSubmit } = renderLifecycle({ defaultValues: { ...defaults, name: 'Ada' } })

        await user.click(screen.getByRole('button', { name: 'Add contact' }))
        await user.click(save())
        await waitFor(() => expect(emailError()).toBeInTheDocument())
        expect(onSubmit).not.toHaveBeenCalled()

        await user.click(screen.getByRole('button', { name: 'Remove 1' }))
        await waitFor(() => expect(screen.queryByLabelText(/Email 1/)).not.toBeInTheDocument())
        await waitFor(() => expect(emailError()).not.toBeInTheDocument())

        await user.click(save())
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({
            name: 'Ada',
            contacts: [{ email: 'ada@example.com' }],
        })
    })

    it('drops the success content when a later submit fails', async () => {
        const user = userEvent.setup()
        const { onSubmit, onSuccess } = renderLifecycle({
            defaultValues: { ...defaults, name: 'Ada' },
            keepFormOnSuccess: true,
        })

        await user.click(save())
        await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument())
        expect(screen.getByLabelText(/Name/)).toHaveValue('Ada')

        await user.clear(screen.getByLabelText(/Name/))
        await user.click(save())
        await waitFor(() => expect(requiredError()).toBeInTheDocument())
        expect(screen.queryByText('Saved')).not.toBeInTheDocument()
        expect(onSubmit).toHaveBeenCalledTimes(1)
        expect(onSuccess).toHaveBeenCalledTimes(1)
    })
})
