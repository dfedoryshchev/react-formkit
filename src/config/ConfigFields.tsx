import React from 'react'
import { ConditionalField } from '@/field'
import type { FormConfig } from './config.types'
import { fieldRenderProps, resolveFieldRenderer, resolveGroupRenderer } from './renderer'
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
    insideConditional: boolean,
): React.ReactNode[] =>
    config.map((entry) => {
        const path = `${prefix}${entry.name}`
        let node: React.ReactNode

        if (entry.type === 'group') {
            const GroupRenderer = resolveGroupRenderer(registry)
            node = (
                <GroupRenderer key={path} group={{ ...entry, name: path }}>
                    {renderEntries(
                        entry.fields,
                        registry,
                        `${path}.`,
                        insideConditional || entry.showWhen !== undefined,
                    )}
                </GroupRenderer>
            )
        } else {
            const field = prefix ? { ...entry, name: path } : entry
            const Renderer = resolveFieldRenderer(registry, field.type)
            const props = fieldRenderProps(field)
            // Inside a conditional group the whole group key is lenient in the
            // schema, so the schema can no longer say which child is required.
            if (insideConditional && props.required === undefined) {
                props.required = (field.validation ?? []).includes('required')
            }
            node = <Renderer key={path} {...props} />
        }

        if (!entry.showWhen) return node

        const { field: watched, ...condition } = entry.showWhen
        return (
            <ConditionalField key={path} when={`${prefix}${watched}`} clear={path} {...condition}>
                {node}
            </ConditionalField>
        )
    })

// Renders the ordered field list, resolving each field and each group through
// the renderer registry. Conditional visibility is applied here rather than
// inside the renderer, so a renderer that knows nothing about `showWhen` still
// gets it.
export const ConfigFields: React.FC<ConfigFieldsProps> = ({ config, renderers }) => {
    const inherited = useFieldRenderers()
    const registry = renderers ?? inherited

    return <>{renderEntries(config, registry, '', false)}</>
}
