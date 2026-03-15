export interface AriaInputProps {
    'aria-required'?: boolean
    'aria-invalid'?: boolean
    'aria-describedby'?: string
}

export interface BaseInputProps extends AriaInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export interface NumericInputProps extends AriaInputProps {
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
    value: unknown
    onChange: (value: unknown) => void
    options: Option[]
    placeholder?: string
    disabled?: boolean
    className?: string
}

export interface CheckboxInputProps {
    checked: boolean
    onChange: (checked: boolean) => void
    label?: string
    disabled?: boolean
    value?: unknown
}

export interface TextareaInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    rows?: number
    className?: string
}

// discriminated union for Control router
type TextControlProps = { type: 'text' } & BaseInputProps
type NumericControlProps = { type: 'numeric' } & NumericInputProps
type TextareaControlProps = { type: 'textarea' } & TextareaInputProps
type SelectControlProps = { type: 'select' } & SelectInputProps
type CheckboxControlProps = { type: 'checkbox' } & CheckboxInputProps

export type ControlProps =
    | TextControlProps
    | NumericControlProps
    | TextareaControlProps
    | SelectControlProps
    | CheckboxControlProps
