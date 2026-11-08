// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, waitFor, within } from '@testing-library/react'
import { SchemaForm } from '../../src/config'
import type { FormConfig } from '../../src/config'
import type { MessageOverrides } from '../../src/validation/messages'

const mount = (
    config: FormConfig,
    props: { messages?: MessageOverrides; resetOnSubmit?: boolean } = {},
) => {
    const onSubmit = vi.fn()
    const { container } = render(<SchemaForm config={config} onSubmit={onSubmit} {...props} />)
    const view = within(container)
    const input = (name: string) =>
        container.querySelector<HTMLInputElement>(`input[name="${name}"]`)
    return {
        container,
        view,
        onSubmit,
        input,
        type: (name: string, value: string) => {
            const el = input(name)
            if (!el) throw new Error(`no input named ${name}`)
            fireEvent.change(el, { target: { value } })
        },
        submit: () => fireEvent.click(view.getByRole('button', { name: 'Submit' })),
        errorsIn: (group: string) =>
            Array.from(
                view
                    .getByRole('group', { name: group })
                    .querySelectorAll('.custom-field-message--error'),
            ).map((el) => el.textContent),
    }
}

const orderConfig: FormConfig = [
    { name: 'customer', type: 'text', label: 'Customer', validation: ['required'] },
    {
        name: 'address',
        type: 'group',
        label: 'Address',
        layout: 'row',
        fields: [
            { name: 'city', type: 'text', label: 'City', validation: ['required'] },
            {
                name: 'postcode',
                type: 'text',
                label: 'Postcode',
                defaultValue: 'YO1 7AA',
                validation: [{ rule: 'minLength', value: 5 }],
            },
        ],
    },
    {
        name: 'lines',
        type: 'array',
        label: 'Lines',
        itemLabel: 'Line',
        addLabel: 'Add line',
        defaultValue: [{ sku: 'A100' }],
        fields: [
            { name: 'sku', type: 'text', label: 'SKU', validation: ['required'] },
            {
                name: 'note',
                type: 'text',
                label: 'Note',
                validation: [{ rule: 'maxLength', value: 10 }],
            },
        ],
    },
]

describe('SchemaForm with a group entry', () => {
    it('submits the group children as one object under the group name', async () => {
        const form = mount(orderConfig)
        form.type('customer', 'Sam')
        form.type('address.city', 'York')
        form.type('address.postcode', 'YO1 7')
        form.submit()

        await waitFor(() => expect(form.onSubmit).toHaveBeenCalledTimes(1))
        expect(form.onSubmit.mock.calls[0][0]).toEqual({
            customer: 'Sam',
            address: { city: 'York', postcode: 'YO1 7' },
            lines: [{ sku: 'A100', note: '' }],
        })
    })

    it('blocks the submit and shows the errors inside the group fieldset', async () => {
        const form = mount(orderConfig)
        form.type('customer', 'Sam')
        form.type('address.postcode', 'YO1')
        form.submit()

        await waitFor(() =>
            expect(form.errorsIn('Address')).toEqual([
                'This field is required',
                'Must be at least 5 characters',
            ]),
        )
        expect(form.onSubmit).not.toHaveBeenCalled()
    })

    it('lets per-form messages reach the rules of the group children', async () => {
        const form = mount(orderConfig, {
            messages: { required: 'Obligatoire', minLength: 'Au moins {min} caracteres' },
        })
        form.type('customer', 'Sam')
        form.type('address.postcode', 'YO1')
        form.submit()

        await waitFor(() =>
            expect(form.errorsIn('Address')).toEqual(['Obligatoire', 'Au moins 5 caracteres']),
        )
        expect(form.onSubmit).not.toHaveBeenCalled()
    })

    it('skips a hidden group and drops its value, then validates it once shown', async () => {
        const form = mount([
            { name: 'ship', type: 'checkbox', label: 'Ship it' },
            {
                name: 'delivery',
                type: 'group',
                label: 'Delivery',
                showWhen: { field: 'ship', is: true },
                fields: [{ name: 'city', type: 'text', label: 'City', validation: ['required'] }],
            },
        ])
        const toggle = () => fireEvent.click(form.view.getByRole('checkbox', { name: 'Ship it' }))
        expect(form.view.queryByRole('group', { name: 'Delivery' })).toBeNull()

        toggle()
        await waitFor(() => expect(form.input('delivery.city')).not.toBeNull())
        form.submit()
        await waitFor(() => expect(form.errorsIn('Delivery')).toEqual(['This field is required']))
        expect(form.onSubmit).not.toHaveBeenCalled()

        form.type('delivery.city', 'York')
        toggle()
        await waitFor(() => expect(form.input('delivery.city')).toBeNull())
        form.submit()

        await waitFor(() => expect(form.onSubmit).toHaveBeenCalledTimes(1))
        expect(form.onSubmit.mock.calls[0][0]).toEqual({ ship: false })
    })
})

describe('SchemaForm with an array entry', () => {
    it('adds, fills and removes items, and submits what is left in order', async () => {
        const form = mount(orderConfig)
        form.type('customer', 'Sam')
        form.type('address.city', 'York')

        fireEvent.click(form.view.getByRole('button', { name: 'Add line' }))
        await waitFor(() => expect(form.input('lines.1.sku')).not.toBeNull())
        expect(form.onSubmit).not.toHaveBeenCalled()
        form.type('lines.1.sku', 'B200')
        form.type('lines.1.note', 'gift')

        fireEvent.click(form.view.getByRole('button', { name: 'Add line' }))
        await waitFor(() => expect(form.input('lines.2.sku')).not.toBeNull())
        form.type('lines.2.sku', 'C300')

        const first = form.view.getByRole('group', { name: 'Line 1' })
        fireEvent.click(within(first).getByRole('button', { name: 'Remove' }))
        await waitFor(() => expect(form.input('lines.2.sku')).toBeNull())
        expect(form.input('lines.0.sku')?.value).toBe('B200')

        form.submit()
        await waitFor(() => expect(form.onSubmit).toHaveBeenCalledTimes(1))
        expect(form.onSubmit.mock.calls[0][0]).toEqual({
            customer: 'Sam',
            address: { city: 'York', postcode: 'YO1 7AA' },
            lines: [
                { sku: 'B200', note: 'gift' },
                { sku: 'C300', note: '' },
            ],
        })
    })

    it('shows each error on its own item and leaves the valid item clean', async () => {
        const form = mount(orderConfig)
        form.type('customer', 'Sam')
        form.type('address.city', 'York')
        fireEvent.click(form.view.getByRole('button', { name: 'Add line' }))
        await waitFor(() => expect(form.input('lines.1.sku')).not.toBeNull())
        form.type('lines.1.note', 'far too long a note')
        form.submit()

        await waitFor(() =>
            expect(form.errorsIn('Line 2')).toEqual([
                'This field is required',
                'Must be at most 10 characters',
            ]),
        )
        expect(form.errorsIn('Line 1')).toEqual([])
        expect(form.onSubmit).not.toHaveBeenCalled()
    })

    it('lets per-form messages reach the rules inside an item', async () => {
        const form = mount(orderConfig, {
            messages: { required: 'Obligatoire', maxLength: 'Au plus {max} caracteres' },
        })
        form.type('customer', 'Sam')
        form.type('address.city', 'York')
        form.type('lines.0.sku', '')
        form.type('lines.0.note', 'far too long a note')
        form.submit()

        await waitFor(() =>
            expect(form.errorsIn('Line 1')).toEqual(['Obligatoire', 'Au plus 10 caracteres']),
        )
        expect(form.onSubmit).not.toHaveBeenCalled()
    })

    it('validates an item field shown by a sibling in its item, with per-form messages', async () => {
        const form = mount(
            [
                {
                    name: 'items',
                    type: 'array',
                    itemLabel: 'Item',
                    defaultValue: [{}, {}],
                    fields: [
                        { name: 'gift', type: 'checkbox', label: 'Gift' },
                        {
                            name: 'note',
                            type: 'text',
                            label: 'Note',
                            validation: ['required'],
                            showWhen: { field: 'gift', is: true },
                        },
                    ],
                },
            ],
            { messages: { required: 'Obligatoire' } },
        )
        const giftIn = (item: string) =>
            within(form.view.getByRole('group', { name: item })).getByRole('checkbox')

        fireEvent.click(giftIn('Item 1'))
        await waitFor(() => expect(form.input('items.0.note')).not.toBeNull())
        form.type('items.0.note', 'dropped')
        fireEvent.click(giftIn('Item 1'))
        await waitFor(() => expect(form.input('items.0.note')).toBeNull())

        fireEvent.click(giftIn('Item 2'))
        await waitFor(() => expect(form.input('items.1.note')).not.toBeNull())
        form.submit()

        await waitFor(() => expect(form.errorsIn('Item 2')).toEqual(['Obligatoire']))
        expect(form.errorsIn('Item 1')).toEqual([])
        expect(form.onSubmit).not.toHaveBeenCalled()

        form.type('items.1.note', 'wrap it')
        form.submit()
        await waitFor(() => expect(form.onSubmit).toHaveBeenCalledTimes(1))
        expect(form.onSubmit.mock.calls[0][0]).toEqual({
            items: [{ gift: false }, { gift: true, note: 'wrap it' }],
        })
    })

    it('restores the default items after a submit with resetOnSubmit', async () => {
        const form = mount(orderConfig, { resetOnSubmit: true })
        form.type('customer', 'Sam')
        form.type('address.city', 'York')
        fireEvent.click(form.view.getByRole('button', { name: 'Add line' }))
        await waitFor(() => expect(form.input('lines.1.sku')).not.toBeNull())
        form.type('lines.1.sku', 'B200')
        form.submit()

        await waitFor(() => expect(form.onSubmit).toHaveBeenCalledTimes(1))
        await waitFor(() => expect(form.input('lines.1.sku')).toBeNull())
        expect(form.input('lines.0.sku')?.value).toBe('A100')
        expect(form.input('customer')?.value).toBe('')
    })
})

describe('SchemaForm with nested composites', () => {
    const nested: FormConfig = [
        {
            name: 'order',
            type: 'group',
            label: 'Order',
            fields: [
                { name: 'reference', type: 'text', label: 'Reference' },
                {
                    name: 'parcels',
                    type: 'array',
                    label: 'Parcels',
                    itemLabel: 'Parcel',
                    addLabel: 'Add parcel',
                    fields: [
                        {
                            name: 'size',
                            type: 'group',
                            label: 'Size',
                            layout: 'row',
                            fields: [
                                {
                                    name: 'weight',
                                    type: 'numeric',
                                    label: 'Weight',
                                    validation: [{ rule: 'min', value: 1 }],
                                },
                                {
                                    name: 'label',
                                    type: 'text',
                                    label: 'Label',
                                    validation: ['required'],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ]

    it('submits a group inside an item inside a group', async () => {
        const form = mount(nested)
        form.type('order.reference', 'R-1')
        fireEvent.click(form.view.getByRole('button', { name: 'Add parcel' }))
        await waitFor(() => expect(form.input('order.parcels.0.size.label')).not.toBeNull())
        form.type('order.parcels.0.size.weight', '3')
        form.type('order.parcels.0.size.label', 'Box')
        form.submit()

        await waitFor(() => expect(form.onSubmit).toHaveBeenCalledTimes(1))
        expect(form.onSubmit.mock.calls[0][0]).toEqual({
            order: { reference: 'R-1', parcels: [{ size: { weight: 3, label: 'Box' } }] },
        })
    })

    it('lands per-form messages on the deepest field path', async () => {
        const form = mount(nested, {
            messages: { required: 'Obligatoire', minValue: 'Au moins {min}' },
        })
        fireEvent.click(form.view.getByRole('button', { name: 'Add parcel' }))
        await waitFor(() => expect(form.input('order.parcels.0.size.label')).not.toBeNull())
        form.type('order.parcels.0.size.weight', '0')
        form.submit()

        await waitFor(() => expect(form.errorsIn('Size')).toEqual(['Au moins 1', 'Obligatoire']))
        expect(form.onSubmit).not.toHaveBeenCalled()
    })
})
