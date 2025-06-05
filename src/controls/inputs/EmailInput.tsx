import React, { forwardRef } from 'react'
import { BaseInputProps } from '../control.types'
import './EmailInput.scss'

const EmailInput = forwardRef<HTMLInputElement, BaseInputProps>(
    ({ value, onChange, placeholder, disabled, className }, ref) => {
        return (
            <div className="custom-email-input">
                <input
                    ref={ref}
                    type="email"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder || 'email@example.com'}
                    disabled={disabled}
                    className={className}
                />
            </div>
        )
    },
)

EmailInput.displayName = 'EmailInput'

export default EmailInput
