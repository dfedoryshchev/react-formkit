import type { FocusEventHandler } from 'react'

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
    readOnly?: boolean
    autoFocus?: boolean
    onFocus?: FocusEventHandler<HTMLInputElement>
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
    readOnly?: boolean
}
