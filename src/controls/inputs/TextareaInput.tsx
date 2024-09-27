import React, { forwardRef } from 'react'
import './TextareaInput.scss'

interface TextareaInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    rows?: number
    className?: string
}

const TextareaInput = forwardRef<HTMLTextAreaElement, TextareaInputProps>(
    ({ value, onChange, placeholder, disabled, rows = 3, className }, ref) => {
        return (
            <div className="custom-textarea-input-restarted">
                <textarea
                    ref={ref}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={rows}
                    className={className}
                />
            </div>
        )
    },
)

TextareaInput.displayName = 'TextareaInput'

export default TextareaInput
