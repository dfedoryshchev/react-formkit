// @vitest-environment jsdom
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SelectInput from '../../src/controls/inputs/SelectInput'

const options = [
    { value: 'a', label: 'Apple' },
    { value: 'b', label: 'Banana' },
]

describe('SelectInput', () => {
    it('renders the placeholder and options', () => {
        render(<SelectInput value="" onChange={() => {}} options={options} placeholder="Pick one" />)
        expect(screen.getByText('Pick one')).toBeInTheDocument()
        expect(screen.getByText('Apple')).toBeInTheDocument()
        expect(screen.getByText('Banana')).toBeInTheDocument()
    })

    it('reflects the selected value', () => {
        render(<SelectInput value="b" onChange={() => {}} options={options} />)
        expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('b')
    })

    it('calls onChange with the raw option value on selection', () => {
        const onChange = vi.fn()
        render(<SelectInput value="" onChange={onChange} options={options} />)
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'a' } })
        expect(onChange).toHaveBeenCalledWith('a')
    })
})
