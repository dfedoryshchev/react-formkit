export interface BaseInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export interface NumericInputProps {
    value: number | undefined
    onChange: (value: number | undefined) => void
    placeholder?: string
    disabled?: boolean
    min?: number
    max?: number
}

export interface Option<T = string> {
    value: T
    label: string
}

export interface SelectInputProps {
    value: string
    onChange: (value: string) => void
    options: Option[]
    placeholder?: string
    disabled?: boolean
}

export interface CheckboxInputProps {
    checked: boolean
    onChange: (checked: boolean) => void
    label?: string
    disabled?: boolean
}
