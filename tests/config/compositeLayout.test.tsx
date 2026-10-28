// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, renderHook, fireEvent, waitFor, within } from '@testing-library/react'
import { z } from 'zod'
import { BasicForm } from '../../src/form'
import { CompositeField, FormField } from '../../src/field'
import {
    ConfigFields,
    NativeFieldRenderer,
    NativeGroupRenderer,
    buildSchema,
    resolveGroupRenderer,
    useFormFromConfig,
} from '../../src/config'
import type { FieldRendererRegistry, FormConfig, GroupRenderer } from '../../src/config'

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
        toggle: () => fireEvent.click(view.getByRole('checkbox')),
        submit: () => fireEvent.click(view.getByRole('button', { name: 'Submit' })),
    }
}

const addressConfig: FormConfig = [
    { name: 'fullName', type: 'text', label: 'Full name' },
    {
        name: 'address',
        type: 'group',
        label: 'Address',
        description: 'Where the order is delivered',
        fields: [
            { name: 'city', type: 'text', label: 'City', validation: ['required'] },
            { name: 'postcode', type: 'text', label: 'Postcode' },
        ],
    },
]

describe('a config group on the native renderer', () => {
    it('renders its children inside a fieldset named by its label', () => {
        const form = mount(addressConfig)

        const group = form.view.getByRole('group', { name: 'Address' })
        expect(group.tagName).toBe('FIELDSET')
        expect(group.querySelector('input[name="address.city"]')).not.toBeNull()
        expect(group.querySelector('input[name="address.postcode"]')).not.toBeNull()
        expect(group.querySelector('input[name="fullName"]')).toBeNull()
    })

    it('describes the fieldset with the group description', () => {
        const form = mount(addressConfig)

        expect(form.view.getByRole('group', { name: 'Address' })).toHaveAccessibleDescription(
            'Where the order is delivered',
        )
    })

    it('stacks its children by default and lays them out in a row on request', () => {
        const stacked = mount(addressConfig)
        expect(stacked.view.getByRole('group', { name: 'Address' })).toHaveClass('fk-group--stack')
        stacked.container.remove()

        const row = mount([
            {
                name: 'range',
                type: 'group',
                label: 'Dates',
                layout: 'row',
                fields: [
                    { name: 'from', type: 'date', label: 'From' },
                    { name: 'to', type: 'date', label: 'To' },
                ],
            },
        ])
        expect(row.view.getByRole('group', { name: 'Dates' })).toHaveClass('fk-group--row')
    })

    it('still submits the children as one nested value', async () => {
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
})

describe('a config group with showWhen', () => {
    const config: FormConfig = [
        { name: 'shipToOther', type: 'checkbox', label: 'Ship somewhere else' },
        {
            name: 'shipping',
            type: 'group',
            label: 'Shipping address',
            showWhen: { field: 'shipToOther', is: true },
            fields: [
                { name: 'city', type: 'text', label: 'City', validation: ['required'] },
                { name: 'postcode', type: 'text', label: 'Postcode' },
            ],
        },
    ]

    it('validates the group only while its condition holds', () => {
        const schema = buildSchema(config)

        expect(
            schema.safeParse({ shipToOther: false, shipping: { city: '', postcode: '' } }).success,
        ).toBe(true)
        const result = schema.safeParse({
            shipToOther: true,
            shipping: { city: '', postcode: '' },
        })
        expect(result.success).toBe(false)
        expect(result.error?.issues.map((i) => i.path)).toEqual([['shipping', 'city']])
    })

    it('accepts a hidden group whose value was dropped', () => {
        expect(buildSchema(config).safeParse({ shipToOther: false }).success).toBe(true)
    })

    it('shows the group while the sibling matches and hides it otherwise', async () => {
        const form = mount(config)
        expect(form.view.queryByRole('group', { name: 'Shipping address' })).toBeNull()

        form.toggle()
        await waitFor(() =>
            expect(form.view.getByRole('group', { name: 'Shipping address' })).toBeInTheDocument(),
        )
    })

    it('blocks a submit on an empty required child while the group shows', async () => {
        const form = mount(config)
        form.toggle()
        await waitFor(() => expect(form.input('shipping.city')).not.toBeNull())
        form.submit()

        await waitFor(() =>
            expect(form.container.querySelector('.custom-field-message--error')?.textContent).toBe(
                'This field is required',
            ),
        )
        expect(form.onSubmit).not.toHaveBeenCalled()
    })

    it('marks a required child of a conditional group as required', async () => {
        const form = mount(config)
        form.toggle()

        await waitFor(() => expect(form.input('shipping.city')).not.toBeNull())
        const group = form.view.getByRole('group', { name: 'Shipping address' })
        const labels = Array.from(group.querySelectorAll('label'))
        const city = labels.find((l) => l.textContent?.startsWith('City'))
        const postcode = labels.find((l) => l.textContent?.startsWith('Postcode'))
        expect(city?.querySelector('.required-mark')).not.toBeNull()
        expect(postcode?.querySelector('.required-mark')).toBeNull()
    })

    it('drops the group value when it hides, so the submit passes without it', async () => {
        const form = mount(config)
        form.toggle()
        await waitFor(() => expect(form.input('shipping.city')).not.toBeNull())
        form.type('shipping.postcode', 'LS1')

        form.toggle()
        await waitFor(() => expect(form.input('shipping.city')).toBeNull())
        form.submit()

        await waitFor(() => expect(form.onSubmit).toHaveBeenCalled())
        expect(form.onSubmit.mock.calls[0][0]).toEqual({ shipToOther: false })
    })

    it('rebuilds the schema when the group condition changes', () => {
        const { result, rerender } = renderHook(
            ({ is }) =>
                useFormFromConfig([
                    { name: 'kind', type: 'text' },
                    {
                        name: 'extra',
                        type: 'group',
                        showWhen: { field: 'kind', is },
                        fields: [{ name: 'note', type: 'text', validation: ['required'] }],
                    },
                ]),
            { initialProps: { is: 'a' } },
        )
        const value = { kind: 'b', extra: { note: '' } }
        expect(result.current.schema.safeParse(value).success).toBe(true)

        rerender({ is: 'b' })
        expect(result.current.schema.safeParse(value).success).toBe(false)
    })
})

describe('the group renderer in a registry', () => {
    it('falls back to the native fieldset when a registry names no group renderer', () => {
        expect(resolveGroupRenderer({ fallback: NativeFieldRenderer })).toBe(NativeGroupRenderer)
    })

    it('renders a group through the registry group renderer when it has one', () => {
        const Boxed: GroupRenderer = ({ group, children }) => (
            <section data-testid={`group-${group.name}`}>{children}</section>
        )
        const form = mount(
            [
                {
                    name: 'outer',
                    type: 'group',
                    fields: [
                        { name: 'inner', type: 'group', fields: [{ name: 'x', type: 'text' }] },
                    ],
                },
            ],
            { fallback: NativeFieldRenderer, group: Boxed },
        )

        const outer = form.view.getByTestId('group-outer')
        const inner = within(outer).getByTestId('group-outer.inner')
        expect(inner.querySelector('input[name="outer.inner.x"]')).not.toBeNull()
        expect(form.container.querySelector('fieldset')).toBeNull()
    })
})

describe('CompositeField in a hand-written form', () => {
    const schema = z.object({
        range: z.object({ from: z.string().min(1), to: z.string().min(1) }),
    })

    const mountJsx = () => {
        const onSubmit = vi.fn()
        const { container } = render(
            <BasicForm
                onSubmit={onSubmit}
                validationSchema={schema}
                defaultValues={{ range: { from: '', to: '' } }}
            >
                <CompositeField name="range" label="Stay" description="Both dates" layout="row">
                    {({ name }) => (
                        <>
                            <FormField name={`${name}.from`} type="text" label="From" />
                            <FormField name={`${name}.to`} type="text" label="To" />
                        </>
                    )}
                </CompositeField>
                <button type="submit">Submit</button>
            </BasicForm>,
        )
        return { container, onSubmit, view: within(container) }
    }

    it('wraps its children in a labelled, described fieldset', () => {
        const { view } = mountJsx()
        const group = view.getByRole('group', { name: 'Stay' })

        expect(group).toHaveAccessibleDescription('Both dates')
        expect(group).toHaveClass('fk-group--row')
        expect(group.querySelector('input[name="range.from"]')).not.toBeNull()
    })

    it('submits its children as one nested value', async () => {
        const { container, onSubmit, view } = mountJsx()
        const field = (n: string) =>
            container.querySelector(`input[name="${n}"]`) as HTMLInputElement
        fireEvent.change(field('range.from'), { target: { value: '2026-03-01' } })
        fireEvent.change(field('range.to'), { target: { value: '2026-03-04' } })
        fireEvent.click(view.getByRole('button', { name: 'Submit' }))

        await waitFor(() => expect(onSubmit).toHaveBeenCalled())
        expect(onSubmit.mock.calls[0][0]).toEqual({
            range: { from: '2026-03-01', to: '2026-03-04' },
        })
    })

    it('takes plain children as well as a render function', () => {
        const { container } = render(
            <BasicForm onSubmit={vi.fn()} defaultValues={{ a: { b: '' } }}>
                <CompositeField name="a" label="A">
                    <FormField name="a.b" type="text" label="B" />
                </CompositeField>
            </BasicForm>,
        )
        const group = within(container).getByRole('group', { name: 'A' })
        expect(group.querySelector('input[name="a.b"]')).not.toBeNull()
    })
})
