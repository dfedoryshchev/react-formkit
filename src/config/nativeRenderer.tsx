import React from 'react'
import { CompositeField, FormField } from '@/field'
import type {
    ArrayItemRenderProps,
    ArrayRenderProps,
    FieldRenderProps,
    FieldRendererRegistry,
    GroupRenderProps,
} from './renderer.types'

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

// The library's own array renderer: a fieldset around the items, then the add
// control.
export const NativeArrayRenderer: React.FC<ArrayRenderProps> = ({ array, children, append }) => (
    <CompositeField name={array.name} label={array.label} description={array.description}>
        {children}
        <button type="button" onClick={append}>
            {array.addLabel ?? 'Add'}
        </button>
    </CompositeField>
)

// The library's own item renderer: one item as a fieldset, with its remove
// control.
export const NativeArrayItemRenderer: React.FC<ArrayItemRenderProps> = ({
    array,
    item,
    children,
}) => (
    <CompositeField
        name={item.name}
        label={array.itemLabel ? `${array.itemLabel} ${item.index + 1}` : undefined}
        layout={array.layout}
    >
        {children}
        <button type="button" onClick={item.remove}>
            {array.removeLabel ?? 'Remove'}
        </button>
    </CompositeField>
)

// One entry on purpose. `Control`'s switch is the only place a control type is
// mapped to a component; listing types in `byType` here would be a second such
// place, free to drift from the router the rest of the library renders through.
export const nativeRenderers: FieldRendererRegistry = { fallback: NativeFieldRenderer }
