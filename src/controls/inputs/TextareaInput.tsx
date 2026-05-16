import React, { forwardRef } from 'react'
import { AriaInputProps } from '../control.types'
import './TextareaInput.scss'

interface TextareaInputProps extends AriaInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    rows?: number
    className?: string
}

const TextareaInput = forwardRef<HTMLTextAreaElement, TextareaInputProps>(
    ({ value, onChange, placeholder, disabled, rows = 3, className, ...rest }, ref) => {
        return (
            <div className="custom-textarea-input">
                <textarea
                    ref={ref}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={rows}
                    className={className}
                    {...rest}
                />
            </div>
        )
    },
)

TextareaInput.displayName = 'TextareaInput'

export default TextareaInput
