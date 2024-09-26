import React, { forwardRef } from 'react'

interface CheckboxInputProps {
    checked: boolean
    onChange: (checked: boolean) => void
    label?: string
    disabled?: boolean
    className?: string
}

const CheckboxInput = forwardRef<HTMLInputElement, CheckboxInputProps>(
    ({ checked, onChange, label, disabled, className }, ref) => {
        return (
            <label className={className}>
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
