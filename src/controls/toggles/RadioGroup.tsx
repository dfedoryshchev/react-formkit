import React, { forwardRef } from 'react'
import RadioInput from './RadioInput'
import './RadioGroup.scss'

interface RadioOption {
    value: string
    label: string
}

interface RadioGroupProps {
    value: string
    onChange: (value: string) => void
    options: RadioOption[]
    name: string
    disabled?: boolean
    className?: string
}

const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
    ({ value, onChange, options, name, disabled, className }, ref) => {
        return (
            <div
                ref={ref}
                className={`custom-radio-group ${className ?? ''}`.trim()}
                role="radiogroup"
            >
                {options.map((opt) => (
                    <RadioInput
                        key={opt.value}
                        value={opt.value}
                        checked={value === opt.value}
                        onChange={onChange}
                        label={opt.label}
                        name={name}
                        disabled={disabled}
                    />
                ))}
            </div>
        )
    },
)

RadioGroup.displayName = 'RadioGroup'

export default RadioGroup
