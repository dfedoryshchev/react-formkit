import React from 'react'
import { CompositeField, FormField } from '@/field'
import type { FieldRenderProps, FieldRendererRegistry, GroupRenderProps } from './renderer.types'

// The library's own renderer: a config field on the Field/Control stack.
export const NativeFieldRenderer: React.FC<FieldRenderProps> = ({ field, required }) => (
    <FormField
        name={field.name}
        type={field.type}
        label={field.label}
        placeholder={field.placeholder}
        description={field.description}
        options={field.options as any}
        disabled={field.disabled}
        required={required}
    />
)

// The library's own group renderer: a config group as a CompositeField.
export const NativeGroupRenderer: React.FC<GroupRenderProps> = ({ group, children }) => (
    <CompositeField
        name={group.name}
        label={group.label}
        description={group.description}
        layout={group.layout}
    >
        {children}
    </CompositeField>
)

// One entry on purpose. `Control`'s switch is the only place a control type is
// mapped to a component; listing types in `byType` here would be a second such
// place, free to drift from the router the rest of the library renders through.
export const nativeRenderers: FieldRendererRegistry = { fallback: NativeFieldRenderer }
