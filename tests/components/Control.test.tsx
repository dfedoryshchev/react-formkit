// @vitest-environment jsdom
import React from 'react'
import { render, screen } from '@testing-library/react'
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
})
