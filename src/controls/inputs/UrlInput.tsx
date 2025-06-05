import React, { forwardRef } from 'react'
import { BaseInputProps } from '../control.types'
import './UrlInput.scss'

const UrlInput = forwardRef<HTMLInputElement, BaseInputProps>(
    ({ value, onChange, placeholder, disabled, className }, ref) => {
        return (
            <div className="custom-url-input">
                <input
                    ref={ref}
                    type="url"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder || 'https://'}
                    disabled={disabled}
                    className={className}
                />
            </div>
        )
    },
)

UrlInput.displayName = 'UrlInput'

export default UrlInput
