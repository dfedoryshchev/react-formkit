import React from 'react'
import { FormField } from '@/field'
import type { FormConfig } from './config.types'

interface ConfigFieldsProps {
    config: FormConfig
}

// Renders the ordered field list straight onto the native Field/Control stack.
// TODO: extract a renderer interface when UI-library adapters land, so the same
// config can target native / Chakra / MUI without touching this component.
export const ConfigFields: React.FC<ConfigFieldsProps> = ({ config }) => {
    return (
        <>
            {config.map((field) => (
                <FormField
                    key={field.name}
                    name={field.name}
                    type={field.type}
                    label={field.label}
                    placeholder={field.placeholder}
                    options={field.options as any}
                    disabled={field.disabled}
                />
            ))}
        </>
    )
}
