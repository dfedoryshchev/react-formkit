import type { ComponentType } from 'react'
import type { ControlType } from '@/controls/Control'
import type { FieldConfig } from './config.types'

// What a renderer is handed for one field of a config.
export interface FieldRenderProps {
    field: FieldConfig
    required?: boolean
}

// The contract a config renderer satisfies: one field in, its rendered form out.
export type FieldRenderer = ComponentType<FieldRenderProps>

// Which renderer takes which field type. `fallback` covers everything `byType`
// does not name, so a registry lists only the types it means to handle itself
// and a lookup can never come back empty.
export interface FieldRendererRegistry {
    fallback: FieldRenderer
    byType?: Partial<Record<ControlType, FieldRenderer>>
}
