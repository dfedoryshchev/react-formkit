import type { ControlType } from '@/controls/Control'
import type { Option } from '@/controls/control.types'

// Validation rules expressed as data; resolved to a zod schema by buildSchema.
export type ValidationDescriptor =
    | 'required'
    | { rule: 'minLength'; value: number; message?: string }
    | { rule: 'maxLength'; value: number; message?: string }
    | { rule: 'min'; value: number; message?: string }
    | { rule: 'max'; value: number; message?: string }
    | { rule: 'pattern'; value: RegExp; message?: string }
    | { rule: 'email'; message?: string }

// A single field, described as data. UI-agnostic on purpose so the same config
// can later target different renderers / adapters.
// TODO: nested + array field support (no `fields?: FieldConfig[]` recursion yet,
// so object- and array-shaped values cannot be modelled).
export interface FieldConfig {
    name: string
    type: ControlType
    label?: string
    placeholder?: string
    defaultValue?: unknown
    options?: Option[]
    validation?: ValidationDescriptor[]
    disabled?: boolean
}

export type FormConfig = FieldConfig[]
