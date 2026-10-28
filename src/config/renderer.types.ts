import type { ComponentType, ReactNode } from 'react'
import type { ControlType } from '@/controls/Control'
import type { CompositeFieldConfig, FieldConfig } from './config.types'

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

// Which renderer takes which field type. `fallback` covers everything `byType`
// does not name, so a registry lists only the types it means to handle itself
// and a lookup can never come back empty. A registry without `group` renders
// its groups through the native fieldset.
export interface FieldRendererRegistry {
    fallback: FieldRenderer
    byType?: Partial<Record<ControlType, FieldRenderer>>
    group?: GroupRenderer
}
