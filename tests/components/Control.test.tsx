// @vitest-environment jsdom
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Control from '../../src/controls/Control'

describe('Control router', () => {
    it('renders a text input for type="text"', () => {
        render(<Control type="text" value="hello" onChange={() => {}} />)
        expect(screen.getByDisplayValue('hello')).toBeInTheDocument()
    })

    it('renders a numeric input for type="numeric"', () => {
        render(<Control type="numeric" value={42} onChange={() => {}} />)
        expect(screen.getByDisplayValue('42')).toBeInTheDocument()
    })

    it('renders a select with its options for type="select"', () => {
        render(
            <Control
                type="select"
                value=""
                onChange={() => {}}
                options={[
                    { value: 'a', label: 'Apple' },
                    { value: 'b', label: 'Banana' },
                ]}
            />,
        )
        expect(screen.getByRole('combobox')).toBeInTheDocument()
        expect(screen.getByText('Apple')).toBeInTheDocument()
    })

    it('renders a checked checkbox for type="checkbox"', () => {
        render(<Control type="checkbox" value={true} onChange={() => {}} />)
        expect(screen.getByRole('checkbox')).toBeChecked()
    })

    it('falls back to a text input for an unknown type', () => {
        render(<Control type={'unknown' as any} value="x" onChange={() => {}} />)
        expect(screen.getByDisplayValue('x')).toBeInTheDocument()
    })

    it('autofocuses the text input when autoFocus is set', () => {
        render(<Control type="text" value="x" onChange={() => {}} autoFocus />)
        expect(screen.getByDisplayValue('x')).toHaveFocus()
    })

    it('forwards onFocus to the text input', () => {
        const onFocus = vi.fn()
        render(<Control type="text" value="x" onChange={() => {}} onFocus={onFocus} />)
        fireEvent.focus(screen.getByDisplayValue('x'))
        expect(onFocus).toHaveBeenCalledTimes(1)
    })

    it('forwards readOnly to the text input', () => {
        render(<Control type="text" value="x" onChange={() => {}} readOnly />)
        expect(screen.getByDisplayValue('x')).toHaveAttribute('readonly')
    })

    it('applies className to the radio group', () => {
        render(
            <Control
                type="radio"
                value="a"
                onChange={() => {}}
                options={[{ value: 'a', label: 'A' }]}
                className="my-radios"
            />,
        )
        expect(screen.getByRole('radiogroup')).toHaveClass('custom-radio-group', 'my-radios')
    })
})
