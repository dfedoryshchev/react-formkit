import React, { forwardRef } from 'react'
import { BaseInputProps } from '../control.types'
import './TextInput.scss'

const TextInput = forwardRef<HTMLInputElement, BaseInputProps>(
    ({ value, onChange, placeholder, disabled, className }, ref) => {
        return (
            <div className="custom-text-input-restarted">
                <input
                    ref={ref}
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={className}
                />
            </div>
        )
    },
)

TextInput.displayName = 'TextInput'

export default TextInput
