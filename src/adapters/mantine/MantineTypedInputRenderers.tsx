import React from 'react'
import { TextInput } from '@mantine/core'
import { useController, useFormContext } from 'react-hook-form'
import { useIsFieldRequired } from '@/validation/useIsFieldRequired'
import type { FieldRenderer, FieldRenderProps } from '@/config/renderer.types'

const typedInputRenderer = (inputType: string, displayName: string): FieldRenderer => {
    const Renderer: React.FC<FieldRenderProps> = ({ field, required }) => {
        const { control } = useFormContext()
        const schemaRequired = useIsFieldRequired(field.name)
        const {
            field: { name, value, onChange, onBlur, ref },
            fieldState: { error },
        } = useController({ name: field.name, control })

        return (
            <TextInput
                ref={ref}
                name={name}
                type={inputType}
                value={value ?? ''}
                onChange={(e) => onChange(e.currentTarget.value)}
                onBlur={onBlur}
                label={field.label}
                description={field.description}
                placeholder={field.placeholder}
                disabled={field.disabled}
                withAsterisk={required ?? schemaRequired}
                error={error?.message}
            />
        )
    }
    Renderer.displayName = displayName
    return Renderer
}

export const MantineEmailRenderer = typedInputRenderer('email', 'MantineEmailRenderer')
export const MantineUrlRenderer = typedInputRenderer('url', 'MantineUrlRenderer')
export const MantineTimeRenderer = typedInputRenderer('time', 'MantineTimeRenderer')
export const MantineDateTimeRenderer = typedInputRenderer(
    'datetime-local',
    'MantineDateTimeRenderer',
)
