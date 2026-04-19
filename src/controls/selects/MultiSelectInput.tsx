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

const MultiSelectInput: React.FC<MultiSelectInputProps> = ({
    value,
    onChange,
    options,
    placeholder,
    isDisabled,
}) => {
    // options now map to react-select's {label,value} shape...
    const reactSelectOptions = options.map((o) => ({ label: o.label, value: o.value }))

    return (
        <Select
            isMulti
            options={reactSelectOptions as any}
            // FIXME: value is raw string[] but react-select expects the matching
            // option objects, so selected chips do not render; and onChange emits
            // option objects rather than raw values. Value mapping still TODO.
            value={value as any}
            onChange={(selected: any) => onChange(selected)}
            placeholder={placeholder}
            isDisabled={isDisabled}
        />
    )
}

export default MultiSelectInput
