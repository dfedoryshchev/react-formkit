// @vitest-environment jsdom
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { z } from 'zod'
import { BasicForm } from '../../src/form'
import { FormField, ConditionalField } from '../../src/field'
import { ConfigFields, useFormFromConfig } from '../../src/config'
import type { FormConfig } from '../../src/config'

const schema = z.object({
    hasAddress: z.boolean(),
    street: z.string().nullish(),
})

type Predicate = {
    is?: unknown
    isNot?: unknown
    test?: (value: unknown) => boolean
}

const renderConditional = (predicate: Predicate) =>
    render(
        <BasicForm
            onSubmit={() => {}}
            validationSchema={schema}
            defaultValues={{ hasAddress: false, street: '' }}
        >
            <FormField name="hasAddress" type="checkbox" label="I have a mailing address" />
            <ConditionalField when="hasAddress" {...predicate}>
                <FormField name="street" type="text" label="Street" />
            </ConditionalField>
        </BasicForm>,
    )

describe('ConditionalField', () => {
    it('hides its children while the watched field does not match', () => {
        renderConditional({ is: true })
        expect(screen.queryByText('Street')).not.toBeInTheDocument()
    })

    it('reveals its children when the watched field changes to a match', () => {
        renderConditional({ is: true })
        fireEvent.click(screen.getByRole('checkbox'))
        expect(screen.getByText('Street')).toBeInTheDocument()
    })

    it('inverts the match with isNot', () => {
        renderConditional({ isNot: true })
        expect(screen.getByText('Street')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('checkbox'))
        expect(screen.queryByText('Street')).not.toBeInTheDocument()
    })

    it('accepts a custom predicate', () => {
        renderConditional({ test: (value) => value === false })
        expect(screen.getByText('Street')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('checkbox'))
        expect(screen.queryByText('Street')).not.toBeInTheDocument()
    })

    it('stays visible when no predicate is given', () => {
        renderConditional({})
        expect(screen.getByText('Street')).toBeInTheDocument()
    })
})

const config: FormConfig = [
    { name: 'hasAddress', type: 'checkbox', label: 'I have a mailing address' },
    {
        name: 'street',
        type: 'text',
        label: 'Street',
        showWhen: { field: 'hasAddress', is: true },
    },
]

const ConfigHarness: React.FC = () => {
    const { defaults, fields, schema: derived } = useFormFromConfig(config)
    return (
        <BasicForm onSubmit={() => {}} validationSchema={derived} defaultValues={defaults}>
            <ConfigFields config={fields} />
        </BasicForm>
    )
}

describe('config-driven conditional fields', () => {
    it('leaves a field out while its showWhen condition is unmet', () => {
        render(<ConfigHarness />)
        expect(screen.getByText('I have a mailing address')).toBeInTheDocument()
        expect(screen.queryByText('Street')).not.toBeInTheDocument()
    })

    it('renders the field once the watched value matches', () => {
        render(<ConfigHarness />)
        fireEvent.click(screen.getByRole('checkbox'))
        expect(screen.getByText('Street')).toBeInTheDocument()
    })
})
