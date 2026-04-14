import React, { forwardRef } from 'react'
import './SwitchInput.scss'

interface SwitchInputProps {
    checked?: boolean
    onChange?: (checked: boolean) => void
    disabled?: boolean
    className?: string
}

// Bare toggle switch (hidden checkbox + styled track/thumb). The label is
// supplied by the withWrappingLabel HOC at the field level.
const SwitchInput = forwardRef<HTMLInputElement, SwitchInputProps>(
    ({ checked, onChange, disabled, className }, ref) => {
        return (
            <span className={`switch-wrapper ${className ?? ''}`.trim()}>
                <input
                    ref={ref}
                    type="checkbox"
                    role="switch"
                    checked={!!checked}
                    onChange={(e) => onChange?.(e.target.checked)}
                    disabled={disabled}
                    className="switch-input-hidden"
                />
                <span className="switch-track">
                    <span className="switch-thumb" />
                </span>
            </span>
        )
    },
)

SwitchInput.displayName = 'SwitchInput'

export default SwitchInput
