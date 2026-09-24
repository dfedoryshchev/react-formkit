// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, waitFor, within } from '@testing-library/react'
import { BasicForm } from '../../src/form'
import {
    ConfigFields,
    NativeFieldRenderer,
    RendererProvider,
    nativeRenderers,
    resolveFieldRenderer,
    useFormFromConfig,
} from '../../src/config'
import type { FormConfig } from '../../src/config'
import type { ControlType } from '../../src/controls/Control'
import type { Option } from '../../src/controls/control.types'

type SeamPath = 'default' | 'provider'

const seamPaths: SeamPath[] = ['default', 'provider']

const FIELD = 'field'
const LABEL = 'Field'

const Harness: React.FC<{
    config: FormConfig
    path: SeamPath
    onSubmit: (values: Record<string, unknown>) => void
}> = ({ config, path, onSubmit }) => {
    const { defaults, fields, schema } = useFormFromConfig(config)
    const list = <ConfigFields config={fields} />
    return (
        <BasicForm onSubmit={onSubmit} validationSchema={schema} defaultValues={defaults}>
            {path === 'provider' ? (
                <RendererProvider renderers={nativeRenderers}>{list}</RendererProvider>
            ) : (
                list
            )}
            <button type="submit">Submit</button>
        </BasicForm>
    )
}

const mount = (path: SeamPath, config: FormConfig) => {
    const onSubmit = vi.fn()
    const { container } = render(<Harness config={config} path={path} onSubmit={onSubmit} />)
    return {
        container,
        onSubmit,
        control: (selector: string): HTMLElement => {
            const el = container.querySelector<HTMLElement>(selector)
            if (!el) throw new Error(`nothing matched ${selector}`)
            return el
        },
        submit: () => fireEvent.click(within(container).getByRole('button', { name: 'Submit' })),
        errors: () =>
            [...container.querySelectorAll('.custom-field-message--error')].map(
                (el) => el.textContent,
            ),
    }
}

const change = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } })

interface ControlCase {
    type: ControlType
    options?: Option[]
    selector: string
    fill: (control: HTMLElement) => void
    expectSubmitted: (value: unknown) => void
    // Whether `validation: ['required']` stops a submit of the empty value the
    // config engine seeds the field with.
    requiredBlocksEmpty: boolean
    // Set only where the rejection is the message map's `required`, rather than
    // the base type refusing the empty value outright.
    requiredMessage?: string
}

const REQUIRED_MESSAGE = 'This field is required'

const letterOptions: Option[] = [
    { value: 'a', label: 'Apple' },
    { value: 'b', label: 'Banana' },
]

const cases: ControlCase[] = [
    {
        type: 'text',
        selector: '.custom-text-input input',
        fill: (el) => change(el, 'ada'),
        expectSubmitted: (v) => expect(v).toBe('ada'),
        requiredBlocksEmpty: true,
        requiredMessage: REQUIRED_MESSAGE,
    },
    {
        type: 'numeric',
        selector: '.custom-numeric-input input',
        fill: (el) => change(el, '42'),
        expectSubmitted: (v) => expect(v).toBe(42),
        requiredBlocksEmpty: true,
    },
    {
        type: 'textarea',
        selector: '.custom-textarea-input textarea',
        fill: (el) => change(el, 'a longer answer'),
        expectSubmitted: (v) => expect(v).toBe('a longer answer'),
        requiredBlocksEmpty: true,
        requiredMessage: REQUIRED_MESSAGE,
    },
    {
        type: 'select',
        options: letterOptions,
        selector: '.custom-select-input select',
        fill: (el) => change(el, 'b'),
        expectSubmitted: (v) => expect(v).toBe('b'),
        requiredBlocksEmpty: true,
    },
    {
        type: 'checkbox',
        selector: '.custom-checkbox-input input[type="checkbox"]',
        fill: (el) => fireEvent.click(el),
        expectSubmitted: (v) => expect(v).toBe(true),
        requiredBlocksEmpty: false,
    },
    {
        type: 'radio',
        options: letterOptions,
        selector: '.custom-radio-group input[value="b"]',
        fill: (el) => fireEvent.click(el),
        expectSubmitted: (v) => expect(v).toBe('b'),
        requiredBlocksEmpty: true,
    },
    {
        type: 'email',
        selector: '.custom-email-input input[type="email"]',
        fill: (el) => change(el, 'ada@example.com'),
        expectSubmitted: (v) => expect(v).toBe('ada@example.com'),
        requiredBlocksEmpty: true,
        requiredMessage: REQUIRED_MESSAGE,
    },
    {
        type: 'url',
        selector: '.custom-url-input input[type="url"]',
        fill: (el) => change(el, 'https://example.com'),
        expectSubmitted: (v) => expect(v).toBe('https://example.com'),
        requiredBlocksEmpty: true,
        requiredMessage: REQUIRED_MESSAGE,
    },
    {
        type: 'date',
        selector: '.custom-date-input input[type="date"]',
        fill: (el) => change(el, '2026-01-02'),
        expectSubmitted: (v) => expect(v).toBe('2026-01-02'),
        requiredBlocksEmpty: true,
        requiredMessage: REQUIRED_MESSAGE,
    },
    {
        type: 'time',
        selector: '.custom-time-input input[type="time"]',
        fill: (el) => change(el, '10:30'),
        expectSubmitted: (v) => expect(v).toBe('10:30'),
        requiredBlocksEmpty: true,
        requiredMessage: REQUIRED_MESSAGE,
    },
    {
        type: 'datetime',
        selector: '.custom-datetime-input input[type="datetime-local"]',
        fill: (el) => change(el, '2026-01-02T10:30'),
        expectSubmitted: (v) => expect(v).toBe('2026-01-02T10:30'),
        requiredBlocksEmpty: true,
        requiredMessage: REQUIRED_MESSAGE,
    },
    {
        type: 'switch',
        selector: '.switch-wrapper input[role="switch"]',
        fill: (el) => fireEvent.click(el),
        expectSubmitted: (v) => expect(v).toBe(true),
        requiredBlocksEmpty: false,
    },
    {
        type: 'password',
        selector: '.custom-password-input input[type="password"]',
        fill: (el) => change(el, 'correct horse'),
        expectSubmitted: (v) => expect(v).toBe('correct horse'),
        requiredBlocksEmpty: true,
        requiredMessage: REQUIRED_MESSAGE,
    },
    {
        type: 'autocomplete',
        selector: '.custom-autocomplete-input input',
        fill: (el) => change(el, 'ada'),
        expectSubmitted: (v) => expect(v).toBe('ada'),
        requiredBlocksEmpty: true,
        requiredMessage: REQUIRED_MESSAGE,
    },
    {
        type: 'phone',
        selector: '.react-tel-input input',
        fill: (el) => change(el, '+44 20 7123 4567'),
        expectSubmitted: (v) => expect(String(v).replace(/\D/g, '')).toBe('442071234567'),
        requiredBlocksEmpty: true,
        requiredMessage: REQUIRED_MESSAGE,
    },
    {
        type: 'checkbox-group',
        options: letterOptions,
        selector: '.custom-checkbox-group input[type="checkbox"]',
        fill: (el) => fireEvent.click(el),
        expectSubmitted: (v) => expect(v).toEqual(['a']),
        requiredBlocksEmpty: false,
    },
    {
        type: 'multiselect',
        options: letterOptions,
        selector: 'input[role="combobox"]',
        fill: (el) => {
            fireEvent.keyDown(el, { key: 'ArrowDown' })
            fireEvent.keyDown(el, { key: 'Enter' })
        },
        expectSubmitted: (v) => expect(v).toEqual(['a']),
        requiredBlocksEmpty: false,
    },
    {
        type: 'multi-autocomplete',
        selector: '.custom-multi-autocomplete input',
        fill: (el) => {
            change(el, 'react')
            fireEvent.keyDown(el, { key: 'Enter' })
        },
        expectSubmitted: (v) => expect(v).toEqual(['react']),
        requiredBlocksEmpty: false,
    },
]

// Every type the control router switches on. A new one has to be listed here
// and then given a case above, or the coverage test below fails.
const routedTypes: Record<ControlType, true> = {
    text: true,
    numeric: true,
    textarea: true,
    select: true,
    checkbox: true,
    radio: true,
    email: true,
    url: true,
    date: true,
    time: true,
    datetime: true,
    'checkbox-group': true,
    switch: true,
    password: true,
    multiselect: true,
    autocomplete: true,
    'multi-autocomplete': true,
    phone: true,
}

const configFor = (c: ControlCase, validation?: FormConfig[number]['validation']): FormConfig => [
    { name: FIELD, type: c.type, label: LABEL, options: c.options, validation },
]

describe('the native renderer covers every routed control type', () => {
    it('has one case per type the router handles, and no duplicates', () => {
        const covered = cases.map((c) => c.type)
        expect(new Set(covered).size).toBe(covered.length)
        expect([...covered].sort()).toEqual(Object.keys(routedTypes).sort())
    })
})

describe.each(seamPaths)('the native renderer through the seam (%s)', (path) => {
    it.each(cases)('renders the $type control', (c) => {
        const { control } = mount(path, configFor(c))
        expect(control(c.selector)).toBeInTheDocument()
    })

    it.each(cases)('labels the $type field', (c) => {
        const { container } = mount(path, configFor(c))
        expect(within(container).getByText(LABEL)).toBeInTheDocument()
    })
})

const arrayTypes: ControlType[] = ['checkbox-group', 'multiselect', 'multi-autocomplete']
const isArrayCase = (c: ControlCase) => arrayTypes.includes(c.type)

describe.each(seamPaths)('a value typed into the native renderer (%s)', (path) => {
    it.each(cases)('reaches the payload from a $type control', async (c) => {
        const { control, submit, onSubmit } = mount(path, configFor(c))
        c.fill(control(c.selector))
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalled())
        c.expectSubmitted((onSubmit.mock.calls[0][0] as Record<string, unknown>)[FIELD])
    })
})

describe.each(seamPaths)('validation still fires through the seam (%s)', (path) => {
    it.each(cases.filter((c) => c.requiredBlocksEmpty))(
        'refuses an empty required $type field',
        async (c) => {
            const { submit, onSubmit, errors } = mount(path, configFor(c, ['required']))
            submit()
            await waitFor(() => expect(errors()).toHaveLength(1))
            expect(onSubmit).not.toHaveBeenCalled()
            if (c.requiredMessage) expect(errors()[0]).toBe(c.requiredMessage)
        },
    )

    it.each(cases.filter((c) => c.requiredMessage))(
        'clears the error and submits once the $type field is filled',
        async (c) => {
            const { control, submit, onSubmit, errors } = mount(path, configFor(c, ['required']))
            submit()
            await waitFor(() => expect(errors()).toHaveLength(1))

            c.fill(control(c.selector))
            submit()
            await waitFor(() => expect(onSubmit).toHaveBeenCalled())
            expect(errors()).toHaveLength(0)
        },
    )

    it.each(cases.filter((c) => !c.requiredBlocksEmpty && !isArrayCase(c)))(
        'lets an empty required $type field through, since its empty value is a valid one',
        async (c) => {
            const { submit, onSubmit } = mount(path, configFor(c, ['required']))
            submit()
            await waitFor(() => expect(onSubmit).toHaveBeenCalled())
            expect((onSubmit.mock.calls[0][0] as Record<string, unknown>)[FIELD]).toBe(false)
        },
    )

    it(`applies a rule to the value a control produced, not only to a hand-written one`, async () => {
        const { control, submit, onSubmit, errors } = mount(path, [
            {
                name: FIELD,
                type: 'numeric',
                label: LABEL,
                validation: [{ rule: 'min', value: 18 }],
            },
        ])
        change(control('.custom-numeric-input input'), '7')
        submit()
        await waitFor(() => expect(errors()).toEqual(['Must be at least 18']))
        expect(onSubmit).not.toHaveBeenCalled()
    })
})

describe.each(seamPaths)('an array-valued config field (%s)', (path) => {
    const arrayCases = cases.filter(isArrayCase)

    it.each(arrayCases)('renders and collects a $type selection', (c) => {
        const { container, control } = mount(path, configFor(c))
        c.fill(control(c.selector))
        expect(container.textContent).toContain(c.type === 'multi-autocomplete' ? 'react' : 'Apple')
    })

    it.each(arrayCases)('submits the empty list it is seeded with ($type)', async (c) => {
        const { submit, onSubmit, errors } = mount(path, configFor(c))
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalled())
        expect((onSubmit.mock.calls[0][0] as Record<string, unknown>)[FIELD]).toEqual([])
        expect(errors()).toHaveLength(0)
    })

    it.each(arrayCases)('submits a $type selection under a validation list', async (c) => {
        const { control, submit, onSubmit } = mount(
            path,
            configFor(c, ['required', { rule: 'maxLength', value: 5 }]),
        )
        c.fill(control(c.selector))
        submit()
        await waitFor(() => expect(onSubmit).toHaveBeenCalled())
        c.expectSubmitted((onSubmit.mock.calls[0][0] as Record<string, unknown>)[FIELD])
    })

    it.each(arrayCases)(
        'does not enforce required on an empty $type field, as the limits state',
        async (c) => {
            const { submit, onSubmit } = mount(path, configFor(c, ['required']))
            submit()
            await waitFor(() => expect(onSubmit).toHaveBeenCalled())
            expect((onSubmit.mock.calls[0][0] as Record<string, unknown>)[FIELD]).toEqual([])
        },
    )
})

// react-select and react-phone-input-2 number their instances, and React's
// useId counts per mount, so two renders of the same tree differ in ids alone.
const normalise = (html: string) =>
    html
        .replace(/react-select-\d+/g, 'react-select-N')
        .replace(/:r[0-9a-z]+:/g, ':rN:')
        .replace(/\bid="[^"]*\d+[^"]*"/g, 'id="N"')

describe('the default path and an explicit native provider agree', () => {
    const everyType: FormConfig = cases.map((c) => ({
        name: c.type.replace('-', '_'),
        type: c.type,
        label: c.type,
        options: c.options,
    }))

    it('render the same markup for every control type', () => {
        const fromDefault = mount('default', everyType)
        const fromProvider = mount('provider', everyType)
        expect(normalise(fromProvider.container.innerHTML)).toBe(
            normalise(fromDefault.container.innerHTML),
        )
    })

    it('resolve every routed type to the one native renderer', () => {
        const resolved = Object.keys(routedTypes).map((type) =>
            resolveFieldRenderer(nativeRenderers, type as ControlType),
        )
        expect(new Set(resolved)).toEqual(new Set([NativeFieldRenderer]))
    })
})
