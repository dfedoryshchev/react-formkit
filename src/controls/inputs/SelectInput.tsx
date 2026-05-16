import React, { forwardRef, useEffect } from 'react'
import { Option } from '../control.types'
import {
    serializeValue,
    getOptionLabel,
    getOptionValue,
    isUnselected,
} from '../utils/select.utils'
import './SelectInput.scss'

interface SelectInputProps {
    value: unknown
    onChange: (value: unknown) => void
    options: Option[]
    placeholder?: string
    disabled?: boolean
    className?: string
    // opt-in: pre-select the first option when there is no placeholder and no
    // current value. Off by default so a form never starts with an unchosen value.
    autoSelectFirst?: boolean
}

const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
    ({ value, onChange, options, placeholder, disabled, className, autoSelectFirst = false }, ref) => {
        useEffect(() => {
            if (autoSelectFirst && !placeholder && isUnselected(value) && options.length > 0) {
                onChange(getOptionValue(options[0]))
            }
        }, [autoSelectFirst, placeholder, value, options, onChange])

        const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const selectedSerialized = e.target.value
            if (isUnselected(selectedSerialized)) {
                onChange(undefined)
                return
            }
            const found = options.find(
                (o) => serializeValue(getOptionValue(o)) === selectedSerialized,
            )
            onChange(found ? getOptionValue(found) : selectedSerialized)
        }

        const currentValue = value === null ? '' : serializeValue(value)

        return (
            <div className="custom-select-input">
                <select
                    ref={ref}
                    value={currentValue}
                    onChange={handleChange}
                    disabled={disabled}
                    className={className}
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {options.map((opt, i) => (
                        <option key={i} value={serializeValue(getOptionValue(opt))}>
                            {getOptionLabel(opt)}
                        </option>
                    ))}
                </select>
            </div>
        )
    },
)

SelectInput.displayName = 'SelectInput'

export default SelectInput
