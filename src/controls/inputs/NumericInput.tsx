import React, { forwardRef, useState, useEffect } from 'react'
import { NumericInputProps } from '../../types'
import './NumericInput.scss'

const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
    ({ value, onChange, placeholder, disabled }, ref) => {
        const [displayValue, setDisplayValue] = useState<string>(
            value !== undefined ? String(value) : '',
        )

        useEffect(() => {
            setDisplayValue(value !== undefined ? String(value) : '')
        }, [value])

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        }

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
