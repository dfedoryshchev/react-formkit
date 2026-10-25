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

const renderEntries = (
    config: FormConfig,
    registry: FieldRendererRegistry,
    prefix: string,
): React.ReactNode[] =>
    config.map((entry) => {
        if (entry.type === 'group') {
            return (
                <React.Fragment key={entry.name}>
                    {renderEntries(entry.fields, registry, `${prefix}${entry.name}.`)}
                </React.Fragment>
            )
        }

        const field = prefix ? { ...entry, name: `${prefix}${entry.name}` } : entry
        const Renderer = resolveFieldRenderer(registry, field.type)
        const control = <Renderer key={field.name} {...fieldRenderProps(field)} />

        if (!field.showWhen) return control

        const { field: watched, ...condition } = field.showWhen
        return (
            <ConditionalField
                key={field.name}
                when={`${prefix}${watched}`}
                clear={field.name}
                {...condition}
            >
                {control}
            </ConditionalField>
        )
    })

// Renders the ordered field list, resolving each field through the renderer
// registry. Conditional visibility is applied here rather than inside the
// renderer, so a renderer that knows nothing about `showWhen` still gets it.
export const ConfigFields: React.FC<ConfigFieldsProps> = ({ config, renderers }) => {
    const inherited = useFieldRenderers()
    const registry = renderers ?? inherited

    return <>{renderEntries(config, registry, '')}</>
}
