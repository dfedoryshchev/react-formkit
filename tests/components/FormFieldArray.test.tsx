// @vitest-environment jsdom
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { z } from 'zod'
import { BasicForm } from '../../src/form'
import { FormField, FormFieldArray } from '../../src/field'

const schema = z.object({
    contacts: z.array(
        z.object({
            email: z.string().min(1).email(),
            note: z.string().optional(),
        }),
    ),
})

const two = {
    contacts: [
        { email: 'first@example.com', note: '' },
        { email: 'second@example.com', note: '' },
    ],
}

const renderArray = (defaultValues: unknown = two, onSubmit = () => {}) =>
    render(
        <BasicForm
            onSubmit={onSubmit}
            validationSchema={schema}
            defaultValues={defaultValues as never}
            mode="onChange"
        >
            <FormFieldArray name="contacts" empty={<p>No contacts yet</p>}>
                {({ name, index }) => (
                    <>
                        <FormField name={`${name}.email`} type="email" label={`Email ${index}`} />
                        <FormField name={`${name}.note`} type="text" label={`Note ${index}`} />
                    </>
                )}
            </FormFieldArray>
            <button type="submit">Send</button>
        </BasicForm>,
    )

describe('FormFieldArray', () => {
    it('renders one row per item in the array', () => {
        renderArray()
        expect(screen.getByLabelText(/Email 0/)).toHaveValue('first@example.com')
        expect(screen.getByLabelText(/Email 1/)).toHaveValue('second@example.com')
    })

    it('names each row against the array path, so the rows are separate fields', () => {
        const { container } = renderArray()
        const names = Array.from(container.querySelectorAll('input')).map((i) => i.name)
        expect(names).toEqual([
            'contacts.0.email',
            'contacts.0.note',
            'contacts.1.email',
            'contacts.1.note',
        ])
    })

    it('keeps the rows apart when one of them is edited', () => {
        renderArray()
        fireEvent.change(screen.getByLabelText(/Email 1/), {
            target: { value: 'changed@example.com' },
        })
        expect(screen.getByLabelText(/Email 1/)).toHaveValue('changed@example.com')
        expect(screen.getByLabelText(/Email 0/)).toHaveValue('first@example.com')
    })

    it('puts a row validation error on the row that caused it', async () => {
        renderArray()
        fireEvent.change(screen.getByLabelText(/Email 1/), { target: { value: 'not-an-email' } })
        fireEvent.blur(screen.getByLabelText(/Email 1/))
        await waitFor(() => {
            expect(screen.getByText(/Invalid email/i)).toBeInTheDocument()
        })
        expect(screen.getAllByText(/Invalid email/i)).toHaveLength(1)
    })

    it('marks a required field inside a row as required', () => {
        // the indicator is inferred from the schema, and until this row the
        // lookup was a flat `shape[name]` - so every field inside an array read
        // as not-required no matter what the element schema said.
        const { container } = renderArray()
        const marks = container.querySelectorAll('.required-mark')
        expect(marks).toHaveLength(2)
    })

    it('renders the empty slot rather than a row when the array is empty', () => {
        renderArray({ contacts: [] })
        expect(screen.getByText('No contacts yet')).toBeInTheDocument()
        expect(screen.queryByLabelText(/Email 0/)).not.toBeInTheDocument()
    })

    it('renders nothing at all for an empty array with no empty slot', () => {
        const { container } = render(
            <BasicForm
                onSubmit={() => {}}
                validationSchema={schema}
                defaultValues={{ contacts: [] }}
            >
                <FormFieldArray name="contacts">
                    {({ name }) => <FormField name={`${name}.email`} type="email" label="Email" />}
                </FormFieldArray>
            </BasicForm>,
        )
        expect(container.querySelectorAll('input')).toHaveLength(0)
    })

    it('gives each row a key that is not its index', () => {
        // the row identity comes from react-hook-form, which is what makes a
        // later reorder move a row instead of retyping two of them.
        const seen: string[] = []
        render(
            <BasicForm onSubmit={() => {}} validationSchema={schema} defaultValues={two as never}>
                <FormFieldArray name="contacts">
                    {({ id, index }) => {
                        seen.push(id)
                        return <span>{index}</span>
                    }}
                </FormFieldArray>
            </BasicForm>,
        )
        // the render prop can run more than once per render pass, so the claim
        // is about the set of ids and not about how many times it was called
        expect(new Set(seen).size).toBe(2)
        expect(seen).not.toContain('0')
        expect(seen).not.toContain('1')
    })

    it('submits the rows as an array, in order', async () => {
        const onSubmit = vi.fn()
        renderArray(two, onSubmit)
        fireEvent.click(screen.getByText('Send'))
        await waitFor(() => expect(onSubmit).toHaveBeenCalled())
        expect(onSubmit.mock.calls[0][0].contacts.map((c: { email: string }) => c.email)).toEqual([
            'first@example.com',
            'second@example.com',
        ])
    })
})
