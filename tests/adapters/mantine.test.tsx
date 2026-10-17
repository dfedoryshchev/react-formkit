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
    MantineAutocompleteRenderer,
    MantineCheckboxGroupRenderer,
    MantineCheckboxRenderer,
    MantineDateRenderer,
    MantineDateTimeRenderer,
    MantineEmailRenderer,
    MantineMultiSelectRenderer,
    MantineNumberRenderer,
    MantinePasswordRenderer,
    MantineRadioRenderer,
    MantineSelectRenderer,
    MantineSwitchRenderer,
    MantineTagsRenderer,
    MantineTextareaRenderer,
    MantineTextRenderer,
    MantineTimeRenderer,
    MantineUrlRenderer,
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
    it('routes every control type but phone to Mantine and leaves phone on the native one', () => {
        expect(mantineRenderers.byType).toEqual({
            text: MantineTextRenderer,
            numeric: MantineNumberRenderer,
            textarea: MantineTextareaRenderer,
            select: MantineSelectRenderer,
            checkbox: MantineCheckboxRenderer,
            radio: MantineRadioRenderer,
            email: MantineEmailRenderer,
            url: MantineUrlRenderer,
            date: MantineDateRenderer,
            time: MantineTimeRenderer,
            datetime: MantineDateTimeRenderer,
            'checkbox-group': MantineCheckboxGroupRenderer,
            switch: MantineSwitchRenderer,
            password: MantinePasswordRenderer,
            multiselect: MantineMultiSelectRenderer,
            autocomplete: MantineAutocompleteRenderer,
            'multi-autocomplete': MantineTagsRenderer,
        })
        expect(mantineRenderers.byType).not.toHaveProperty('phone')
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

describe('config text-like fields through the Mantine renderers', () => {
    const cases: {
        field: FormConfig[number]
        inputType: string
        className: string
        nativeClass: string
        typed: string
    }[] = [
        {
            field: { name: 'contact', type: 'email', label: 'Contact' },
            inputType: 'email',
            className: 'mantine-TextInput-input',
            nativeClass: '.custom-email-input',
            typed: 'dee@example.com',
        },
        {
            field: { name: 'site', type: 'url', label: 'Site' },
            inputType: 'url',
            className: 'mantine-TextInput-input',
            nativeClass: '.custom-url-input',
            typed: 'https://example.com',
        },
        {
            field: { name: 'secret', type: 'password', label: 'Secret' },
            inputType: 'password',
            className: 'mantine-PasswordInput-innerInput',
            nativeClass: '.custom-password-input',
            typed: 'hunter22',
        },
    ]

    it.each(cases)(
        'renders a $field.type field as a Mantine input instead of the native control',
        ({ field, inputType, className, nativeClass }) => {
            const { container, view } = mount([{ ...field, placeholder: 'Fill me' }])
            const input = view.getByLabelText(field.label as string)
            expect(input).toHaveClass(className)
            expect(input).toHaveAttribute('type', inputType)
            expect(input).toHaveAttribute('name', field.name)
            expect(input).toHaveAttribute('placeholder', 'Fill me')
            expect(container.querySelector(nativeClass)).toBeNull()
        },
    )

    it.each(cases)(
        'hands what was typed into a $field.type field to onSubmit',
        async ({ field, typed }) => {
            const { view, onSubmit, submit } = mount([field])
            await userEvent.type(view.getByLabelText(field.label as string), typed)
            submit()
            await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
            expect(onSubmit.mock.calls[0][0]).toEqual({ [field.name]: typed })
        },
    )

    it.each(cases)('passes disabled through to a $field.type input', ({ field }) => {
        const { view } = mount([{ ...field, disabled: true }])
        expect(view.getByLabelText(field.label as string)).toBeDisabled()
    })

    it.each(cases)(
        'marks a required $field.type field and blocks an empty submit',
        async ({ field }) => {
            const { container, view, onSubmit, submit } = mount([
                { ...field, validation: ['required'] },
            ])
            expect(container.querySelector('.mantine-InputWrapper-required')).not.toBeNull()
            submit()
            await waitFor(() =>
                expect(container.querySelector('.mantine-InputWrapper-error')).not.toBeNull(),
            )
            expect(view.getByText('This field is required')).toBeInTheDocument()
            expect(onSubmit).not.toHaveBeenCalled()
        },
    )

    it('reveals a Mantine password with its own toggle', async () => {
        const { container, view } = mount([cases[2].field])
        const toggle = container.querySelector('.mantine-PasswordInput-visibilityToggle')
        expect(toggle).not.toBeNull()
        await userEvent.click(toggle as Element)
        expect(view.getByLabelText('Secret')).toHaveAttribute('type', 'text')
    })
})

describe('config time and datetime fields through the Mantine renderers', () => {
    const cases: {
        field: FormConfig[number]
        inputType: string
        nativeClass: string
        picked: string
    }[] = [
        {
            field: { name: 'opensAt', type: 'time', label: 'Opens at' },
            inputType: 'time',
            nativeClass: '.custom-time-input',
            picked: '09:30',
        },
        {
            field: { name: 'meetAt', type: 'datetime', label: 'Meet at' },
            inputType: 'datetime-local',
            nativeClass: '.custom-datetime-input',
            picked: '2026-03-14T09:30',
        },
    ]

    it.each(cases)(
        'renders a $field.type field as a Mantine TextInput of the browser type',
        ({ field, inputType, nativeClass }) => {
            const { container, view } = mount([field])
            const input = view.getByLabelText(field.label as string)
            expect(input).toHaveClass('mantine-TextInput-input')
            expect(input).toHaveAttribute('type', inputType)
            expect(input).toHaveAttribute('name', field.name)
            expect(container.querySelector(nativeClass)).toBeNull()
        },
    )

    it.each(cases)(
        'hands the picked $field.type value to onSubmit as the browser string',
        async ({ field, picked }) => {
            const { view, onSubmit, submit } = mount([field])
            fireEvent.change(view.getByLabelText(field.label as string), {
                target: { value: picked },
            })
            submit()
            await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
            expect(onSubmit.mock.calls[0][0]).toEqual({ [field.name]: picked })
        },
    )

    it.each(cases)(
        'submits an untouched optional $field.type as an empty string',
        async ({ field }) => {
            const { onSubmit, submit } = mount([field])
            submit()
            await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
            expect(onSubmit.mock.calls[0][0]).toEqual({ [field.name]: '' })
        },
    )

    it.each(cases)('passes disabled through to a $field.type input', ({ field }) => {
        const { view } = mount([{ ...field, disabled: true }])
        expect(view.getByLabelText(field.label as string)).toBeDisabled()
    })
})

describe('a config textarea field through the Mantine renderer', () => {
    const config: FormConfig = [
        { name: 'bio', type: 'textarea', label: 'Bio', placeholder: 'A line or two' },
    ]

    it('renders a Mantine Textarea instead of the native control', () => {
        const { container, view } = mount(config)
        const input = view.getByLabelText('Bio')
        expect(input.tagName).toBe('TEXTAREA')
        expect(input).toHaveClass('mantine-Textarea-input')
        expect(input).toHaveAttribute('name', 'bio')
        expect(input).toHaveAttribute('placeholder', 'A line or two')
        expect(container.querySelector('.custom-textarea-input')).toBeNull()
    })

    it('hands a multi-line value to onSubmit', async () => {
        const { view, onSubmit, submit } = mount(config)
        await userEvent.type(view.getByLabelText('Bio'), 'Hi{enter}there')
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ bio: 'Hi\nthere' })
    })

    it('marks a required textarea and shows the minLength message on it', async () => {
        const { container, view, onSubmit, submit } = mount([
            {
                ...config[0],
                validation: ['required', { rule: 'minLength', value: 5, message: 'Say more' }],
            },
        ])
        expect(container.querySelector('.mantine-InputWrapper-required')).not.toBeNull()
        await userEvent.type(view.getByLabelText(/^Bio/), 'Hi')
        submit()
        await waitFor(() => expect(view.getByText('Say more')).toBeInTheDocument())
        expect(view.getByLabelText(/^Bio/)).toHaveAttribute('aria-invalid', 'true')
        expect(onSubmit).not.toHaveBeenCalled()
    })
})

describe('a config switch field through the Mantine renderer', () => {
    const config: FormConfig = [{ name: 'news', type: 'switch', label: 'Send me news' }]

    it('renders a Mantine Switch instead of the native control', () => {
        const { container, view } = mount(config)
        const input = view.getByRole('switch', { name: 'Send me news' })
        expect(input).toHaveClass('mantine-Switch-input')
        expect(input).toHaveAttribute('name', 'news')
        expect(input).not.toBeChecked()
        expect(container.querySelector('.switch-wrapper')).toBeNull()
    })

    it('hands the switched state to onSubmit as a boolean', async () => {
        const { view, onSubmit, submit } = mount(config)
        await userEvent.click(view.getByText('Send me news'))
        expect(view.getByRole('switch', { name: 'Send me news' })).toBeChecked()
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ news: true })
    })

    it('submits an untouched switch as false and a default of true untouched', async () => {
        const off = mount(config)
        off.submit()
        await waitFor(() => expect(off.onSubmit).toHaveBeenCalledTimes(1))
        expect(off.onSubmit.mock.calls[0][0]).toEqual({ news: false })
        off.container.remove()

        const on = mount([{ ...config[0], defaultValue: true }])
        on.submit()
        await waitFor(() => expect(on.onSubmit).toHaveBeenCalledTimes(1))
        expect(on.onSubmit.mock.calls[0][0]).toEqual({ news: true })
    })

    it('passes disabled through to the input', () => {
        const { view } = mount([{ ...config[0], disabled: true }])
        expect(view.getByRole('switch', { name: 'Send me news' })).toBeDisabled()
    })

    it('shows no asterisk on a required switch, as the native one does not', () => {
        const { container } = mount([{ ...config[0], validation: ['required'] }])
        expect(container.querySelector('.mantine-Switch-input')).not.toBeNull()
        expect(container.querySelector('.mantine-InputWrapper-required')).toBeNull()
        expect(container.textContent).not.toContain('*')
    })
})

describe('a config radio field through the Mantine renderer', () => {
    const config: FormConfig = [
        {
            name: 'plan',
            type: 'radio',
            label: 'Plan',
            options: [
                { value: 'free', label: 'Free' },
                { value: 'pro', label: 'Pro' },
            ],
        },
    ]

    it('renders a Mantine Radio per option, sharing the field name', () => {
        const { container, view } = mount(config)
        expect(view.getByRole('radiogroup')).toBeInTheDocument()
        for (const label of ['Free', 'Pro']) {
            const input = view.getByRole('radio', { name: label })
            expect(input).toHaveClass('mantine-Radio-radio')
            expect(input).toHaveAttribute('name', 'plan')
            expect(input).not.toBeChecked()
        }
        expect(container.querySelector('.custom-radio-group')).toBeNull()
    })

    it('hands the picked option value, not its label, to onSubmit', async () => {
        const { view, onSubmit, submit } = mount(config)
        await userEvent.click(view.getByRole('radio', { name: 'Pro' }))
        expect(view.getByRole('radio', { name: 'Pro' })).toBeChecked()
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ plan: 'pro' })
    })

    it('shows the configured default as checked and submits it untouched', async () => {
        const { view, onSubmit, submit } = mount([{ ...config[0], defaultValue: 'free' }])
        expect(view.getByRole('radio', { name: 'Free' })).toBeChecked()
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ plan: 'free' })
    })

    it('submits an untouched optional radio as null', async () => {
        const { onSubmit, submit } = mount(config)
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ plan: null })
    })

    it('passes disabled through to every option', () => {
        const { view } = mount([{ ...config[0], disabled: true }])
        expect(view.getByRole('radio', { name: 'Free' })).toBeDisabled()
        expect(view.getByRole('radio', { name: 'Pro' })).toBeDisabled()
    })

    it('marks a required radio and blocks submit until an option is picked', async () => {
        const { container, view, onSubmit, submit } = mount([
            { ...config[0], validation: ['required'] },
        ])
        expect(container.querySelector('.mantine-InputWrapper-required')).not.toBeNull()
        submit()
        await waitFor(() =>
            expect(container.querySelector('.mantine-InputWrapper-error')).not.toBeNull(),
        )
        expect(onSubmit).not.toHaveBeenCalled()

        await userEvent.click(view.getByRole('radio', { name: 'Free' }))
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ plan: 'free' })
    })
})

describe('a config checkbox-group field through the Mantine renderer', () => {
    const config: FormConfig = [
        {
            name: 'topics',
            type: 'checkbox-group',
            label: 'Topics',
            options: [
                { value: 'forms', label: 'Forms' },
                { value: 'tables', label: 'Tables' },
                { value: 'charts', label: 'Charts' },
            ],
        },
    ]

    it('renders a Mantine Checkbox per option inside one group', () => {
        const { container, view } = mount(config)
        expect(view.getByRole('group')).toBeInTheDocument()
        for (const label of ['Forms', 'Tables', 'Charts']) {
            expect(view.getByLabelText(label)).toHaveClass('mantine-Checkbox-input')
        }
        expect(container.querySelector('input[type="hidden"][name="topics"]')).not.toBeNull()
        expect(container.querySelector('.custom-checkbox-group')).toBeNull()
    })

    it('hands the ticked option values to onSubmit in the order they were ticked', async () => {
        const { view, onSubmit, submit } = mount(config)
        await userEvent.click(view.getByLabelText('Charts'))
        await userEvent.click(view.getByLabelText('Forms'))
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ topics: ['charts', 'forms'] })
    })

    it('shows the configured default ticked, and unticking removes it', async () => {
        const { view, onSubmit, submit } = mount([
            { ...config[0], defaultValue: ['forms', 'tables'] },
        ])
        expect(view.getByLabelText('Forms')).toBeChecked()
        expect(view.getByLabelText('Tables')).toBeChecked()
        await userEvent.click(view.getByLabelText('Forms'))
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ topics: ['tables'] })
    })

    it('submits an untouched group as an empty array', async () => {
        const { onSubmit, submit } = mount(config)
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ topics: [] })
    })

    it('passes disabled through to every option', () => {
        const { view } = mount([{ ...config[0], disabled: true }])
        for (const label of ['Forms', 'Tables', 'Charts']) {
            expect(view.getByLabelText(label)).toBeDisabled()
        }
    })
})

describe('a config multiselect field through the Mantine renderer', () => {
    const config: FormConfig = [
        {
            name: 'langs',
            type: 'multiselect',
            label: 'Languages',
            placeholder: 'Pick some',
            options: [
                { value: 'en', label: 'English' },
                { value: 'fr', label: 'French' },
                { value: 'uk', label: 'Ukrainian' },
            ],
        },
    ]

    it('renders a Mantine MultiSelect instead of the native control', () => {
        const { container, view } = mount(config)
        const input = view.getByRole('combobox', { name: 'Languages' })
        expect(input).toHaveClass('mantine-MultiSelect-inputField')
        expect(input).toHaveAttribute('placeholder', 'Pick some')
        expect(container.querySelector('input[type="hidden"][name="langs"]')).not.toBeNull()
    })

    it('hands the chosen option values, not their labels, to onSubmit', async () => {
        const { view, onSubmit, submit } = mount(config)
        await userEvent.click(view.getByRole('combobox', { name: 'Languages' }))
        await userEvent.click(view.getByRole('option', { name: 'French' }))
        await userEvent.click(view.getByRole('option', { name: 'English' }))
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ langs: ['fr', 'en'] })
    })

    it('shows the configured default as pills by label and submits it untouched', async () => {
        const { container, onSubmit, submit } = mount([{ ...config[0], defaultValue: ['uk'] }])
        expect(container.querySelector('.mantine-MultiSelect-pill')).toHaveTextContent('Ukrainian')
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ langs: ['uk'] })
    })

    it('submits an untouched multiselect as an empty array', async () => {
        const { onSubmit, submit } = mount(config)
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ langs: [] })
    })

    it('passes disabled through to the input', () => {
        const { view } = mount([{ ...config[0], disabled: true }])
        expect(view.getByRole('combobox', { name: 'Languages' })).toBeDisabled()
    })
})

describe('a config autocomplete field through the Mantine renderer', () => {
    const config: FormConfig = [
        {
            name: 'city',
            type: 'autocomplete',
            label: 'City',
            placeholder: 'Start typing',
            options: [
                { value: 'ldn', label: 'London' },
                { value: 'lds', label: 'Leeds' },
            ],
        },
    ]

    it('renders a Mantine Autocomplete instead of the native control', () => {
        const { container, view } = mount(config)
        const input = view.getByRole('combobox', { name: 'City' })
        expect(input).toHaveClass('mantine-Autocomplete-input')
        expect(input).toHaveAttribute('name', 'city')
        expect(input).toHaveAttribute('placeholder', 'Start typing')
        expect(container.querySelector('.custom-autocomplete-input')).toBeNull()
    })

    it('suggests the option labels and submits the one picked as typed text', async () => {
        const { view, onSubmit, submit } = mount(config)
        await userEvent.type(view.getByRole('combobox', { name: 'City' }), 'Le')
        await userEvent.click(view.getByRole('option', { name: 'Leeds' }))
        expect(view.getByRole('combobox', { name: 'City' })).toHaveValue('Leeds')
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ city: 'Leeds' })
    })

    it('submits free text that matches no suggestion', async () => {
        const { view, onSubmit, submit } = mount(config)
        await userEvent.type(view.getByRole('combobox', { name: 'City' }), 'York')
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ city: 'York' })
    })

    it('passes disabled through to the input', () => {
        const { view } = mount([{ ...config[0], disabled: true }])
        expect(view.getByRole('combobox', { name: 'City' })).toBeDisabled()
    })
})

describe('a config multi-autocomplete field through the Mantine renderer', () => {
    const config: FormConfig = [
        {
            name: 'tags',
            type: 'multi-autocomplete',
            label: 'Tags',
            placeholder: 'Add a tag',
            options: [
                { value: 'react', label: 'react' },
                { value: 'zod', label: 'zod' },
            ],
        },
    ]

    it('renders a Mantine TagsInput instead of the native control', () => {
        const { container, view } = mount(config)
        const input = view.getByRole('combobox', { name: 'Tags' })
        expect(input).toHaveClass('mantine-TagsInput-inputField')
        expect(input).toHaveAttribute('placeholder', 'Add a tag')
        expect(container.querySelector('input[type="hidden"][name="tags"]')).not.toBeNull()
        expect(container.querySelector('.custom-multi-autocomplete')).toBeNull()
    })

    it('hands a suggested tag and a free-typed one to onSubmit as an array', async () => {
        const { view, onSubmit, submit } = mount(config)
        await userEvent.type(view.getByRole('combobox', { name: 'Tags' }), 'zo')
        await userEvent.click(view.getByRole('option', { name: 'zod' }))
        await userEvent.type(view.getByRole('combobox', { name: 'Tags' }), 'forms{enter}')
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ tags: ['zod', 'forms'] })
    })

    it('keeps a tag still being typed when focus leaves the input', async () => {
        const { view, onSubmit, submit } = mount(config)
        await userEvent.type(view.getByRole('combobox', { name: 'Tags' }), 'pending')
        await userEvent.tab()
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ tags: ['pending'] })
    })

    it('submits an untouched field as an empty array', async () => {
        const { onSubmit, submit } = mount(config)
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({ tags: [] })
    })

    it('passes disabled through to the input', () => {
        const { view } = mount([{ ...config[0], disabled: true }])
        expect(view.getByRole('combobox', { name: 'Tags' })).toBeDisabled()
    })
})

describe('every Mantine control in one form', () => {
    const config: FormConfig = [
        { name: 'nickname', type: 'text', label: 'Nickname' },
        { name: 'age', type: 'numeric', label: 'Age' },
        { name: 'bio', type: 'textarea', label: 'Bio' },
        {
            name: 'country',
            type: 'select',
            label: 'Country',
            options: [
                { value: 'ca', label: 'Canada' },
                { value: 'fr', label: 'France' },
            ],
        },
        { name: 'terms', type: 'checkbox', label: 'I agree' },
        {
            name: 'plan',
            type: 'radio',
            label: 'Plan',
            options: [
                { value: 'free', label: 'Free' },
                { value: 'pro', label: 'Pro' },
            ],
        },
        { name: 'contact', type: 'email', label: 'Contact' },
        { name: 'site', type: 'url', label: 'Site' },
        { name: 'startsOn', type: 'date', label: 'Start date' },
        { name: 'opensAt', type: 'time', label: 'Opens at' },
        { name: 'meetAt', type: 'datetime', label: 'Meet at' },
        {
            name: 'topics',
            type: 'checkbox-group',
            label: 'Topics',
            options: [
                { value: 'forms', label: 'Forms' },
                { value: 'tables', label: 'Tables' },
            ],
        },
        { name: 'news', type: 'switch', label: 'Send me news' },
        { name: 'secret', type: 'password', label: 'Secret' },
        {
            name: 'langs',
            type: 'multiselect',
            label: 'Languages',
            options: [
                { value: 'en', label: 'English' },
                { value: 'uk', label: 'Ukrainian' },
            ],
        },
        {
            name: 'city',
            type: 'autocomplete',
            label: 'City',
            options: [{ value: 'ldn', label: 'London' }],
        },
        { name: 'tags', type: 'multi-autocomplete', label: 'Tags' },
    ]

    const PropHarness: React.FC<{
        onSubmit: (values: Record<string, unknown>) => void
    }> = ({ onSubmit }) => {
        const { defaults, fields, schema } = useFormFromConfig(config)
        return (
            <MantineProvider env="test">
                <BasicForm onSubmit={onSubmit} validationSchema={schema} defaultValues={defaults}>
                    <ConfigFields config={fields} renderers={mantineRenderers} />
                    <button type="submit">Submit</button>
                </BasicForm>
            </MantineProvider>
        )
    }

    const fillAndSubmit = async (
        view: ReturnType<typeof within>,
        onSubmit: ReturnType<typeof vi.fn>,
    ) => {
        expect(view.getByLabelText('Nickname')).toHaveClass('mantine-TextInput-input')
        expect(view.getByLabelText('Age')).toHaveClass('mantine-NumberInput-input')
        expect(view.getByRole('combobox', { name: 'Country' })).toHaveClass('mantine-Select-input')
        expect(view.getByLabelText('I agree')).toHaveClass('mantine-Checkbox-input')
        expect(view.getByLabelText('Start date')).toHaveClass('mantine-TextInput-input')
        expect(view.getByLabelText('Bio')).toHaveClass('mantine-Textarea-input')
        expect(view.getByRole('radio', { name: 'Pro' })).toHaveClass('mantine-Radio-radio')
        expect(view.getByLabelText('Contact')).toHaveClass('mantine-TextInput-input')
        expect(view.getByLabelText('Site')).toHaveClass('mantine-TextInput-input')
        expect(view.getByLabelText('Opens at')).toHaveClass('mantine-TextInput-input')
        expect(view.getByLabelText('Meet at')).toHaveClass('mantine-TextInput-input')
        expect(view.getByLabelText('Tables')).toHaveClass('mantine-Checkbox-input')
        expect(view.getByRole('switch', { name: 'Send me news' })).toHaveClass(
            'mantine-Switch-input',
        )
        expect(view.getByLabelText('Secret')).toHaveClass('mantine-PasswordInput-innerInput')
        expect(view.getByRole('combobox', { name: 'Languages' })).toHaveClass(
            'mantine-MultiSelect-inputField',
        )
        expect(view.getByRole('combobox', { name: 'City' })).toHaveClass(
            'mantine-Autocomplete-input',
        )
        expect(view.getByRole('combobox', { name: 'Tags' })).toHaveClass(
            'mantine-TagsInput-inputField',
        )

        await userEvent.type(view.getByLabelText('Nickname'), 'Dee')
        await userEvent.type(view.getByLabelText('Age'), '42')
        await userEvent.type(view.getByLabelText('Bio'), 'Hi')
        await userEvent.click(view.getByRole('combobox', { name: 'Country' }))
        await userEvent.click(view.getByRole('option', { name: 'France' }))
        await userEvent.click(view.getByText('I agree'))
        await userEvent.click(view.getByRole('radio', { name: 'Pro' }))
        await userEvent.type(view.getByLabelText('Contact'), 'dee@example.com')
        await userEvent.type(view.getByLabelText('Site'), 'https://example.com')
        fireEvent.change(view.getByLabelText('Start date'), { target: { value: '2026-03-14' } })
        fireEvent.change(view.getByLabelText('Opens at'), { target: { value: '09:30' } })
        fireEvent.change(view.getByLabelText('Meet at'), { target: { value: '2026-03-14T09:30' } })
        await userEvent.click(view.getByLabelText('Tables'))
        await userEvent.click(view.getByText('Send me news'))
        await userEvent.type(view.getByLabelText('Secret'), 'hunter22')
        await userEvent.click(view.getByRole('combobox', { name: 'Languages' }))
        await userEvent.click(view.getByRole('option', { name: 'Ukrainian' }))
        await userEvent.type(view.getByRole('combobox', { name: 'City' }), 'York')
        await userEvent.type(view.getByRole('combobox', { name: 'Tags' }), 'forms{enter}')

        fireEvent.click(view.getByRole('button', { name: 'Submit' }))
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toEqual({
            nickname: 'Dee',
            age: 42,
            bio: 'Hi',
            country: 'fr',
            terms: true,
            plan: 'pro',
            contact: 'dee@example.com',
            site: 'https://example.com',
            startsOn: '2026-03-14',
            opensAt: '09:30',
            meetAt: '2026-03-14T09:30',
            topics: ['tables'],
            news: true,
            secret: 'hunter22',
            langs: ['uk'],
            city: 'York',
            tags: ['forms'],
        })
    }

    it('hands every filled control to onSubmit in one payload', async () => {
        const { view, onSubmit } = mount(config)
        await fillAndSubmit(view, onSubmit)
    })

    it('does the same with the registry passed to ConfigFields and no provider', async () => {
        const onSubmit = vi.fn()
        const { container } = render(<PropHarness onSubmit={onSubmit} />)
        await fillAndSubmit(within(container), onSubmit)
    })
})

describe('descriptions and errors in the Mantine slots', () => {
    const HINT = 'Shown on your public profile'

    const cases: {
        field: FormConfig[number]
        input: (view: ReturnType<typeof within>) => HTMLElement
    }[] = [
        {
            field: { name: 'nickname', type: 'text', label: 'Nickname' },
            input: (view) => view.getByLabelText('Nickname'),
        },
        {
            field: { name: 'age', type: 'numeric', label: 'Age' },
            input: (view) => view.getByLabelText('Age'),
        },
        {
            field: {
                name: 'country',
                type: 'select',
                label: 'Country',
                options: [{ value: 'ca', label: 'Canada' }],
            },
            input: (view) => view.getByRole('combobox', { name: 'Country' }),
        },
        {
            field: { name: 'terms', type: 'checkbox', label: 'I agree' },
            input: (view) => view.getByLabelText('I agree'),
        },
        {
            field: { name: 'startsOn', type: 'date', label: 'Start date' },
            input: (view) => view.getByLabelText('Start date'),
        },
        {
            field: { name: 'bio', type: 'textarea', label: 'Bio' },
            input: (view) => view.getByLabelText('Bio'),
        },
        {
            field: { name: 'contact', type: 'email', label: 'Contact' },
            input: (view) => view.getByLabelText('Contact'),
        },
        {
            field: { name: 'site', type: 'url', label: 'Site' },
            input: (view) => view.getByLabelText('Site'),
        },
        {
            field: { name: 'opensAt', type: 'time', label: 'Opens at' },
            input: (view) => view.getByLabelText('Opens at'),
        },
        {
            field: { name: 'meetAt', type: 'datetime', label: 'Meet at' },
            input: (view) => view.getByLabelText('Meet at'),
        },
        {
            field: { name: 'news', type: 'switch', label: 'Send me news' },
            input: (view) => view.getByRole('switch'),
        },
        {
            field: { name: 'secret', type: 'password', label: 'Secret' },
            input: (view) => view.getByLabelText('Secret'),
        },
        {
            field: {
                name: 'langs',
                type: 'multiselect',
                label: 'Languages',
                options: [{ value: 'en', label: 'English' }],
            },
            input: (view) => view.getByRole('combobox', { name: 'Languages' }),
        },
        {
            field: {
                name: 'city',
                type: 'autocomplete',
                label: 'City',
                options: [{ value: 'ldn', label: 'London' }],
            },
            input: (view) => view.getByRole('combobox', { name: 'City' }),
        },
        {
            field: { name: 'tags', type: 'multi-autocomplete', label: 'Tags' },
            input: (view) => view.getByRole('combobox', { name: 'Tags' }),
        },
        {
            field: {
                name: 'plan',
                type: 'radio',
                label: 'Plan',
                options: [{ value: 'free', label: 'Free' }],
            },
            input: (view) => view.getByRole('radiogroup'),
        },
        {
            field: {
                name: 'topics',
                type: 'checkbox-group',
                label: 'Topics',
                options: [{ value: 'forms', label: 'Forms' }],
            },
            input: (view) => view.getByRole('group'),
        },
    ]

    it.each(cases)(
        'puts a $field.type field description in the slot its input reads',
        ({ field, input }) => {
            const { view } = mount([{ ...field, description: HINT }])
            expect(view.getByText(HINT).id).toMatch(/-description$/)
            expect(input(view)).toHaveAccessibleDescription(HINT)
        },
    )

    it.each(cases)(
        'renders no description slot for a $field.type field without one',
        ({ field, input }) => {
            const { container, view } = mount([field])
            expect(container.querySelector('[id$="-description"]')).toBeNull()
            expect(input(view)).not.toHaveAttribute('aria-describedby')
        },
    )

    it('keeps the description beside a schema error, and the input reads both', async () => {
        const { view, onSubmit, submit } = mount([
            {
                name: 'nickname',
                type: 'text',
                label: 'Nickname',
                description: HINT,
                validation: [{ rule: 'minLength', value: 3, message: 'Too short' }],
            },
        ])
        await userEvent.type(view.getByLabelText('Nickname'), 'ab')
        submit()
        await waitFor(() => expect(view.getByText('Too short')).toBeInTheDocument())
        expect(view.getByText(HINT)).toBeInTheDocument()
        const input = view.getByLabelText('Nickname')
        expect(input).toHaveAccessibleDescription(expect.stringContaining(HINT))
        expect(input).toHaveAccessibleDescription(expect.stringContaining('Too short'))
        expect(onSubmit).not.toHaveBeenCalled()
    })
})

describe('mixed configs', () => {
    it('renders phone, the one type the adapter does not cover, through the native control', async () => {
        const { container, view, onSubmit, submit } = mount([
            { name: 'nickname', type: 'text', label: 'Nickname' },
            { name: 'mobile', type: 'phone', label: 'Mobile' },
        ])
        expect(view.getByLabelText('Nickname')).toHaveClass('mantine-TextInput-input')
        expect(container.querySelector('.react-tel-input input[type="tel"]')).not.toBeNull()
        expect(container.querySelector('.react-tel-input input[type="tel"]')).not.toHaveClass(
            'mantine-TextInput-input',
        )

        await userEvent.type(view.getByLabelText('Nickname'), 'Dee')
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0][0]).toMatchObject({ nickname: 'Dee' })
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
