import React, { forwardRef } from 'react'
import { BaseInputProps } from '../types'

const TextInput = forwardRef<HTMLInputElement, BaseInputProps>(
    ({ value, onChange, placeholder, disabled, className }, ref) => {
        return (
            <input
                ref={ref}
                type="text"
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={className}
            />
        )
    }
)

TextInput.displayName = 'TextInput'

export default TextInput
