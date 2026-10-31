// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, renderHook, fireEvent, waitFor, within } from '@testing-library/react'
import { BasicForm } from '../../src/form'
import {
    ConfigFields,
    NativeArrayItemRenderer,
    NativeArrayRenderer,
    NativeFieldRenderer,
    buildSchema,
    resolveArrayItemRenderer,
    resolveArrayRenderer,
    useFormFromConfig,
} from '../../src/config'
import type {
    ArrayItemRenderer,
    ArrayRenderer,
    FieldRendererRegistry,
    FormConfig,
} from '../../src/config'

const Harness: React.FC<{
    config: FormConfig
    onSubmit: (v: unknown) => void
    renderers?: FieldRendererRegistry
}> = ({ config, onSubmit, renderers }) => {
    const { defaults, fields, schema } = useFormFromConfig(config)
    return (
        <BasicForm onSubmit={onSubmit} validationSchema={schema} defaultValues={defaults}>
            <ConfigFields config={fields} renderers={renderers} />
            <button type="submit">Submit</button>
        </BasicForm>
    )
}

const mount = (config: FormConfig, renderers?: FieldRendererRegistry) => {
    const onSubmit = vi.fn()
    const { container } = render(
        <Harness config={config} onSubmit={onSubmit} renderers={renderers} />,
    )
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
    }
}

const contactsConfig: FormConfig = [
    { name: 'team', type: 'text', label: 'Team' },
    {
        name: 'contacts',
        type: 'array',
        label: 'Contacts',
        description: 'Who to reach about the order',
        itemLabel: 'Contact',
        addLabel: 'Add contact',
        fields: [
            { name: 'name', type: 'text', label: 'Name', validation: ['required'] },
            { name: 'email', type: 'email', label: 'Email', validation: [{ rule: 'email' }] },
        ],
    },
]

const twoContacts: FormConfig = [
    contactsConfig[0],
    {
        ...(contactsConfig[1] as Extract<FormConfig[number], { type: 'array' }>),
        defaultValue: [
            { name: 'Ada', email: 'ada@example.com' },
            { name: 'Grace', email: 'grace@example.com' },
        ],
    },
]

describe('buildSchema with an array entry', () => {
    it('validates every item against the item fields', () => {
        const schema = buildSchema(contactsConfig)

        expect(
            schema.safeParse({ team: 'x', contacts: [{ name: 'Ada', email: 'ada@example.com' }] })
                .success,
        ).toBe(true)
        expect(schema.safeParse({ team: 'x', contacts: [] }).success).toBe(true)

        const result = schema.safeParse({
            team: 'x',
            contacts: [
                { name: 'Ada', email: 'ada@example.com' },
                { name: '', email: 'not-an-email' },
            ],
        })
        expect(result.success).toBe(false)
        expect(result.error?.issues.map((i) => i.path)).toEqual([
            ['contacts', 1, 'name'],
            ['contacts', 1, 'email'],
        ])
    })

    it('rejects a value that is not an array', () => {
        expect(buildSchema(contactsConfig).safeParse({ team: 'x', contacts: 'Ada' }).success).toBe(
            false,
        )
    })

    it('evaluates an item field showWhen against a sibling inside the same item', () => {
        const schema = buildSchema([
            {
                name: 'items',
                type: 'array',
                fields: [
                    { name: 'gift', type: 'checkbox' },
                    {
                        name: 'note',
                        type: 'text',
                        validation: ['required'],
                        showWhen: { field: 'gift', is: true },
                    },
                ],
            },
        ])

        const result = schema.safeParse({
            items: [
                { gift: false, note: '' },
                { gift: true, note: '' },
            ],
        })
        expect(result.success).toBe(false)
        expect(result.error?.issues.map((i) => i.path)).toEqual([['items', 1, 'note']])
    })

    it('validates a conditional array only while its condition holds', () => {
        const schema = buildSchema([
            { name: 'hasGuests', type: 'checkbox' },
            {
                name: 'guests',
                type: 'array',
                showWhen: { field: 'hasGuests', is: true },
                fields: [{ name: 'name', type: 'text', validation: ['required'] }],
            },
        ])

        expect(schema.safeParse({ hasGuests: false }).success).toBe(true)
        expect(schema.safeParse({ hasGuests: false, guests: [{ name: '' }] }).success).toBe(true)
        const result = schema.safeParse({ hasGuests: true, guests: [{ name: '' }] })
        expect(result.success).toBe(false)
        expect(result.error?.issues.map((i) => i.path)).toEqual([['guests', 0, 'name']])
    })

    it('holds an array inside a group, and a group inside an array item', () => {
        const schema = buildSchema([
            {
                name: 'order',
                type: 'group',
                fields: [
                    {
                        name: 'lines',
                        type: 'array',
                        fields: [
                            {
                                name: 'product',
                                type: 'group',
                                fields: [{ name: 'sku', type: 'text', validation: ['required'] }],
                            },
                        ],
                    },
                ],
            },
        ])

        expect(schema.safeParse({ order: { lines: [{ product: { sku: 'A1' } }] } }).success).toBe(
            true,
        )
        const result = schema.safeParse({ order: { lines: [{ product: { sku: '' } }] } })
        expect(result.error?.issues.map((i) => i.path)).toEqual([
            ['order', 'lines', 0, 'product', 'sku'],
        ])
    })
})

describe('useFormFromConfig with an array entry', () => {
    it('defaults an array to no items', () => {
        const { result } = renderHook(() => useFormFromConfig(contactsConfig))
        expect(result.current.defaults).toEqual({ team: '', contacts: [] })
    })

    it('fills each default item with the item fields that it leaves out', () => {
        const { result } = renderHook(() =>
            useFormFromConfig([
                {
                    name: 'contacts',
                    type: 'array',
                    defaultValue: [{ name: 'Ada' }],
                    fields: [
                        { name: 'name', type: 'text' },
                        { name: 'primary', type: 'checkbox' },
                    ],
                },
            ]),
        )
        expect(result.current.defaults).toEqual({ contacts: [{ name: 'Ada', primary: false }] })
    })

    it('reports a duplicate name inside the item fields by its path', () => {
        expect(() =>
            renderHook(() =>
                useFormFromConfig([
                    {
                        name: 'contacts',
                        type: 'array',
                        fields: [
                            { name: 'email', type: 'email' },
                            { name: 'email', type: 'text' },
                        ],
                    },
                ]),
            ),
        ).toThrow('useFormFromConfig: duplicate field name(s): contacts.email')
    })

    it('rebuilds the schema when an item rule changes, and only then', () => {
        const { result, rerender } = renderHook(
            ({ min }) =>
                useFormFromConfig([
                    {
                        name: 'tags',
                        type: 'array',
                        fields: [
                            {
                                name: 'label',
                                type: 'text',
                                validation: [{ rule: 'minLength', value: min }],
                            },
                        ],
                    },
                ]),
            { initialProps: { min: 2 } },
        )
        const first = result.current.schema
        rerender({ min: 2 })
        expect(result.current.schema).toBe(first)

        rerender({ min: 5 })
        expect(result.current.schema).not.toBe(first)
        expect(result.current.schema.safeParse({ tags: [{ label: 'abc' }] }).success).toBe(false)
    })
})

describe('a config array on the native renderers', () => {
    it('renders one item fieldset per default item, each field on its item path', () => {
        const form = mount(twoContacts)

        const list = form.view.getByRole('group', { name: 'Contacts' })
        expect(list).toHaveAccessibleDescription('Who to reach about the order')
        const first = within(list).getByRole('group', { name: 'Contact 1' })
        const second = within(list).getByRole('group', { name: 'Contact 2' })
        expect(first.querySelector<HTMLInputElement>('input[name="contacts.0.name"]')?.value).toBe(
            'Ada',
        )
        expect(
            second.querySelector<HTMLInputElement>('input[name="contacts.1.email"]')?.value,
        ).toBe('grace@example.com')
    })

    it('renders only the add control while there are no items', () => {
        const form = mount(contactsConfig)

        const list = form.view.getByRole('group', { name: 'Contacts' })
        expect(within(list).queryByRole('group')).toBeNull()
        expect(within(list).getByRole('button', { name: 'Add contact' })).toHaveAttribute(
            'type',
            'button',
        )
    })

    it('appends an item seeded with the item fields defaults, without submitting', async () => {
        const form = mount(contactsConfig)
        fireEvent.click(form.view.getByRole('button', { name: 'Add contact' }))

        await waitFor(() => expect(form.input('contacts.0.name')).not.toBeNull())
        expect(form.input('contacts.0.name')?.value).toBe('')
        expect(form.onSubmit).not.toHaveBeenCalled()

        form.type('team', 'Ops')
        form.type('contacts.0.name', 'Ada')
        form.type('contacts.0.email', 'ada@example.com')
        form.submit()

        await waitFor(() => expect(form.onSubmit).toHaveBeenCalled())
        expect(form.onSubmit.mock.calls[0][0]).toEqual({
            team: 'Ops',
            contacts: [{ name: 'Ada', email: 'ada@example.com' }],
        })
    })

    it('removes the item whose remove control was used', async () => {
        const form = mount(twoContacts)
        const first = form.view.getByRole('group', { name: 'Contact 1' })
        fireEvent.click(within(first).getByRole('button', { name: 'Remove' }))

        await waitFor(() =>
            expect(form.view.queryByRole('group', { name: 'Contact 2' })).toBeNull(),
        )
        expect(form.input('contacts.0.name')?.value).toBe('Grace')
        form.submit()

        await waitFor(() => expect(form.onSubmit).toHaveBeenCalled())
        expect(form.onSubmit.mock.calls[0][0]).toEqual({
            team: '',
            contacts: [{ name: 'Grace', email: 'grace@example.com' }],
        })
    })

    it('blocks a submit on an empty required item field and shows the error on that item', async () => {
        const form = mount(contactsConfig)
        fireEvent.click(form.view.getByRole('button', { name: 'Add contact' }))
        await waitFor(() => expect(form.input('contacts.0.name')).not.toBeNull())
        form.submit()

        const item = form.view.getByRole('group', { name: 'Contact 1' })
        await waitFor(() =>
            expect(item.querySelector('.custom-field-message--error')?.textContent).toBe(
                'This field is required',
            ),
        )
        expect(form.onSubmit).not.toHaveBeenCalled()
    })

    it('marks a required item field as required in every item', () => {
        const form = mount(twoContacts)

        for (const name of ['Contact 1', 'Contact 2']) {
            const labels = Array.from(
                form.view.getByRole('group', { name }).querySelectorAll('label'),
            )
            expect(
                labels
                    .find((l) => l.textContent?.startsWith('Name'))
                    ?.querySelector('.required-mark'),
            ).not.toBeNull()
            expect(
                labels
                    .find((l) => l.textContent?.startsWith('Email'))
                    ?.querySelector('.required-mark'),
            ).toBeNull()
        }
    })

    it('shows an item field by a sibling inside its own item', async () => {
        const form = mount([
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
        ])
        expect(form.input('items.1.note')).toBeNull()

        fireEvent.click(
            within(form.view.getByRole('group', { name: 'Item 2' })).getByRole('checkbox'),
        )
        await waitFor(() => expect(form.input('items.1.note')).not.toBeNull())
        expect(form.input('items.0.note')).toBeNull()
    })

    it('shows a conditional array only while its sibling matches and drops it on hide', async () => {
        const form = mount([
            { name: 'hasGuests', type: 'checkbox', label: 'Bringing guests' },
            {
                name: 'guests',
                type: 'array',
                label: 'Guests',
                itemLabel: 'Guest',
                showWhen: { field: 'hasGuests', is: true },
                fields: [{ name: 'name', type: 'text', label: 'Name', validation: ['required'] }],
            },
        ])
        const toggle = () => fireEvent.click(form.view.getByRole('checkbox'))
        expect(form.view.queryByRole('group', { name: 'Guests' })).toBeNull()

        toggle()
        await waitFor(() =>
            expect(form.view.getByRole('button', { name: 'Add' })).toBeInTheDocument(),
        )
        fireEvent.click(form.view.getByRole('button', { name: 'Add' }))
        await waitFor(() => expect(form.input('guests.0.name')).not.toBeNull())
        const labels = Array.from(
            form.view.getByRole('group', { name: 'Guest 1' }).querySelectorAll('label'),
        )
        expect(
            labels.find((l) => l.textContent?.startsWith('Name'))?.querySelector('.required-mark'),
        ).not.toBeNull()

        toggle()
        await waitFor(() => expect(form.view.queryByRole('group', { name: 'Guests' })).toBeNull())
        form.submit()
        await waitFor(() => expect(form.onSubmit).toHaveBeenCalled())
        expect(form.onSubmit.mock.calls[0][0]).toEqual({ hasGuests: false })
    })
})

describe('the array renderers in a registry', () => {
    it('falls back to the native renderers when a registry names neither', () => {
        expect(resolveArrayRenderer({ fallback: NativeFieldRenderer })).toBe(NativeArrayRenderer)
        expect(resolveArrayItemRenderer({ fallback: NativeFieldRenderer })).toBe(
            NativeArrayItemRenderer,
        )
    })

    it('renders the list and each item through the registry, fields through byType', async () => {
        const List: ArrayRenderer = ({ array, children, append, count }) => (
            <section data-testid={`list-${array.name}`}>
                {children}
                <button type="button" onClick={append}>
                    {`New (${count})`}
                </button>
            </section>
        )
        const Item: ArrayItemRenderer = ({ item, children }) => (
            <div data-testid={`item-${item.name}`}>
                {children}
                <button type="button" onClick={item.moveDown} disabled={item.isLast}>
                    {`Down ${item.index + 1}`}
                </button>
            </div>
        )
        const Tagged: FieldRendererRegistry['fallback'] = ({ field, required }) => (
            <div data-testid={`field-${field.name}`}>
                <NativeFieldRenderer field={field} required={required} />
            </div>
        )
        const form = mount(twoContacts, {
            fallback: NativeFieldRenderer,
            byType: { text: Tagged },
            array: List,
            arrayItem: Item,
        })

        const list = form.view.getByTestId('list-contacts')
        expect(within(list).getByTestId('item-contacts.1')).toBeInTheDocument()
        expect(within(list).getByTestId('field-contacts.0.name')).toBeInTheDocument()
        expect(form.container.querySelector('fieldset')).toBeNull()
        expect(within(list).getByRole('button', { name: 'New (2)' })).toBeInTheDocument()

        fireEvent.click(within(list).getByRole('button', { name: 'Down 1' }))
        await waitFor(() => expect(form.input('contacts.0.name')?.value).toBe('Grace'))

        fireEvent.click(within(list).getByRole('button', { name: 'New (2)' }))
        await waitFor(() => expect(form.input('contacts.2.name')).not.toBeNull())
        form.type('contacts.2.name', 'Edsger')
        form.type('contacts.2.email', 'edsger@example.com')
        form.submit()

        await waitFor(() => expect(form.onSubmit).toHaveBeenCalled())
        expect(form.onSubmit.mock.calls[0][0]).toEqual({
            team: '',
            contacts: [
                { name: 'Grace', email: 'grace@example.com' },
                { name: 'Ada', email: 'ada@example.com' },
                { name: 'Edsger', email: 'edsger@example.com' },
            ],
        })
    })

    it('renders a group inside an item through the registry group renderer', () => {
        const form = mount(
            [
                {
                    name: 'lines',
                    type: 'array',
                    defaultValue: [{}],
                    fields: [
                        {
                            name: 'product',
                            type: 'group',
                            fields: [{ name: 'sku', type: 'text', label: 'SKU' }],
                        },
                    ],
                },
            ],
            {
                fallback: NativeFieldRenderer,
                group: ({ group, children }) => (
                    <section data-testid={`group-${group.name}`}>{children}</section>
                ),
            },
        )

        const group = form.view.getByTestId('group-lines.0.product')
        expect(group.querySelector('input[name="lines.0.product.sku"]')).not.toBeNull()
    })
})
