import React from 'react'
import { ConditionalField } from '@/field'
import type { FormConfig } from './config.types'
import { fieldRenderProps, resolveFieldRenderer } from './renderer'
import { useFieldRenderers } from './RendererContext'
import type { FieldRendererRegistry } from './renderer.types'

interface ConfigFieldsProps {
    config: FormConfig
    renderers?: FieldRendererRegistry
}

// Renders the ordered field list, resolving each field through the renderer
// registry. Conditional visibility is applied here rather than inside the
// renderer, so a renderer that knows nothing about `showWhen` still gets it.
export const ConfigFields: React.FC<ConfigFieldsProps> = ({ config, renderers }) => {
    const inherited = useFieldRenderers()
    const registry = renderers ?? inherited

    return (
        <>
            {config.map((field) => {
                const Renderer = resolveFieldRenderer(registry, field.type)
                const control = <Renderer key={field.name} {...fieldRenderProps(field)} />

                if (!field.showWhen) return control

                const { field: watched, ...condition } = field.showWhen
                return (
                    <ConditionalField
                        key={field.name}
                        when={watched}
                        clear={field.name}
                        {...condition}
                    >
                        {control}
                    </ConditionalField>
                )
            })}
        </>
    )
}
