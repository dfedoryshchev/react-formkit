import React, { forwardRef } from 'react'
import './CheckboxGroup.scss'

interface CheckboxOption {
    value: string
    label: string
}

interface CheckboxGroupProps {
    value: string[]
    onChange: (value: string[]) => void
    options: CheckboxOption[]
    disabled?: boolean
    className?: string
}

const CheckboxGroup = forwardRef<HTMLDivElement, CheckboxGroupProps>(
    ({ value = [], onChange, options, disabled, className }, ref) => {
        const handleToggle = (optValue: string) => {
            const next = value.includes(optValue)
                ? value.filter((v) => v !== optValue)
                : [...value, optValue]
            onChange(next)
        }

        return (
            <div
                ref={ref}
                className={`custom-checkbox-group ${className ?? ''}`.trim()}
                role="group"
            >
                {options.map((opt) => (
                    <label key={opt.value} className="custom-checkbox-group__item">
                        <input
                            type="checkbox"
                            checked={value.includes(opt.value)}
                            onChange={() => handleToggle(opt.value)}
                            disabled={disabled}
                        />
                        <span>{opt.label}</span>
                    </label>
                ))}
            </div>
        )
    },
)

CheckboxGroup.displayName = 'CheckboxGroup'

export default CheckboxGroup
