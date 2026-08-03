// @vitest-environment jsdom
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

describe('ConditionalField - clearing values on hide', () => {
    const renderWithClear = (clear?: string) =>
        render(
            <BasicForm
                onSubmit={() => {}}
                validationSchema={schema}
                defaultValues={{ hasAddress: false, street: '' }}
            >
                <FormField name="hasAddress" type="checkbox" label="I have a mailing address" />
                <ConditionalField when="hasAddress" is={true} clear={clear}>
                    <FormField name="street" type="text" label="Street" />
                </ConditionalField>
            </BasicForm>,
        )

    it('clears the named value when the branch hides, so a reopened branch starts empty', () => {
        renderWithClear('street')
        fireEvent.click(screen.getByRole('checkbox'))
        fireEvent.change(screen.getByLabelText('Street'), { target: { value: 'Elm Street' } })
        expect(screen.getByLabelText('Street')).toHaveValue('Elm Street')

        fireEvent.click(screen.getByRole('checkbox'))
        expect(screen.queryByLabelText('Street')).not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('checkbox'))
        expect(screen.getByLabelText('Street')).toHaveValue('')
    })

    it('keeps the value when no clear prop is given, so the default stays backwards compatible', () => {
        renderWithClear(undefined)
        fireEvent.click(screen.getByRole('checkbox'))
        fireEvent.change(screen.getByLabelText('Street'), { target: { value: 'Elm Street' } })

        fireEvent.click(screen.getByRole('checkbox'))
        fireEvent.click(screen.getByRole('checkbox'))
        expect(screen.getByLabelText('Street')).toHaveValue('Elm Street')
    })

    it('does not clear while the branch stays visible', () => {
        renderWithClear('street')
        fireEvent.click(screen.getByRole('checkbox'))
        fireEvent.change(screen.getByLabelText('Street'), { target: { value: 'Elm Street' } })
        expect(screen.getByLabelText('Street')).toHaveValue('Elm Street')
    })
})

describe('config-driven conditional fields - clearing', () => {
    it('clears a conditional value automatically, without the config asking for it', () => {
        render(<ConfigHarness />)
        fireEvent.click(screen.getByRole('checkbox'))
        fireEvent.change(screen.getByLabelText('Street'), { target: { value: 'Elm Street' } })

        fireEvent.click(screen.getByRole('checkbox'))
        fireEvent.click(screen.getByRole('checkbox'))
        expect(screen.getByLabelText('Street')).toHaveValue('')
    })
})

describe('conditional fields and the submitted payload', () => {
    it('omits a cleared branch from the submitted values instead of sending it empty', async () => {
        const onSubmit = vi.fn()
        const Harness: React.FC = () => {
            const { defaults, fields, schema: derived } = useFormFromConfig(config)
            return (
                <BasicForm onSubmit={onSubmit} validationSchema={derived} defaultValues={defaults}>
                    <ConfigFields config={fields} />
                    <button type="submit">Submit</button>
                </BasicForm>
            )
        }
        render(<Harness />)

        fireEvent.click(screen.getByRole('checkbox'))
        fireEvent.change(screen.getByLabelText('Street'), { target: { value: 'Elm Street' } })
        fireEvent.click(screen.getByRole('checkbox'))
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

        await waitFor(() => expect(onSubmit).toHaveBeenCalled())
        // Positive half first, so the negative assertion cannot pass vacuously.
        expect(onSubmit.mock.calls[0][0]).toHaveProperty('hasAddress', false)
        expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('street')
    })
})
