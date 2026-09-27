import React from 'react'
import { TextInput } from '@mantine/core'
import { useController, useFormContext } from 'react-hook-form'
import { useIsFieldRequired } from '@/validation/useIsFieldRequired'
import type { FieldRenderProps } from '@/config/renderer.types'

export const MantineTextRenderer: React.FC<FieldRenderProps> = ({ field, required }) => {
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
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.currentTarget.value)}
            onBlur={onBlur}
            label={field.label}
            placeholder={field.placeholder}
            disabled={field.disabled}
            withAsterisk={required ?? schemaRequired}
            error={error?.message}
        />
    )
}
