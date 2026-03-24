import React, { forwardRef } from 'react'
import './CheckboxInput.scss'

interface CheckboxInputProps {
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
    className?: string
}

// Bare checkbox. The wrapping label (and its text) is supplied by the
// withWrappingLabel HOC at the field level.
const CheckboxInput = forwardRef<HTMLInputElement, CheckboxInputProps>(
    ({ checked, onChange, disabled, className }, ref) => {
        return (
            <span className={`custom-checkbox-input-restarted ${className ?? ''}`.trim()}>
                <input
                    ref={ref}
                    type="checkbox"
                    checked={!!checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                />
            </span>
        )
    },
)

CheckboxInput.displayName = 'CheckboxInput'

export default CheckboxInput
