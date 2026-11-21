// @vitest-environment jsdom
import React from 'react'
import { render, renderHook, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { BasicForm } from '../../src/form'
import { FormField } from '../../src/field'
import { ConfigFields } from '../../src/config'
import { useFormFromConfig } from '../../src/config/useFormFromConfig'
import type { FormConfig } from '../../src/config/config.types'
import FieldMessage from '../../src/field/FieldMessage'
import NumericInput from '../../src/controls/inputs/NumericInput'
import SelectInput from '../../src/controls/inputs/SelectInput'
import MultiSelectInput from '../../src/controls/selects/MultiSelectInput'
import AutocompleteInput from '../../src/controls/selects/AutocompleteInput'

const submit = async (onSubmit: ReturnType<typeof vi.fn>) => {
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    return onSubmit.mock.calls[0][0]
}

const renderOne = (field: React.ReactNode, defaultValues: Record<string, unknown>) => {
    const onSubmit = vi.fn()
    render(
        <BasicForm onSubmit={onSubmit} defaultValues={defaultValues}>
            {field}
            <button type="submit">Submit</button>
        </BasicForm>,
    )
    return onSubmit
}

const plainOptions = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
]

const openMenu = (container: HTMLElement) =>
    fireEvent.keyDown(container.querySelector('input') as HTMLElement, { key: 'ArrowDown' })

describe('MultiSelectInput', () => {
    it('shows the stored values as chips and adds a picked option', async () => {
        const onChange = vi.fn()
        const { container } = render(
            <MultiSelectInput value={['a']} onChange={onChange} options={plainOptions} />,
        )
        expect(screen.getByText('Alpha')).toBeInTheDocument()

        openMenu(container)
        await userEvent.click(await screen.findByText('Beta'))

        expect(onChange).toHaveBeenCalledWith(['a', 'b'])
    })

    it('matches stored object values to their options by content', () => {
        const options = [
            { value: { id: 1 }, label: 'One' },
            { value: { id: 2 }, label: 'Two' },
        ]
        render(
            <MultiSelectInput value={[{ id: 2 } as never]} onChange={() => {}} options={options} />,
        )

        expect(screen.getByText('Two')).toBeInTheDocument()
        expect(screen.queryByText('One')).not.toBeInTheDocument()
    })

    it('ignores a stored value that has no option', () => {
        render(<MultiSelectInput value={['gone']} onChange={() => {}} options={plainOptions} />)

        expect(screen.queryByText('gone')).not.toBeInTheDocument()
    })

    it('treats a missing value as nothing chosen', () => {
        render(
            <MultiSelectInput
                value={undefined as never}
                onChange={() => {}}
                options={plainOptions}
                placeholder="Pick"
            />,
        )

        expect(screen.getByText('Pick')).toBeInTheDocument()
    })
})

describe('AutocompleteInput', () => {
    it('links its suggestions to the input through a datalist', () => {
        const { container } = render(
            <AutocompleteInput value="" onChange={() => {}} suggestions={['Leeds', 'Luton']} />,
        )
        const input = screen.getByRole('combobox')
        const list = container.querySelector('datalist') as HTMLDataListElement

        expect(input.getAttribute('list')).toBe(list.id)
        expect(Array.from(list.options).map((o) => o.value)).toEqual(['Leeds', 'Luton'])
    })

    it('renders no datalist and no list attribute without suggestions', () => {
        const { container } = render(<AutocompleteInput value="" onChange={() => {}} />)

        expect(container.querySelector('datalist')).toBeNull()
        expect(screen.getByRole('textbox')).not.toHaveAttribute('list')
    })

    it('submits free text that is not among the suggestions', async () => {
        const onSubmit = renderOne(
            <FormField name="city" type="autocomplete" label="City" suggestions={['Leeds']} />,
            { city: '' },
        )

        await userEvent.type(screen.getByLabelText('City'), 'Hull')

        expect(await submit(onSubmit)).toEqual({ city: 'Hull' })
    })
})

describe('PhoneInput', () => {
    it('submits the typed number with the default country code in front', async () => {
        const onSubmit = renderOne(<FormField name="tel" type="phone" label="Phone" />, {
            tel: '',
        })

        await userEvent.type(screen.getByRole('textbox'), '7911123456')

        expect((await submit(onSubmit)).tel).toMatch(/^44\d+$/)
    })

    it('does not accept typing while disabled', async () => {
        renderOne(<FormField name="tel" type="phone" label="Phone" disabled />, { tel: '' })

        const box = screen.getByRole('textbox')
        await userEvent.type(box, '7911')

        expect(box).toBeDisabled()
        expect((box as HTMLInputElement).value).not.toContain('7911')
    })
})

describe('NumericInput', () => {
    it('submits the typed number as a number', async () => {
        const onSubmit = renderOne(<FormField name="n" type="numeric" label="N" />, {})

        await userEvent.type(screen.getByLabelText('N'), '12')

        expect(await submit(onSubmit)).toEqual({ n: 12 })
    })

    it('rejects text that is not a number', async () => {
        const onSubmit = renderOne(<FormField name="n" type="numeric" label="N" />, {})
        const box = screen.getByLabelText('N')

        await userEvent.type(box, 'abc')

        expect(box).toHaveValue('')
        expect((await submit(onSubmit)).n).toBeUndefined()
    })

    it('reports undefined when its box is emptied', () => {
        const onChange = vi.fn()
        render(<NumericInput value={7} onChange={onChange} aria-label="n" />)

        fireEvent.change(screen.getByLabelText('n'), { target: { value: '' } })

        expect(onChange).toHaveBeenCalledWith(undefined)
    })

    it('follows an external value change, including back to empty', () => {
        const { rerender } = render(<NumericInput value={3} onChange={() => {}} aria-label="n" />)
        expect(screen.getByLabelText('n')).toHaveValue('3')

        rerender(<NumericInput value={42} onChange={() => {}} aria-label="n" />)
        expect(screen.getByLabelText('n')).toHaveValue('42')

        rerender(<NumericInput value={undefined} onChange={() => {}} aria-label="n" />)
        expect(screen.getByLabelText('n')).toHaveValue('')
    })
})

describe('FieldMessage', () => {
    it('renders no element for an empty message', () => {
        const { container } = render(<FieldMessage message="" />)

        expect(container).toBeEmptyDOMElement()
    })

    it('renders no element while not visible', () => {
        const { container } = render(<FieldMessage message="Bad" visible={false} />)

        expect(container).toBeEmptyDOMElement()
    })

    it('renders the message with its type class', () => {
        render(<FieldMessage message="Careful" type="warning" />)

        expect(screen.getByText('Careful')).toHaveClass('custom-field-message--warning')
    })
})

describe('SelectInput value handling', () => {
    it('shows the placeholder for a null value', () => {
        render(
            <SelectInput
                value={null}
                onChange={() => {}}
                options={plainOptions}
                placeholder="Pick"
            />,
        )

        expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('')
    })

    it('reports undefined when the placeholder option is chosen again', () => {
        const onChange = vi.fn()
        render(
            <SelectInput value="a" onChange={onChange} options={plainOptions} placeholder="Pick" />,
        )

        fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } })

        expect(onChange).toHaveBeenCalledWith(undefined)
    })

    it('hands back an object option as the object, not its serialised text', () => {
        const onChange = vi.fn()
        const options = [{ value: { id: 7 }, label: 'Seven' }]
        render(<SelectInput value={undefined} onChange={onChange} options={options} />)

        fireEvent.change(screen.getByRole('combobox'), { target: { value: '{"id":7}' } })

        expect(onChange).toHaveBeenCalledWith({ id: 7 })
    })
})

describe('config engine defaults and order', () => {
    const config: FormConfig = [
        { name: 'name', type: 'text' },
        { name: 'agree', type: 'checkbox' },
        { name: 'tags', type: 'multiselect', options: plainOptions },
        { name: 'picks', type: 'checkbox-group', options: plainOptions },
        { name: 'age', type: 'numeric' },
    ]

    it('seeds each control type with a value it can render', () => {
        const { result } = renderHook(() => useFormFromConfig(config))

        expect(result.current.defaults).toMatchObject({
            name: '',
            agree: false,
            tags: [],
            picks: [],
        })
        expect(result.current.defaults.age).toBeUndefined()
    })

    it('keeps typed text with its field when the config order changes', async () => {
        const first: FormConfig = [
            { name: 'a', type: 'text', label: 'A' },
            { name: 'b', type: 'text', label: 'B' },
        ]
        const swapped: FormConfig = [first[1], first[0]]
        const Host = ({ cfg }: { cfg: FormConfig }) => (
            <BasicForm onSubmit={() => {}} defaultValues={{ a: '', b: '' }}>
                <ConfigFields config={cfg} />
            </BasicForm>
        )
        const { rerender } = render(<Host cfg={first} />)
        await userEvent.type(screen.getByLabelText('A'), 'typed')

        rerender(<Host cfg={swapped} />)

        expect(screen.getByLabelText('A')).toHaveValue('typed')
        expect(screen.getByLabelText('B')).toHaveValue('')
        const labels = screen.getAllByRole('textbox').map((n) => n.getAttribute('id'))
        expect(labels).toEqual(['b', 'a'])
    })
})
