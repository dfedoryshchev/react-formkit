import React from 'react'
import Select from 'react-select'
import { Option } from '../control.types'

interface MultiSelectInputProps {
    value: string[]
    onChange: (value: string[]) => void
    options: Option[]
    placeholder?: string
    isDisabled?: boolean
}

// POC: first pass at wiring react-select for multi-value selection. Value
// mapping is NOT handled yet - react-select works in terms of {label,value}
// option objects, but the form stores raw values. Selected chips will not
// reflect stored values and onChange will emit option objects rather than raw
// values. Addressed in follow-ups.
const MultiSelectInput: React.FC<MultiSelectInputProps> = ({
    value,
    onChange,
    options,
    placeholder,
    isDisabled,
}) => {
    return (
        <Select
            isMulti
            options={options as any}
            value={value as any}
            onChange={(selected: any) => onChange(selected)}
            placeholder={placeholder}
            isDisabled={isDisabled}
        />
    )
}

export default MultiSelectInput
