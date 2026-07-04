// @vitest-environment jsdom
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MultiAutocompleteInput from '../../src/controls/selects/MultiAutocompleteInput'

describe('MultiAutocompleteInput', () => {
    it('adds a tag on Enter', () => {
        const onChange = vi.fn()
        render(<MultiAutocompleteInput value={[]} onChange={onChange} placeholder="Add tag" />)
        const input = screen.getByPlaceholderText('Add tag')
        fireEvent.change(input, { target: { value: 'react' } })
        fireEvent.keyDown(input, { key: 'Enter' })
        expect(onChange).toHaveBeenCalledWith(['react'])
    })

    it('keeps a pending typed value when the input loses focus without Enter', () => {
        const onChange = vi.fn()
        render(<MultiAutocompleteInput value={[]} onChange={onChange} placeholder="Add tag" />)
        const input = screen.getByPlaceholderText('Add tag')
        fireEvent.change(input, { target: { value: 'typescript' } })
        // user tabs / submits the form without pressing Enter first
        fireEvent.blur(input)
        expect(onChange).toHaveBeenCalledWith(['typescript'])
    })
})
