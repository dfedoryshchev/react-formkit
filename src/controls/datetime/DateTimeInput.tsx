import React, { forwardRef } from 'react'
import './DateTimeInput.scss'

interface DateTimeInputProps {
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    min?: string
    max?: string
}

const DateTimeInput = forwardRef<HTMLInputElement, DateTimeInputProps>(
    ({ value, onChange, disabled, min, max }, ref) => {
        return (
            <div className="custom-datetime-input">
                <input
                    ref={ref}
                    type="datetime-local"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    min={min}
                    max={max}
                />
            </div>
        )
    },
)

DateTimeInput.displayName = 'DateTimeInput'

export default DateTimeInput
