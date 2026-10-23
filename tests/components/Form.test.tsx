// @vitest-environment jsdom
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Form } from '../../src/form'
import { FormField } from '../../src/field'

const defaultValues = { name: '' }

const Parent = ({ label, keepFormOnSuccess }: { label: string; keepFormOnSuccess?: boolean }) => (
    <Form
        onSubmit={() => {}}
        defaultValues={defaultValues}
        successContent={<p>Thanks</p>}
        keepFormOnSuccess={keepFormOnSuccess}
    >
        <FormField name="name" type="text" label={label} />
    </Form>
)

describe('Form across a parent re-render', () => {
    it('keeps a typed value when the parent re-renders with new props', async () => {
        const user = userEvent.setup()
        const { rerender } = render(<Parent label="Name" />)

        await user.type(screen.getByRole('textbox'), 'Grace')
        rerender(<Parent label="Full name" />)

        expect(screen.getByLabelText('Full name')).toHaveValue('Grace')
    })

    it('keeps the success content when the parent re-renders after a submit', async () => {
        const user = userEvent.setup()
        const { rerender } = render(<Parent label="Name" />)

        await user.type(screen.getByRole('textbox'), 'Grace')
        await user.click(screen.getByRole('button', { name: 'Submit' }))
        await waitFor(() => expect(screen.getByText('Thanks')).toBeInTheDocument())

        rerender(<Parent label="Full name" />)

        expect(screen.getByText('Thanks')).toBeInTheDocument()
        expect(screen.queryByRole('textbox')).toBeNull()
    })

    it('keeps the submitted value beside the success content across a parent re-render', async () => {
        const user = userEvent.setup()
        const { rerender } = render(<Parent label="Name" keepFormOnSuccess />)

        await user.type(screen.getByRole('textbox'), 'Grace')
        await user.click(screen.getByRole('button', { name: 'Submit' }))
        await waitFor(() => expect(screen.getByText('Thanks')).toBeInTheDocument())

        rerender(<Parent label="Full name" keepFormOnSuccess />)

        expect(screen.getByText('Thanks')).toBeInTheDocument()
        expect(screen.getByLabelText('Full name')).toHaveValue('Grace')
    })
})
