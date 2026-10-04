// @vitest-environment jsdom
import React from 'react'
import { beforeAll, describe, it, expect, vi } from 'vitest'
import { render, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { BasicForm } from '../../src/form'
import {
    ConfigFields,
    NativeFieldRenderer,
    RendererProvider,
    useFormFromConfig,
} from '../../src/config'
import type { FormConfig } from '../../src/config'
import {
    MantineCheckboxRenderer,
    MantineDateRenderer,
    MantineNumberRenderer,
    MantineSelectRenderer,
    MantineTextRenderer,
    mantineRenderers,
} from '../../src/adapters/mantine'

// jsdom has no matchMedia, and MantineProvider calls it unguarded when it sets
// the colour scheme attribute on mount. It has no ResizeObserver either, which
// the ScrollArea inside a Select's dropdown constructs on mount.
beforeAll(() => {
    vi.stubGlobal(
        'ResizeObserver',
        class {
            observe() {}
            unobserve() {}
            disconnect() {}
        },
    )
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => false,
        }),
    })
})

const Harness: React.FC<{
    config: FormConfig
    onSubmit: (values: Record<string, unknown>) => void
}> = ({ config, onSubmit }) => {
    const { defaults, fields, schema } = useFormFromConfig(config)
    return (
        <MantineProvider env="test">
            <RendererProvider renderers={mantineRenderers}>
                <BasicForm onSubmit={onSubmit} validationSchema={schema} defaultValues={defaults}>
                    <ConfigFields config={fields} />
                    <button type="submit">Submit</button>
                </BasicForm>
            </RendererProvider>
        </MantineProvider>
    )
}

const mount = (config: FormConfig) => {
    const onSubmit = vi.fn()
    const { container } = render(<Harness config={config} onSubmit={onSubmit} />)
    const view = within(container)
    return {
        container,
        view,
        onSubmit,
        submit: () => fireEvent.click(view.getByRole('button', { name: 'Submit' })),
    }
}

describe('mantineRenderers', () => {
    it('routes text, numeric, select, checkbox and date to Mantine and leaves every other type on the native one', () => {
        expect(mantineRenderers.byType?.text).toBe(MantineTextRenderer)
        expect(mantineRenderers.byType?.numeric).toBe(MantineNumberRenderer)
        expect(mantineRenderers.byType?.select).toBe(MantineSelectRenderer)
        expect(mantineRenderers.byType?.checkbox).toBe(MantineCheckboxRenderer)
        expect(mantineRenderers.byType?.date).toBe(MantineDateRenderer)
        expect(Object.keys(mantineRenderers.byType ?? {}).sort()).toEqual([
            'checkbox',
            'date',
            'numeric',
            'select',
            'text',
        ])
        expect(mantineRenderers.fallback).toBe(NativeFieldRenderer)
    })
})

describe('a config select field through the Mantine renderer', () => {
    const config: FormConfig = [
        {
            name: 'country',
            type: 'select',
            label: 'Country',
            placeholder: 'Pick one',
            options: [
                { value: 'ca', label: 'Canada' },
                { value: 'fr', label: 'France' },
            ],
        },
    ]

    it('renders a Mantine Select instead of the native control', () => {
        const { container, view } = mount(config)
        const input = view.getByRole('combobox', { name: 'Country' })
        expect(input).toHaveClass('mantine-Select-input')
        expect(input).toHaveAttribute('placeholder', 'Pick one')
        expect(container.querySelector('select')).toBeNull()
        expect(container.querySelector('input[type="hidden"][name="country"]')).not.toBeNull()
    })

    it('hands the chosen option value, not its label, to onSubmit', async () => {
        const { view, onSubmit, submit } = mount(config)
        await userEvent.click(view.getByRole('combobox', { name: 'Country' }))
        await userEvent.click(view.getByRole('option', { name: 'France' }))
        expect(view.getByRole('combobox', { name: 'Country' })).toHaveValue('France')
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ country: 'fr' })
    })

    it('shows the configured default by its label and submits it untouched', async () => {
        const { view, onSubmit, submit } = mount([{ ...config[0], defaultValue: 'ca' }])
        expect(view.getByRole('combobox', { name: 'Country' })).toHaveValue('Canada')
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ country: 'ca' })
    })

    it('submits an untouched optional select as null', async () => {
        const { onSubmit, submit } = mount(config)
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ country: null })
    })

    it('passes disabled through to the input', () => {
        const { view } = mount([{ ...config[0], disabled: true }])
        expect(view.getByRole('combobox', { name: 'Country' })).toBeDisabled()
    })

    it('marks a required select and blocks submit until an option is chosen', async () => {
        const { container, view, onSubmit, submit } = mount([
            { ...config[0], validation: ['required'] },
        ])
        expect(container.querySelector('.mantine-InputWrapper-required')).not.toBeNull()
        const input = view.getByRole('combobox', { name: /^Country/ })

        submit()
        await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'))
        expect(onSubmit).not.toHaveBeenCalled()

        await userEvent.click(input)
        await userEvent.click(view.getByRole('option', { name: 'Canada' }))
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ country: 'ca' })
    })
})

describe('a config checkbox field through the Mantine renderer', () => {
    const config: FormConfig = [{ name: 'terms', type: 'checkbox', label: 'I agree' }]

    it('renders a Mantine Checkbox instead of the native control', () => {
        const { container, view } = mount(config)
        const input = view.getByLabelText('I agree')
        expect(input).toHaveClass('mantine-Checkbox-input')
        expect(input).toHaveAttribute('type', 'checkbox')
        expect(input).toHaveAttribute('name', 'terms')
        expect(input).not.toBeChecked()
        expect(container.querySelector('.custom-checkbox-input')).toBeNull()
    })

    it('hands the checked state to onSubmit as a boolean', async () => {
        const { view, onSubmit, submit } = mount(config)
        await userEvent.click(view.getByText('I agree'))
        expect(view.getByLabelText('I agree')).toBeChecked()
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ terms: true })
    })

    it('submits the configured default untouched', async () => {
        const { view, onSubmit, submit } = mount([{ ...config[0], defaultValue: true }])
        expect(view.getByLabelText('I agree')).toBeChecked()
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ terms: true })
    })

    it('passes disabled through to the input', () => {
        const { view } = mount([{ ...config[0], disabled: true }])
        expect(view.getByLabelText('I agree')).toBeDisabled()
    })

    it('shows no asterisk on a required checkbox, as the native one does not', () => {
        const { container, view } = mount([{ ...config[0], validation: ['required'] }])
        expect(view.getByLabelText('I agree')).toHaveClass('mantine-Checkbox-input')
        expect(container.querySelector('.mantine-InputWrapper-required')).toBeNull()
        expect(container.textContent).not.toContain('*')
    })
})

describe('a config numeric field through the Mantine renderer', () => {
    const config: FormConfig = [
        { name: 'age', type: 'numeric', label: 'Age', placeholder: 'In years' },
    ]

    it('renders a Mantine NumberInput instead of the native control', () => {
        const { container, view } = mount(config)
        const input = view.getByLabelText('Age')
        expect(input).toHaveClass('mantine-NumberInput-input')
        expect(input).toHaveAttribute('name', 'age')
        expect(input).toHaveAttribute('placeholder', 'In years')
        expect(container.querySelector('.custom-numeric-input')).toBeNull()
    })

    it('hands what was typed to onSubmit as a number', async () => {
        const { view, onSubmit, submit } = mount(config)
        await userEvent.type(view.getByLabelText('Age'), '42')
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ age: 42 })
    })

    it('keeps a decimal typed digit by digit', async () => {
        const { view, onSubmit, submit } = mount(config)
        await userEvent.type(view.getByLabelText('Age'), '1.05')
        expect(view.getByLabelText('Age')).toHaveValue('1.05')
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ age: 1.05 })
    })

    it('submits an emptied optional field as undefined, not 0', async () => {
        const { view, onSubmit, submit } = mount([{ ...config[0], defaultValue: 7 }])
        const input = view.getByLabelText('Age')
        expect(input).toHaveValue('7')
        await userEvent.clear(input)
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toHaveProperty('age', undefined)
    })

    it('passes disabled through to the input', () => {
        const { view } = mount([{ ...config[0], disabled: true }])
        expect(view.getByLabelText('Age')).toBeDisabled()
    })

    it('marks a required field and shows the min rule message on the input', async () => {
        const { container, view, onSubmit, submit } = mount([
            {
                ...config[0],
                validation: ['required', { rule: 'min', value: 18, message: 'Adults only' }],
            },
        ])
        expect(container.querySelector('.mantine-InputWrapper-required')).not.toBeNull()
        const input = view.getByLabelText(/^Age/)

        await userEvent.type(input, '12')
        submit()
        await waitFor(() => expect(view.getByText('Adults only')).toBeInTheDocument())
        expect(input).toHaveAttribute('aria-invalid', 'true')
        expect(onSubmit).not.toHaveBeenCalled()

        await userEvent.clear(input)
        await userEvent.type(input, '30')
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ age: 30 })
    })
})

describe('a config date field through the Mantine renderer', () => {
    const config: FormConfig = [{ name: 'startsOn', type: 'date', label: 'Start date' }]

    it('renders a Mantine TextInput of type date instead of the native control', () => {
        const { container, view } = mount(config)
        const input = view.getByLabelText('Start date')
        expect(input).toHaveClass('mantine-TextInput-input')
        expect(input).toHaveAttribute('type', 'date')
        expect(input).toHaveAttribute('name', 'startsOn')
        expect(container.querySelector('.custom-date-input')).toBeNull()
    })

    it('hands the picked day to onSubmit as a YYYY-MM-DD string', async () => {
        const { view, onSubmit, submit } = mount(config)
        fireEvent.change(view.getByLabelText('Start date'), { target: { value: '2026-03-14' } })
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ startsOn: '2026-03-14' })
    })

    it('submits the configured default untouched', async () => {
        const { view, onSubmit, submit } = mount([{ ...config[0], defaultValue: '2025-12-01' }])
        expect(view.getByLabelText('Start date')).toHaveValue('2025-12-01')
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ startsOn: '2025-12-01' })
    })

    it('submits an untouched optional date as an empty string, as the native one does', async () => {
        const { onSubmit, submit } = mount(config)
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ startsOn: '' })
    })

    it('passes disabled through to the input', () => {
        const { view } = mount([{ ...config[0], disabled: true }])
        expect(view.getByLabelText('Start date')).toBeDisabled()
    })

    it('marks a required date and blocks submit until a day is picked', async () => {
        const { container, view, onSubmit, submit } = mount([
            { ...config[0], validation: ['required'] },
        ])
        expect(container.querySelector('.mantine-InputWrapper-required')).not.toBeNull()
        const input = view.getByLabelText(/^Start date/)

        submit()
        await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'))
        expect(onSubmit).not.toHaveBeenCalled()

        fireEvent.change(input, { target: { value: '2026-03-14' } })
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ startsOn: '2026-03-14' })
    })
})

describe('a config text field through the Mantine renderer', () => {
    const config: FormConfig = [
        {
            name: 'nickname',
            type: 'text',
            label: 'Nickname',
            placeholder: 'What should we call you',
        },
    ]

    it('renders a Mantine TextInput instead of the native control', () => {
        const { container, view } = mount(config)
        const input = view.getByLabelText('Nickname')
        expect(input).toHaveClass('mantine-TextInput-input')
        expect(input).toHaveAttribute('type', 'text')
        expect(input).toHaveAttribute('name', 'nickname')
        expect(input).toHaveAttribute('placeholder', 'What should we call you')
        expect(container.querySelector('.custom-text-input')).toBeNull()
    })

    it('hands what was typed to onSubmit', async () => {
        const { view, onSubmit, submit } = mount(config)
        await userEvent.type(view.getByLabelText('Nickname'), 'Dee')
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ nickname: 'Dee' })
    })

    it('submits the configured default untouched', async () => {
        const { view, onSubmit, submit } = mount([{ ...config[0], defaultValue: 'Sam' }])
        expect(view.getByLabelText('Nickname')).toHaveValue('Sam')
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ nickname: 'Sam' })
    })

    it('passes disabled through to the input', () => {
        const { view } = mount([{ ...config[0], disabled: true }])
        expect(view.getByLabelText('Nickname')).toBeDisabled()
    })
})

describe('validation on a Mantine text field', () => {
    const config: FormConfig = [
        {
            name: 'nickname',
            type: 'text',
            label: 'Nickname',
            validation: ['required', { rule: 'minLength', value: 3, message: 'Too short' }],
        },
    ]

    it('marks a schema-required field with the Mantine asterisk', () => {
        const { container } = mount(config)
        expect(container.querySelector('.mantine-InputWrapper-required')).not.toBeNull()
    })

    it('leaves an optional field unmarked', () => {
        const { container } = mount([{ name: 'nickname', type: 'text', label: 'Nickname' }])
        expect(container.querySelector('.mantine-InputWrapper-required')).toBeNull()
    })

    it('blocks submit and shows the schema message on the input', async () => {
        const { view, onSubmit, submit } = mount(config)
        await userEvent.type(view.getByLabelText(/^Nickname/), 'ab')
        submit()
        await waitFor(() => expect(view.getByText('Too short')).toBeInTheDocument())
        expect(view.getByLabelText(/^Nickname/)).toHaveAttribute('aria-invalid', 'true')
        expect(onSubmit).not.toHaveBeenCalled()
    })

    it('submits once the value satisfies the schema', async () => {
        const { view, onSubmit, submit } = mount(config)
        await userEvent.type(view.getByLabelText(/^Nickname/), 'abc')
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ nickname: 'abc' })
    })
})

describe('mixed configs', () => {
    it('renders a type the adapter does not cover through the native control', async () => {
        const { container, view, onSubmit, submit } = mount([
            { name: 'nickname', type: 'text', label: 'Nickname' },
            { name: 'bio', type: 'textarea', label: 'Bio' },
        ])
        expect(view.getByLabelText('Nickname')).toHaveClass('mantine-TextInput-input')
        expect(container.querySelector('.mantine-Textarea-input')).toBeNull()
        expect(container.querySelector('.custom-textarea-input textarea')).not.toBeNull()

        await userEvent.type(view.getByLabelText('Nickname'), 'Dee')
        await userEvent.type(view.getByLabelText('Bio'), 'Hi')
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ nickname: 'Dee', bio: 'Hi' })
    })

    it('takes the required flag from a conditional field config, as ConfigFields hands it', async () => {
        const { container, view } = mount([
            { name: 'hasNickname', type: 'checkbox', label: 'I have a nickname' },
            {
                name: 'nickname',
                type: 'text',
                label: 'Nickname',
                validation: ['required'],
                showWhen: { field: 'hasNickname', is: true },
            },
        ])
        expect(view.queryByLabelText(/^Nickname/)).toBeNull()
        await userEvent.click(view.getByLabelText('I have a nickname'))
        expect(view.getByLabelText(/^Nickname/)).toHaveClass('mantine-TextInput-input')
        expect(container.querySelector('.mantine-InputWrapper-required')).not.toBeNull()
    })
})
