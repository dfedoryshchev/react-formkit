// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BasicForm } from '../../src/form'
import { ConfigFields, useFormFromConfig } from '../../src/config'
import type { FieldConfig, FormConfig } from '../../src/config'
import { fieldRenderProps, resolveFieldRenderer } from '../../src/config/renderer'
import type { FieldRenderer, FieldRendererRegistry } from '../../src/config/renderer.types'

const fallback: FieldRenderer = ({ field }) => <p>{`fallback:${field.name}`}</p>
const selectRenderer: FieldRenderer = ({ field }) => <p>{`select:${field.name}`}</p>

const registry: FieldRendererRegistry = { fallback, byType: { select: selectRenderer } }

describe('resolveFieldRenderer', () => {
    it('picks the renderer the registry names for that field type', () => {
        expect(resolveFieldRenderer(registry, 'select')).toBe(selectRenderer)
    })

    it('falls back for a type the registry does not name', () => {
        expect(resolveFieldRenderer(registry, 'text')).toBe(fallback)
    })

    it('falls back when the registry names no types at all', () => {
        expect(resolveFieldRenderer({ fallback }, 'text')).toBe(fallback)
    })

    it('resolves to something renderable', () => {
        const Resolved = resolveFieldRenderer(registry, 'select')
        render(<Resolved field={{ name: 'country', type: 'select' }} />)
        expect(screen.getByText('select:country')).toBeInTheDocument()
    })
})

describe('fieldRenderProps', () => {
    it('hands the field through as the config wrote it', () => {
        const field: FieldConfig = { name: 'email', type: 'email', label: 'Email' }
        expect(fieldRenderProps(field).field).toBe(field)
    })

    it('leaves required undefined for an unconditional field, so the schema decides', () => {
        const field: FieldConfig = { name: 'email', type: 'email', validation: ['required'] }
        expect(fieldRenderProps(field).required).toBeUndefined()
    })

    it('marks a conditional field required from the config', () => {
        const field: FieldConfig = {
            name: 'street',
            type: 'text',
            validation: ['required'],
            showWhen: { field: 'hasAddress', is: true },
        }
        expect(fieldRenderProps(field).required).toBe(true)
    })

    it('marks a conditional field not required when the config does not ask for it', () => {
        const field: FieldConfig = {
            name: 'street',
            type: 'text',
            showWhen: { field: 'hasAddress', is: true },
        }
        expect(fieldRenderProps(field).required).toBe(false)
    })
})

const config: FormConfig = [
    { name: 'hasAddress', type: 'checkbox', label: 'I have a mailing address' },
    { name: 'nickname', type: 'text', label: 'Nickname', validation: ['required'] },
    {
        name: 'street',
        type: 'text',
        label: 'Street',
        validation: ['required'],
        showWhen: { field: 'hasAddress', is: true },
    },
]

const Harness: React.FC = () => {
    const { defaults, fields, schema } = useFormFromConfig(config)
    return (
        <BasicForm onSubmit={() => {}} validationSchema={schema} defaultValues={defaults}>
            <ConfigFields config={fields} />
        </BasicForm>
    )
}

describe('the required marker a config field is rendered with', () => {
    it('marks a visible conditional field required, which its lenient schema key cannot', () => {
        render(<Harness />)
        fireEvent.click(screen.getByRole('checkbox'))
        // The label carries the required mark, so match the name rather than
        // the whole label text.
        expect(screen.getByLabelText(/^Street/)).toHaveAttribute('aria-required', 'true')
    })

    it('leaves an unconditional field to the schema and still marks it', () => {
        render(<Harness />)
        expect(screen.getByLabelText(/^Nickname/)).toHaveAttribute('aria-required', 'true')
    })
})
