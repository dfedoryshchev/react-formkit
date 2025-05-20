import React, { forwardRef } from 'react'
import './RadioInput.scss'

interface RadioInputProps {
    value: string
    checked: boolean
    onChange: (value: string) => void
    label: string
    name: string
    disabled?: boolean
}

const RadioInput = forwardRef<HTMLInputElement, RadioInputProps>(
    ({ value, checked, onChange, label, name, disabled }, ref) => {
        return (
            <label className="custom-radio-input">
                <input
                    ref={ref}
                    type="radio"
                    name={name}
                    value={value}
                    checked={checked}
                    onChange={() => onChange(value)}
                    disabled={disabled}
                />
                <span>{label}</span>
            </label>
        )
    },
)

RadioInput.displayName = 'RadioInput'

export default RadioInput
