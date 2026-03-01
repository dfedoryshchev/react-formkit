import React, { forwardRef, useState, useCallback } from 'react'
import { NumericInputProps } from '../control.types'
import './NumericInput.scss'

const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
    ({ value, onChange, placeholder, disabled }, ref) => {
        const [displayValue, setDisplayValue] = useState<string>(
            value !== undefined ? String(value) : '',
        )

        // sync display when external value changes (e.g. form reset)
        const currentNumeric = displayValue === '' ? undefined : Number(displayValue)
        if (value !== currentNumeric && value !== undefined) {
            if (String(value) !== displayValue) {
                setDisplayValue(String(value))
            }
        } else if (value === undefined && displayValue !== '') {
            setDisplayValue('')
        }

        const handleChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const raw = e.target.value
                setDisplayValue(raw)

                if (raw === '') {
                    onChange(undefined)
                } else {
                    const num = Number(raw)
                    if (!isNaN(num)) {
                        onChange(num)
                    }
                }
            },
            [onChange],
        )

        return (
            <div className="custom-numeric-input-restarted">
                <input
                    ref={ref}
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    disabled={disabled}
                />
            </div>
        )
    },
)

NumericInput.displayName = 'NumericInput'

export default NumericInput
