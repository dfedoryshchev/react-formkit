import { ControlProps } from '@/controls/control.types'

export interface FieldProps extends Omit<ControlProps, 'value' | 'onChange'> {
    name: string
    label?: string
    required?: boolean
    defaultValue?: unknown
}

export interface InnerFieldProps {
    value: unknown
    onChange: (value: unknown) => void
    onBlur: () => void
    errorMessage?: string
    name: string
    ref?: React.Ref<unknown>
}

export interface MetadataProps {
    label?: string
    required?: boolean
    type: string
}

export type WrappedControlProps = InnerFieldProps & MetadataProps & Record<string, unknown>
