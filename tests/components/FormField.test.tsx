// @vitest-environment jsdom
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { z } from 'zod'
import { BasicForm } from '../../src/form'
import { FormField } from '../../src/field'

const schema = z.object({ name: z.string().min(1) })

const renderField = () =>
    render(
        <BasicForm onSubmit={() => {}} validationSchema={schema} defaultValues={{ name: '' }}>
            <FormField name="name" type="text" label="Name" />
        </BasicForm>,
    )

describe('FormField', () => {
    it('renders the labelled text control', () => {
        renderField()
        expect(screen.getByText('Name')).toBeInTheDocument()
        expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('marks a schema-required field with aria-required', () => {
        renderField()
        expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true')
    })

    it('associates the label with the input via id/htmlFor', () => {
        renderField()
        expect(screen.getByRole('textbox')).toHaveAttribute('id', 'name')
    })

    it('cross-field error updates when the other field changes', async () => {
        const matchSchema = z.object({ password: z.string(), confirm: z.string() })
        const validators = [
            {
                refinement: (data: any) => data.password === data.confirm,
                message: 'Passwords must match',
                path: ['confirm'],
            },
        ]

        render(
            <BasicForm
                onSubmit={() => {}}
                validationSchema={matchSchema}
                defaultValues={{ password: '', confirm: '' }}
                formLevelValidators={validators}
            >
                <FormField name="password" type="text" label="Password" />
                <FormField name="confirm" type="text" label="Confirm" />
                <button type="submit">Submit</button>
            </BasicForm>,
        )

        const [password, confirm] = screen.getAllByRole('textbox')
        fireEvent.change(password, { target: { value: 'secret' } })
        fireEvent.change(confirm, { target: { value: 'secret' } })
        fireEvent.click(screen.getByText('Submit'))
        await waitFor(() =>
            expect(screen.queryByText('Passwords must match')).not.toBeInTheDocument(),
        )

        // change the OTHER field (password); confirm's cross-field error must raise
        fireEvent.change(password, { target: { value: 'secretx' } })
        await waitFor(() =>
            expect(screen.getByText('Passwords must match')).toBeInTheDocument(),
        )
    })
})
