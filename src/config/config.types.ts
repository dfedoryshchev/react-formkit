import type { ControlType } from '@/controls/Control'
import type { Option } from '@/controls/control.types'
import type { FieldCondition } from '@/field'

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
// TODO: array field support (no repeated FieldConfig yet, so array-shaped
// values cannot be modelled).
export interface FieldConfig {
    name: string
    type: ControlType
    label?: string
    placeholder?: string
    description?: string
    defaultValue?: unknown
    options?: Option[]
    validation?: ValidationDescriptor[]
    disabled?: boolean
    // Render this field only while a sibling field matches the condition.
    showWhen?: FieldCondition
}

// Several fields held as one object value under `name`, such as an address or a
// date range. A child's `name` is its key inside that object, and a child's
// `showWhen` watches a sibling inside the same group.
export interface CompositeFieldConfig {
    name: string
    type: 'group'
    fields: FormConfig
}

export type FormConfigEntry = FieldConfig | CompositeFieldConfig

export type FormConfig = FormConfigEntry[]
