import React, { forwardRef } from 'react'
import './TimeInput.scss'

interface TimeInputProps {
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    step?: number
    min?: string
    max?: string
}

const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
    ({ value, onChange, disabled, step, min, max }, ref) => {
        return (
            <div className="custom-time-input">
                <input
                    ref={ref}
                    type="time"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    step={step}
                    min={min}
                    max={max}
                />
            </div>
        )
    },
)

TimeInput.displayName = 'TimeInput'

export default TimeInput
