import React, { forwardRef } from 'react'
import './DateInput.scss'

interface DateInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    min?: string
    max?: string
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
    ({ value, onChange, placeholder, disabled, min, max }, ref) => {
        return (
            <div className="custom-date-input">
                <input
                    ref={ref}
                    type="date"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    min={min}
                    max={max}
                />
            </div>
        )
    },
)

DateInput.displayName = 'DateInput'

export default DateInput
