import type { ComponentType, ReactNode } from 'react'
import type { ControlType } from '@/controls/Control'
import type { FieldArrayRow } from '@/field'
import type { CompositeFieldConfig, FieldArrayConfig, FieldConfig } from './config.types'

// What a renderer is handed for one field of a config.
export interface FieldRenderProps {
    field: FieldConfig
    required?: boolean
}

// The contract a config renderer satisfies: one field in, its rendered form out.
export type FieldRenderer = ComponentType<FieldRenderProps>

// What a group renderer is handed: the group, with its full path as `name`,
// and its children already rendered through the same registry.
export interface GroupRenderProps {
    group: CompositeFieldConfig
    children: ReactNode
}

export type GroupRenderer = ComponentType<GroupRenderProps>

// What an array renderer is handed: the array, with its full path as `name`,
// its items already rendered, and an `append` that adds an item seeded with
// the item fields' defaults.
export interface ArrayRenderProps {
    array: FieldArrayConfig
    children: ReactNode
    append: () => void
    count: number
}

export type ArrayRenderer = ComponentType<ArrayRenderProps>

// What an item renderer is handed: the item's row, carrying its path and its
// remove and move callbacks, and the item's fields already rendered.
export interface ArrayItemRenderProps {
    array: FieldArrayConfig
    item: FieldArrayRow
    children: ReactNode
}

export type ArrayItemRenderer = ComponentType<ArrayItemRenderProps>

// Which renderer takes which field type. `fallback` covers everything `byType`
// does not name, so a registry lists only the types it means to handle itself
// and a lookup can never come back empty. A registry without `group`, `array`
// or `arrayItem` renders those through the native fieldsets.
export interface FieldRendererRegistry {
    fallback: FieldRenderer
    byType?: Partial<Record<ControlType, FieldRenderer>>
    group?: GroupRenderer
    array?: ArrayRenderer
    arrayItem?: ArrayItemRenderer
}
