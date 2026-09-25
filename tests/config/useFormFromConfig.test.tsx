// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, renderHook, fireEvent, waitFor } from '@testing-library/react'
import { useFormFromConfig } from '../../src/config/useFormFromConfig'
import { ConfigFields } from '../../src/config'
import { BasicForm } from '../../src/form'
import type { FormConfig } from '../../src/config/config.types'

const nickConfig = (min: number): FormConfig => [
    { name: 'nick', type: 'text', validation: [{ rule: 'minLength', value: min }] },
]

const cityConfig = (city: string): FormConfig => [
    { name: 'city', type: 'text', defaultValue: city },
]

describe('useFormFromConfig', () => {
    it('derives defaults, fields, and a schema from config', () => {
        const config: FormConfig = [
            { name: 'name', type: 'text', validation: ['required'] },
            { name: 'subscribe', type: 'checkbox' },
        ]
        const { result } = renderHook(() => useFormFromConfig(config))

        expect(result.current.fields).toHaveLength(2)
        expect(result.current.defaults).toEqual({ name: '', subscribe: false })
        expect(result.current.schema.safeParse({ name: 'Ada', subscribe: false }).success).toBe(
            true,
        )
    })

    it('throws on duplicate field names', () => {
        const config: FormConfig = [
            { name: 'email', type: 'email' },
            { name: 'email', type: 'text' },
        ]
        expect(() => renderHook(() => useFormFromConfig(config))).toThrow(/duplicate field name/i)
    })
})

describe('useFormFromConfig - config changes', () => {
    it('rebuilds the schema when a rule changes under the same name and type', () => {
        const { result, rerender } = renderHook(({ min }) => useFormFromConfig(nickConfig(min)), {
            initialProps: { min: 2 },
        })
        expect(result.current.schema.safeParse({ nick: 'abc' }).success).toBe(true)

        rerender({ min: 8 })
        expect(result.current.schema.safeParse({ nick: 'abc' }).success).toBe(false)
    })

    it('rebuilds the defaults when a defaultValue changes', () => {
        const { result, rerender } = renderHook(({ city }) => useFormFromConfig(cityConfig(city)), {
            initialProps: { city: 'Paris' },
        })
        expect(result.current.defaults).toEqual({ city: 'Paris' })

        rerender({ city: 'Berlin' })
        expect(result.current.defaults).toEqual({ city: 'Berlin' })
    })

    it('rebuilds the schema when a pattern changes', () => {
        const { result, rerender } = renderHook(
            ({ re }) =>
                useFormFromConfig([
                    { name: 'code', type: 'text', validation: [{ rule: 'pattern', value: re }] },
                ]),
            { initialProps: { re: /^a+$/ } },
        )
        expect(result.current.schema.safeParse({ code: 'aaa' }).success).toBe(true)

        rerender({ re: /^b+$/ })
        expect(result.current.schema.safeParse({ code: 'aaa' }).success).toBe(false)
    })

    it('rebuilds the schema when a showWhen condition changes', () => {
        const { result, rerender } = renderHook(
            ({ is }) =>
                useFormFromConfig([
                    { name: 'mode', type: 'text' },
                    {
                        name: 'street',
                        type: 'text',
                        validation: ['required'],
                        showWhen: { field: 'mode', is },
                    },
                ]),
            { initialProps: { is: 'post' } },
        )
        expect(result.current.schema.safeParse({ mode: 'pickup', street: '' }).success).toBe(true)

        rerender({ is: 'pickup' })
        expect(result.current.schema.safeParse({ mode: 'pickup', street: '' }).success).toBe(false)
    })

    it('keeps the same defaults and schema for a fresh config with identical content', () => {
        const { result, rerender } = renderHook(() =>
            useFormFromConfig([
                {
                    name: 'nick',
                    type: 'text',
                    validation: ['required', { rule: 'pattern', value: /x/ }],
                },
                { name: 'city', type: 'text', defaultValue: 'Paris' },
            ]),
        )
        const first = result.current

        rerender()
        expect(result.current.defaults).toBe(first.defaults)
        expect(result.current.schema).toBe(first.schema)
    })

    it('keeps the schema for the same predicate and rebuilds it for a different one', () => {
        const always = () => true
        const never = () => false
        const { result, rerender } = renderHook(
            ({ test }) =>
                useFormFromConfig([
                    { name: 'mode', type: 'text' },
                    {
                        name: 'street',
                        type: 'text',
                        validation: ['required'],
                        showWhen: { field: 'mode', test },
                    },
                ]),
            { initialProps: { test: never } },
        )
        const first = result.current.schema
        expect(first.safeParse({ mode: '', street: '' }).success).toBe(true)

        rerender({ test: never })
        expect(result.current.schema).toBe(first)

        rerender({ test: always })
        expect(result.current.schema.safeParse({ mode: '', street: '' }).success).toBe(false)
    })

    it('does not rebuild the defaults when only a rule changes', () => {
        const { result, rerender } = renderHook(({ min }) => useFormFromConfig(nickConfig(min)), {
            initialProps: { min: 2 },
        })
        const first = result.current.defaults

        rerender({ min: 8 })
        expect(result.current.defaults).toBe(first)
    })
})

describe('useFormFromConfig - inside a form', () => {
    const Harness: React.FC<{ min: number; onSubmit: (v: unknown) => void }> = ({
        min,
        onSubmit,
    }) => {
        const { defaults, fields, schema } = useFormFromConfig(nickConfig(min))
        return (
            <BasicForm onSubmit={onSubmit} validationSchema={schema} defaultValues={defaults}>
                <ConfigFields config={fields} />
                <button type="submit">Submit</button>
            </BasicForm>
        )
    }

    const input = (container: HTMLElement) =>
        container.querySelector('.custom-text-input input') as HTMLInputElement

    it('keeps typed values when the config is recreated with identical content', () => {
        const { container, rerender } = render(<Harness min={2} onSubmit={vi.fn()} />)
        fireEvent.change(input(container), { target: { value: 'typed' } })

        rerender(<Harness min={2} onSubmit={vi.fn()} />)
        expect(input(container).value).toBe('typed')
    })

    it('validates a submit against the tightened rule without losing what was typed', async () => {
        const onSubmit = vi.fn()
        const { container, getByRole, rerender } = render(<Harness min={2} onSubmit={onSubmit} />)
        fireEvent.change(input(container), { target: { value: 'abc' } })

        rerender(<Harness min={8} onSubmit={onSubmit} />)
        expect(input(container).value).toBe('abc')
        fireEvent.click(getByRole('button', { name: 'Submit' }))

        await waitFor(() =>
            expect(container.querySelector('.custom-field-message--error')).not.toBeNull(),
        )
        expect(onSubmit).not.toHaveBeenCalled()
    })

    it('does not reseed a mounted form when a defaultValue changes', () => {
        const City: React.FC<{ city: string }> = ({ city }) => {
            const { defaults, fields, schema } = useFormFromConfig(cityConfig(city))
            return (
                <BasicForm onSubmit={vi.fn()} validationSchema={schema} defaultValues={defaults}>
                    <ConfigFields config={fields} />
                </BasicForm>
            )
        }
        const { container, rerender } = render(<City city="Paris" />)
        expect(input(container).value).toBe('Paris')

        rerender(<City city="Berlin" />)
        expect(input(container).value).toBe('Paris')
    })
})
