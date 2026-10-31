import React from 'react'
import { ConditionalField } from '@/field'
import { useFieldArrayRows } from '@/field/FormFieldArray'
import type { FieldArrayConfig, FormConfig } from './config.types'
import {
    fieldRenderProps,
    resolveArrayItemRenderer,
    resolveArrayRenderer,
    resolveFieldRenderer,
    resolveGroupRenderer,
} from './renderer'
import { useFieldRenderers } from './RendererContext'
import type { FieldRendererRegistry } from './renderer.types'
import { defaultsOf } from './useFormFromConfig'

interface ConfigFieldsProps {
    config: FormConfig
    renderers?: FieldRendererRegistry
}

interface ConfigArrayProps {
    array: FieldArrayConfig
    registry: FieldRendererRegistry
    insideConditional: boolean
}

const ConfigArray: React.FC<ConfigArrayProps> = ({ array, registry, insideConditional }) => {
    const { rows, append } = useFieldArrayRows(array.name)
    const ArrayRenderer = resolveArrayRenderer(registry)
    const ItemRenderer = resolveArrayItemRenderer(registry)

    return (
        <ArrayRenderer
            array={array}
            append={() => append(defaultsOf(array.fields))}
            count={rows.length}
        >
            {rows.map((row) => (
                <ItemRenderer key={row.id} array={array} item={row}>
                    {renderEntries(array.fields, registry, `${row.name}.`, insideConditional)}
                </ItemRenderer>
            ))}
        </ArrayRenderer>
    )
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
        } else if (entry.type === 'array') {
            node = (
                <ConfigArray
                    key={path}
                    array={{ ...entry, name: path }}
                    registry={registry}
                    insideConditional={insideConditional || entry.showWhen !== undefined}
                />
            )
        } else {
            const field = prefix ? { ...entry, name: path } : entry
            const Renderer = resolveFieldRenderer(registry, field.type)
            const props = fieldRenderProps(field)
            // Inside a conditional group or array the whole key is lenient in
            // the schema, so the schema can no longer say which child is
            // required.
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

// Renders the ordered field list, resolving each field, group and array through
// the renderer registry. Conditional visibility is applied here rather than
// inside the renderer, so a renderer that knows nothing about `showWhen` still
// gets it.
export const ConfigFields: React.FC<ConfigFieldsProps> = ({ config, renderers }) => {
    const inherited = useFieldRenderers()
    const registry = renderers ?? inherited

    return <>{renderEntries(config, registry, '', false)}</>
}
