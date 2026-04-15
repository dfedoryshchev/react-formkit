import React, { forwardRef, useState } from 'react'
import { BaseInputProps } from '../control.types'
import './PasswordInput.scss'

const PasswordInput = forwardRef<HTMLInputElement, BaseInputProps>(
    ({ value, onChange, placeholder, disabled, className, ...rest }, ref) => {
        const [visible, setVisible] = useState(false)

        return (
            <div className="custom-password-input">
                <input
                    ref={ref}
                    type={visible ? 'text' : 'password'}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={className}
                    {...rest}
                />
                <button
                    type="button"
                    className="custom-password-input__toggle"
                    onClick={() => setVisible((v) => !v)}
                    disabled={disabled}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                >
                    {visible ? 'Hide' : 'Show'}
                </button>
            </div>
        )
    },
)

PasswordInput.displayName = 'PasswordInput'

export default PasswordInput
