// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, waitFor, within } from '@testing-library/react'
import { FormField } from '../../src/field'
import { SchemaForm } from '../../src/config'
import * as root from '../../src'
import type { FieldRenderer, FieldRendererRegistry, FormConfig } from '../../src/config'

const config: FormConfig = [
    { name: 'fullName', type: 'text', label: 'Full name', validation: ['required'] },
    {
        name: 'nickname',
        type: 'text',
        label: 'Nickname',
        validation: [{ rule: 'minLength', value: 3 }],
    },
    { name: 'subscribe', type: 'checkbox', label: 'Subscribe' },
]

const mount = (ui: React.ReactElement) => {
    const { container } = render(ui)
    const view = within(container)
    return {
        container,
        view,
        type: (name: string, value: string) => {
            const el = container.querySelector<HTMLInputElement>(`input[name="${name}"]`)
            if (!el) throw new Error(`no input named ${name}`)
            fireEvent.change(el, { target: { value } })
        },
    }
}

describe('SchemaForm', () => {
    it('is exported from the package root', () => {
        expect(typeof SchemaForm).toBe('function')
        expect(root.SchemaForm).toBe(SchemaForm)
    })

    it('renders the config with a submit button and submits the typed values', async () => {
        const onSubmit = vi.fn()
        const form = mount(<SchemaForm config={config} onSubmit={onSubmit} />)
        form.type('fullName', 'Sam')
        form.type('nickname', 'sammy')
        fireEvent.click(form.view.getByRole('button', { name: 'Submit' }))

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({
            fullName: 'Sam',
            nickname: 'sammy',
            subscribe: false,
        })
    })

    it('seeds the form with the defaults derived from the config', () => {
        const seeded: FormConfig = [{ name: 'city', type: 'text', defaultValue: 'Leeds' }]
        const form = mount(<SchemaForm config={seeded} onSubmit={() => {}} />)
        expect(form.container.querySelector<HTMLInputElement>('input[name="city"]')?.value).toBe(
            'Leeds',
        )
    })

    it('validates with the schema derived from the config', async () => {
        const onSubmit = vi.fn()
        const form = mount(<SchemaForm config={config} onSubmit={onSubmit} buttonLabel="Save" />)
        fireEvent.click(form.view.getByRole('button', { name: 'Save' }))

        await waitFor(() => expect(form.view.getByText('This field is required')).toBeTruthy())
        expect(onSubmit).not.toHaveBeenCalled()
    })

    it('lets per-form messages reach the rules of the config', async () => {
        const messages = { required: 'Obligatoire', minLength: 'Au moins {min} caracteres' }
        const form = mount(<SchemaForm config={config} onSubmit={() => {}} messages={messages} />)
        form.type('nickname', 'ab')
        fireEvent.click(form.view.getByRole('button', { name: 'Submit' }))

        await waitFor(() => expect(form.view.getByText('Obligatoire')).toBeTruthy())
        expect(form.view.getByText('Au moins 3 caracteres')).toBeTruthy()
    })

    it('renders through the renderers it is given', () => {
        const Boxed: FieldRenderer = ({ field, required }) => (
            <div data-testid={`boxed-${field.name}`}>
                <FormField
                    name={field.name}
                    type={field.type}
                    label={field.label}
                    required={required}
                />
            </div>
        )
        const renderers: FieldRendererRegistry = { fallback: Boxed }
        const form = mount(<SchemaForm config={config} onSubmit={() => {}} renderers={renderers} />)
        expect(form.view.getByTestId('boxed-fullName')).toBeTruthy()
        expect(form.view.getByTestId('boxed-subscribe')).toBeTruthy()
    })

    it('renders its children after the fields and before the button', () => {
        const form = mount(
            <SchemaForm config={config} onSubmit={() => {}}>
                <p>By booking you accept the terms</p>
            </SchemaForm>,
        )
        const note = form.view.getByText('By booking you accept the terms')
        const lastInput = form.view.getByRole('checkbox', { name: 'Subscribe' })
        const button = form.view.getByRole('button', { name: 'Submit' })
        expect(
            lastInput.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy()
        expect(note.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('hands what onSubmit returned to onSuccess', async () => {
        const onSuccess = vi.fn()
        const form = mount(
            <SchemaForm config={config} onSubmit={async () => ({ id: 7 })} onSuccess={onSuccess} />,
        )
        form.type('fullName', 'Sam')
        form.type('nickname', 'sammy')
        fireEvent.click(form.view.getByRole('button', { name: 'Submit' }))

        await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
        expect(onSuccess.mock.calls[0][0]).toEqual({ id: 7 })
    })
})

describe('SchemaForm - conditional fields in the submitted values', () => {
    const shipping: FormConfig = [
        { name: 'ship', type: 'checkbox', label: 'Ship it' },
        {
            name: 'city',
            type: 'text',
            label: 'City',
            defaultValue: 'Leeds',
            showWhen: { field: 'ship', is: true },
        },
    ]

    const submitted = async (
        form: ReturnType<typeof mount>,
        onSubmit: ReturnType<typeof vi.fn>,
    ) => {
        fireEvent.click(form.view.getByRole('button', { name: 'Submit' }))
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        return onSubmit.mock.calls[0][0]
    }

    it('leaves out a field that was never shown', async () => {
        const onSubmit = vi.fn()
        const form = mount(<SchemaForm config={shipping} onSubmit={onSubmit} />)
        expect(await submitted(form, onSubmit)).toEqual({ ship: false })
    })

    it('leaves out a field that was shown and then hidden', async () => {
        const onSubmit = vi.fn()
        const form = mount(<SchemaForm config={shipping} onSubmit={onSubmit} />)
        const toggle = () => fireEvent.click(form.view.getByRole('checkbox', { name: 'Ship it' }))
        toggle()
        await waitFor(() =>
            expect(form.container.querySelector('input[name="city"]')).not.toBeNull(),
        )
        form.type('city', 'York')
        toggle()
        await waitFor(() => expect(form.container.querySelector('input[name="city"]')).toBeNull())
        expect(await submitted(form, onSubmit)).toEqual({ ship: false })
    })

    it('submits a shown field, starting from its default', async () => {
        const onSubmit = vi.fn()
        const form = mount(<SchemaForm config={shipping} onSubmit={onSubmit} />)
        fireEvent.click(form.view.getByRole('checkbox', { name: 'Ship it' }))
        await waitFor(() =>
            expect(
                form.container.querySelector<HTMLInputElement>('input[name="city"]')?.value,
            ).toBe('Leeds'),
        )
        expect(await submitted(form, onSubmit)).toEqual({ ship: true, city: 'Leeds' })
    })

    it('leaves out a never-shown child of a visible group', async () => {
        const onSubmit = vi.fn()
        const nested: FormConfig = [
            { name: 'ship', type: 'checkbox', label: 'Ship it' },
            {
                name: 'delivery',
                type: 'group',
                label: 'Delivery',
                showWhen: { field: 'ship', is: true },
                fields: [
                    { name: 'express', type: 'checkbox', label: 'Express' },
                    {
                        name: 'slot',
                        type: 'text',
                        label: 'Slot',
                        showWhen: { field: 'express', is: true },
                    },
                ],
            },
        ]
        const form = mount(<SchemaForm config={nested} onSubmit={onSubmit} />)
        fireEvent.click(form.view.getByRole('checkbox', { name: 'Ship it' }))
        await waitFor(() =>
            expect(form.view.getByRole('checkbox', { name: 'Express' })).toBeTruthy(),
        )
        expect(await submitted(form, onSubmit)).toEqual({
            ship: true,
            delivery: { express: false },
        })
    })

    it('leaves out a never-shown field inside an array item', async () => {
        const onSubmit = vi.fn()
        const items: FormConfig = [
            {
                name: 'items',
                type: 'array',
                itemLabel: 'Item',
                defaultValue: [{}],
                fields: [
                    { name: 'gift', type: 'checkbox', label: 'Gift' },
                    {
                        name: 'note',
                        type: 'text',
                        label: 'Note',
                        showWhen: { field: 'gift', is: true },
                    },
                ],
            },
        ]
        const form = mount(<SchemaForm config={items} onSubmit={onSubmit} />)
        expect(await submitted(form, onSubmit)).toEqual({ items: [{ gift: false }] })
    })
})
