import React, { forwardRef } from 'react'
import { Option } from '../../types'
import { serializeValue, getOptionLabel, getOptionValue, isUnselected } from '../../utils/select.utils'

interface SelectInputProps {
    value: unknown
    onChange: (value: unknown) => void
    options: Option[]
    placeholder?: string
    disabled?: boolean
    className?: string
}

const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
    ({ value, onChange, options, placeholder, disabled, className }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const selectedSerialized = e.target.value
            if (isUnselected(selectedSerialized)) {
                onChange(undefined)
                return
            }
            const found = options.find(o => serializeValue(getOptionValue(o)) === selectedSerialized)
            onChange(found ? getOptionValue(found) : selectedSerialized)
        }

        return (
            <select
                ref={ref}
                value={serializeValue(value)}
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
        )
    }
)

SelectInput.displayName = 'SelectInput'

export default SelectInput
