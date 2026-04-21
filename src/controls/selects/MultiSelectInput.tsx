import React from 'react'
import Select, { MultiValue } from 'react-select'
import { Option } from '../control.types'
import { serializeValue, getOptionValue, getOptionLabel } from '../utils/select.utils'

interface MultiSelectInputProps {
    value: string[]
    onChange: (value: string[]) => void
    options: Option[]
    placeholder?: string
    isDisabled?: boolean
}

type RSOption = { label: string; value: unknown }

const MultiSelectInput: React.FC<MultiSelectInputProps> = ({
    value,
    onChange,
    options,
    placeholder,
    isDisabled,
}) => {
    const reactSelectOptions: RSOption[] = options.map((o) => ({
        label: getOptionLabel(o),
        value: getOptionValue(o),
    }))

    // Map stored raw values back to react-select option objects by serialized
    // match. TODO: this serialize-compare workaround is not the clean fix - it
    // round-trips values through strings. A proper value<->option model is owed.
    const selected = (value ?? [])
        .map((v) => reactSelectOptions.find((o) => serializeValue(o.value) === serializeValue(v)))
        .filter(Boolean) as RSOption[]

    const handleChange = (next: MultiValue<RSOption>) => {
        onChange(next.map((o) => o.value) as string[])
    }

    return (
        <Select
            isMulti
            options={reactSelectOptions as any}
            value={selected as any}
            onChange={(next) => handleChange(next as MultiValue<RSOption>)}
            placeholder={placeholder}
            isDisabled={isDisabled}
        />
    )
}

export default MultiSelectInput
