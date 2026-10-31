import type { ControlType } from '@/controls/Control'
import type { FieldConfig } from './config.types'
import { NativeArrayItemRenderer, NativeArrayRenderer, NativeGroupRenderer } from './nativeRenderer'
import type {
    ArrayItemRenderer,
    ArrayRenderer,
    FieldRenderProps,
    FieldRenderer,
    FieldRendererRegistry,
    GroupRenderer,
} from './renderer.types'

export const fieldRenderProps = (field: FieldConfig): FieldRenderProps => ({
    field,
    // A conditional field's schema key is deliberately lenient (buildSchema
    // enforces it in a refinement instead), so the required marker has to come
    // from the config directly. Every other field is left to the schema, which
    // is why this stays undefined rather than false.
    required: field.showWhen ? (field.validation ?? []).includes('required') : undefined,
})

export const resolveFieldRenderer = (
    registry: FieldRendererRegistry,
    type: ControlType,
): FieldRenderer => registry.byType?.[type] ?? registry.fallback

export const resolveGroupRenderer = (registry: FieldRendererRegistry): GroupRenderer =>
    registry.group ?? NativeGroupRenderer

export const resolveArrayRenderer = (registry: FieldRendererRegistry): ArrayRenderer =>
    registry.array ?? NativeArrayRenderer

export const resolveArrayItemRenderer = (registry: FieldRendererRegistry): ArrayItemRenderer =>
    registry.arrayItem ?? NativeArrayItemRenderer
