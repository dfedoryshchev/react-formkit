import React, { forwardRef } from 'react'
import { Option } from '../types'

interface SelectInputProps {
    value: string
    onChange: (value: string) => void
    options: Option[]
    placeholder?: string
    disabled?: boolean
    className?: string
}

const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
    ({ value, onChange, options, placeholder, disabled, className }, ref) => {
        return (
            <select
                ref={ref}
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                className={className}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map(opt => (
                    <option key={String(opt.value)} value={String(opt.value)}>
                        {opt.label}
                    </option>
                ))}
            </select>
        )
    }
)

SelectInput.displayName = 'SelectInput'

export default SelectInput
