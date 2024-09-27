import React, { forwardRef } from 'react'
import './CheckboxInput.scss'

interface CheckboxInputProps {
    checked: boolean
    onChange: (checked: boolean) => void
    label?: string
    disabled?: boolean
    className?: string
}

const CheckboxInput = forwardRef<HTMLInputElement, CheckboxInputProps>(
    ({ checked, onChange, label, disabled }, ref) => {
        return (
            <label className="custom-checkbox-input-restarted">
                <input
                    ref={ref}
                    type="checkbox"
                    checked={!!checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                />
                {label && <span>{label}</span>}
            </label>
        )
    },
)

CheckboxInput.displayName = 'CheckboxInput'

export default CheckboxInput
