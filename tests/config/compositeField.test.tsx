// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, renderHook, fireEvent, waitFor, within } from '@testing-library/react'
import { BasicForm } from '../../src/form'
import { ConfigFields, buildSchema, useFormFromConfig } from '../../src/config'
import type { FormConfig } from '../../src/config'

const addressConfig: FormConfig = [
    { name: 'fullName', type: 'text', label: 'Full name' },
    {
        name: 'address',
        type: 'group',
        fields: [
            { name: 'city', type: 'text', label: 'City', validation: ['required'] },
            {
                name: 'postcode',
                type: 'text',
                label: 'Postcode',
                validation: [{ rule: 'minLength', value: 3 }],
            },
        ],
    },
]

describe('composite field - schema', () => {
    it('validates a group as a nested object', () => {
        const schema = buildSchema(addressConfig)

        expect(
            schema.safeParse({ fullName: 'Ada', address: { city: 'Leeds', postcode: 'LS1' } })
                .success,
        ).toBe(true)
        expect(schema.safeParse({ fullName: 'Ada', city: 'Leeds', postcode: 'LS1' }).success).toBe(
            false,
        )
    })

    it('reports a child error on the child path inside the group', () => {
        const result = buildSchema(addressConfig).safeParse({
            fullName: 'Ada',
            address: { city: '', postcode: 'LS1' },
        })

        expect(result.success).toBe(false)
        expect(result.error?.issues.map((i) => i.path)).toEqual([['address', 'city']])
    })

    it('nests groups inside groups', () => {
        const schema = buildSchema([
            {
                name: 'billing',
                type: 'group',
                fields: [
                    {
                        name: 'address',
                        type: 'group',
                        fields: [{ name: 'city', type: 'text', validation: ['required'] }],
                    },
                ],
            },
        ])

        expect(schema.safeParse({ billing: { address: { city: 'Leeds' } } }).success).toBe(true)
        const result = schema.safeParse({ billing: { address: { city: '' } } })
        expect(result.error?.issues[0].path).toEqual(['billing', 'address', 'city'])
    })

    it('scopes showWhen inside a group to its siblings', () => {
        const schema = buildSchema([
            {
                name: 'delivery',
                type: 'group',
                fields: [
                    { name: 'method', type: 'text' },
                    {
                        name: 'street',
                        type: 'text',
                        validation: ['required'],
                        showWhen: { field: 'method', is: 'post' },
                    },
                ],
            },
        ])

        expect(schema.safeParse({ delivery: { method: 'pickup', street: '' } }).success).toBe(true)
        const result = schema.safeParse({ delivery: { method: 'post', street: '' } })
        expect(result.error?.issues[0].path).toEqual(['delivery', 'street'])
    })
})

describe('composite field - engine', () => {
    it('seeds a group default as a nested object', () => {
        const { result } = renderHook(() =>
            useFormFromConfig([
                {
                    name: 'range',
                    type: 'group',
                    fields: [
                        { name: 'from', type: 'date', defaultValue: '2026-01-01' },
                        { name: 'to', type: 'date' },
                        { name: 'inclusive', type: 'checkbox' },
                    ],
                },
            ]),
        )

        expect(result.current.defaults).toEqual({
            range: { from: '2026-01-01', to: '', inclusive: false },
        })
    })

    it('rebuilds the schema when a rule inside a group changes', () => {
        const { result, rerender } = renderHook(
            ({ min }) =>
                useFormFromConfig([
                    {
                        name: 'address',
                        type: 'group',
                        fields: [
                            {
                                name: 'postcode',
                                type: 'text',
                                validation: [{ rule: 'minLength', value: min }],
                            },
                        ],
                    },
                ]),
            { initialProps: { min: 2 } },
        )
        expect(result.current.schema.safeParse({ address: { postcode: 'LS1' } }).success).toBe(true)

        rerender({ min: 5 })
        expect(result.current.schema.safeParse({ address: { postcode: 'LS1' } }).success).toBe(
            false,
        )
    })

    it('rebuilds the defaults when a default inside a group changes', () => {
        const { result, rerender } = renderHook(
            ({ city }) =>
                useFormFromConfig([
                    {
                        name: 'address',
                        type: 'group',
                        fields: [{ name: 'city', type: 'text', defaultValue: city }],
                    },
                ]),
            { initialProps: { city: 'Paris' } },
        )
        expect(result.current.defaults).toEqual({ address: { city: 'Paris' } })

        rerender({ city: 'Berlin' })
        expect(result.current.defaults).toEqual({ address: { city: 'Berlin' } })
    })

    it('allows the same child name in two groups', () => {
        const config: FormConfig = [
            { name: 'billing', type: 'group', fields: [{ name: 'city', type: 'text' }] },
            { name: 'shipping', type: 'group', fields: [{ name: 'city', type: 'text' }] },
        ]
        expect(() => renderHook(() => useFormFromConfig(config))).not.toThrow()
    })

    it('throws on a duplicate name inside a group, naming its path', () => {
        const config: FormConfig = [
            {
                name: 'address',
                type: 'group',
                fields: [
                    { name: 'city', type: 'text' },
                    { name: 'city', type: 'text' },
                ],
            },
        ]
        expect(() => renderHook(() => useFormFromConfig(config))).toThrow(
            'useFormFromConfig: duplicate field name(s): address.city',
        )
    })
})

describe('composite field - inside a form', () => {
    const Harness: React.FC<{ config: FormConfig; onSubmit: (v: unknown) => void }> = ({
        config,
        onSubmit,
    }) => {
        const { defaults, fields, schema } = useFormFromConfig(config)
        return (
            <BasicForm onSubmit={onSubmit} validationSchema={schema} defaultValues={defaults}>
                <ConfigFields config={fields} />
                <button type="submit">Submit</button>
            </BasicForm>
        )
    }

    const mount = (config: FormConfig) => {
        const onSubmit = vi.fn()
        const { container } = render(<Harness config={config} onSubmit={onSubmit} />)
        const input = (name: string) => {
            const el = container.querySelector<HTMLInputElement>(`input[name="${name}"]`)
            if (!el) throw new Error(`no input named ${name}`)
            return el
        }
        return {
            container,
            onSubmit,
            input,
            type: (name: string, value: string) =>
                fireEvent.change(input(name), { target: { value } }),
            submit: () => fireEvent.click(within(container).getByRole('button', { name: 'Submit' })),
        }
    }

    it('submits the children of a group as one nested value', async () => {
        const form = mount(addressConfig)
        form.type('fullName', 'Ada')
        form.type('address.city', 'Leeds')
        form.type('address.postcode', 'LS1')
        form.submit()

        await waitFor(() => expect(form.onSubmit).toHaveBeenCalled())
        expect(form.onSubmit.mock.calls[0][0]).toEqual({
            fullName: 'Ada',
            address: { city: 'Leeds', postcode: 'LS1' },
        })
    })

    it('shows a child error and blocks the submit', async () => {
        const form = mount(addressConfig)
        form.type('address.postcode', 'LS1')
        form.submit()

        await waitFor(() =>
            expect(form.container.querySelector('.custom-field-message--error')?.textContent).toBe(
                'This field is required',
            ),
        )
        expect(form.onSubmit).not.toHaveBeenCalled()
    })

    it('shows and hides a child on a sibling inside the same group', async () => {
        const form = mount([
            {
                name: 'delivery',
                type: 'group',
                fields: [
                    { name: 'method', type: 'text' },
                    {
                        name: 'street',
                        type: 'text',
                        validation: ['required'],
                        showWhen: { field: 'method', is: 'post' },
                    },
                ],
            },
        ])
        expect(form.container.querySelector('input[name="delivery.street"]')).toBeNull()

        form.type('delivery.method', 'post')
        await waitFor(() =>
            expect(form.container.querySelector('input[name="delivery.street"]')).not.toBeNull(),
        )
        form.type('delivery.street', 'High St')
        form.type('delivery.method', 'pickup')
        await waitFor(() =>
            expect(form.container.querySelector('input[name="delivery.street"]')).toBeNull(),
        )
        form.submit()

        await waitFor(() => expect(form.onSubmit).toHaveBeenCalled())
        expect(form.onSubmit.mock.calls[0][0]).toEqual({ delivery: { method: 'pickup' } })
    })
})
