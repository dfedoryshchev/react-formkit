import React from 'react'
import { ConditionalField, FormField } from '@/field'
import type { FormConfig } from './config.types'
import { fieldRenderProps } from './renderer'

interface ConfigFieldsProps {
    config: FormConfig
}

// Renders the ordered field list straight onto the native Field/Control stack.
// TODO: resolve each field through a FieldRenderer, so the same config can
// target a UI-library adapter without touching this component.
export const ConfigFields: React.FC<ConfigFieldsProps> = ({ config }) => {
    return (
        <>
            {config.map((field) => {
                const { required } = fieldRenderProps(field)
                const control = (
                    <FormField
                        key={field.name}
                        name={field.name}
                        type={field.type}
                        label={field.label}
                        placeholder={field.placeholder}
                        options={field.options as any}
                        disabled={field.disabled}
                        required={required}
                    />
                )

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
