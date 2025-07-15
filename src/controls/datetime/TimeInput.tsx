import React, { forwardRef } from 'react'
import './TimeInput.scss'

interface TimeInputProps {
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    step?: number
}

const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
    ({ value, onChange, disabled, step }, ref) => {
        return (
            <div className="custom-time-input">
                <input
                    ref={ref}
                    type="time"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    step={step}
                />
            </div>
        )
    },
)

TimeInput.displayName = 'TimeInput'

export default TimeInput
