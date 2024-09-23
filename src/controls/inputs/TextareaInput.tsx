import React, { forwardRef } from 'react'

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
            <textarea
                ref={ref}
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                className={className}
            />
        )
    }
)

TextareaInput.displayName = 'TextareaInput'

export default TextareaInput
