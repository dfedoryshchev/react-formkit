import type { ControlType } from '@/controls/Control'
import type { Option } from '@/controls/control.types'
import type { FieldCondition, GroupLayout } from '@/field'

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
// `showWhen` watches a sibling inside the same group; the group's own
// `showWhen` watches a sibling of the group.
export interface CompositeFieldConfig {
    name: string
    type: 'group'
    fields: FormConfig
    label?: string
    description?: string
    layout?: GroupLayout
    showWhen?: FieldCondition
}

// A list of items that each hold the same `fields`, submitted as an array of
// objects under `name`, such as a list of contacts. Inside an item, a child's
// `name` is its key in that item and a child's `showWhen` watches a sibling in
// the same item; the array's own `showWhen` watches a sibling of the array.
export interface FieldArrayConfig {
    name: string
    type: 'array'
    fields: FormConfig
    label?: string
    description?: string
    // Each item's legend is this followed by its position, `Contact 1`.
    itemLabel?: string
    // How the fields inside one item are laid out.
    layout?: GroupLayout
    // The starting items. An item that leaves a field out gets that field's
    // own default.
    defaultValue?: Record<string, unknown>[]
    addLabel?: string
    removeLabel?: string
    showWhen?: FieldCondition
}

export type FormConfigEntry = FieldConfig | CompositeFieldConfig | FieldArrayConfig

export type FormConfig = FormConfigEntry[]
