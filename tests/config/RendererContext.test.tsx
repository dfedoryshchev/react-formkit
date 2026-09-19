// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BasicForm } from '../../src/form'
import { FormField } from '../../src/field'
import {
    ConfigFields,
    NativeFieldRenderer,
    RendererProvider,
    nativeRenderers,
    useFieldRenderers,
    useFormFromConfig,
} from '../../src/config'
import type { FieldRenderer, FieldRendererRegistry, FormConfig } from '../../src/config'

const tagged =
    (tag: string): FieldRenderer =>
    ({ field, required }) => (
        <p
            data-testid={field.name}
        >{`${tag}:${field.type}:${required === true ? 'req' : 'free'}`}</p>
    )

const outer: FieldRendererRegistry = {
    fallback: tagged('outer'),
    byType: { select: tagged('outer-select') },
}
const inner: FieldRendererRegistry = { fallback: tagged('inner') }

const config: FormConfig = [
    { name: 'nickname', type: 'text', label: 'Nickname', validation: ['required'] },
    { name: 'country', type: 'select', label: 'Country', options: [{ value: 'uk', label: 'UK' }] },
]

const Harness: React.FC<{
    config: FormConfig
    onSubmit?: (values: Record<string, unknown>) => void
    children: (fields: FormConfig) => React.ReactNode
}> = ({ config: cfg, onSubmit = () => {}, children }) => {
    const { defaults, fields, schema } = useFormFromConfig(cfg)
    return (
        <BasicForm onSubmit={onSubmit} validationSchema={schema} defaultValues={defaults}>
            {children(fields)}
            <button type="submit">Submit</button>
        </BasicForm>
    )
}

describe('ConfigFields without a provider', () => {
    it('still renders real controls, so the seam changes nothing by default', () => {
        render(<Harness config={config}>{(fields) => <ConfigFields config={fields} />}</Harness>)
        expect(screen.getByLabelText(/^Nickname/)).toBeInTheDocument()
        expect(screen.getByLabelText(/^Country/)).toBeInTheDocument()
    })

    it('reads the native registry out of context', () => {
        const Probe: React.FC = () => {
            const registry = useFieldRenderers()
            return <p>{registry.fallback === NativeFieldRenderer ? 'native' : 'other'}</p>
        }
        render(<Probe />)
        expect(screen.getByText('native')).toBeInTheDocument()
        expect(nativeRenderers.byType).toBeUndefined()
    })
})

describe('RendererProvider', () => {
    it('sends every field to the provided fallback', () => {
        render(
            <Harness config={config}>
                {(fields) => (
                    <RendererProvider renderers={{ fallback: tagged('custom') }}>
                        <ConfigFields config={fields} />
                    </RendererProvider>
                )}
            </Harness>,
        )
        expect(screen.getByTestId('nickname')).toHaveTextContent('custom:text')
        expect(screen.getByTestId('country')).toHaveTextContent('custom:select')
        expect(screen.queryByLabelText(/^Nickname/)).toBeNull()
    })

    it('routes only the types byType names, leaving the rest on the fallback', () => {
        render(
            <Harness config={config}>
                {(fields) => (
                    <RendererProvider renderers={outer}>
                        <ConfigFields config={fields} />
                    </RendererProvider>
                )}
            </Harness>,
        )
        expect(screen.getByTestId('country')).toHaveTextContent('outer-select:select')
        expect(screen.getByTestId('nickname')).toHaveTextContent('outer:text')
    })

    it('replaces a registry above it instead of merging with it', () => {
        render(
            <Harness config={config}>
                {(fields) => (
                    <RendererProvider renderers={outer}>
                        <RendererProvider renderers={inner}>
                            <ConfigFields config={fields} />
                        </RendererProvider>
                    </RendererProvider>
                )}
            </Harness>,
        )
        expect(screen.getByTestId('country')).toHaveTextContent('inner:select')
    })
})

describe('the renderers prop on ConfigFields', () => {
    it('wins over the provider for that one list', () => {
        render(
            <Harness config={config}>
                {(fields) => (
                    <RendererProvider renderers={outer}>
                        <ConfigFields config={fields} renderers={{ fallback: tagged('local') }} />
                    </RendererProvider>
                )}
            </Harness>,
        )
        expect(screen.getByTestId('country')).toHaveTextContent('local:select')
        expect(screen.getByTestId('nickname')).toHaveTextContent('local:text')
    })
})

// The shape the docs recommend: decorate around FormField rather than paint an
// input, so the field stays registered with react-hook-form.
const BoxedText: FieldRenderer = ({ field, required }) => (
    <div data-testid={`boxed-${field.name}`}>
        <FormField name={field.name} type={field.type} label={field.label} required={required} />
    </div>
)

describe('a renderer that wraps FormField', () => {
    it('keeps the field registered, so what is typed into it reaches the payload', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn()
        render(
            <Harness
                config={[{ name: 'nickname', type: 'text', label: 'Nickname' }]}
                onSubmit={onSubmit}
            >
                {(fields) => <ConfigFields config={fields} renderers={{ fallback: BoxedText }} />}
            </Harness>,
        )

        expect(screen.getByTestId('boxed-nickname')).toBeInTheDocument()
        await user.type(screen.getByLabelText(/^Nickname/), 'ada')
        await user.click(screen.getByRole('button', { name: 'Submit' }))

        await waitFor(() => expect(onSubmit).toHaveBeenCalled())
        expect(onSubmit.mock.calls[0][0]).toMatchObject({ nickname: 'ada' })
    })
})

const conditional: FormConfig = [
    { name: 'hasAddress', type: 'checkbox', label: 'I have a mailing address' },
    {
        name: 'street',
        type: 'text',
        label: 'Street',
        validation: ['required'],
        showWhen: { field: 'hasAddress', is: true },
    },
]

// The checkbox stays native so the condition can actually be toggled; the field
// under the condition is the one that goes through the custom renderer.
const mixed: FieldRendererRegistry = {
    fallback: tagged('custom'),
    byType: { checkbox: NativeFieldRenderer },
}

describe('a custom renderer and showWhen', () => {
    const renderConditional = () =>
        render(
            <Harness config={conditional}>
                {(fields) => (
                    <RendererProvider renderers={mixed}>
                        <ConfigFields config={fields} />
                    </RendererProvider>
                )}
            </Harness>,
        )

    it('is shown and hidden by ConfigFields, not by the renderer', () => {
        renderConditional()
        expect(screen.queryByTestId('street')).toBeNull()
        fireEvent.click(screen.getByRole('checkbox'))
        expect(screen.getByTestId('street')).toBeInTheDocument()
    })

    it('receives the required marker a lenient conditional schema key cannot supply', () => {
        renderConditional()
        fireEvent.click(screen.getByRole('checkbox'))
        expect(screen.getByTestId('street')).toHaveTextContent('custom:text:req')
    })
})
