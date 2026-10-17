import React from 'react'
import { PasswordInput } from '@mantine/core'
import { useController, useFormContext } from 'react-hook-form'
import { useIsFieldRequired } from '@/validation/useIsFieldRequired'
import type { FieldRenderProps } from '@/config/renderer.types'

export const MantinePasswordRenderer: React.FC<FieldRenderProps> = ({ field, required }) => {
    const { control } = useFormContext()
    const schemaRequired = useIsFieldRequired(field.name)
    const {
        field: { name, value, onChange, onBlur, ref },
        fieldState: { error },
    } = useController({ name: field.name, control })

    return (
        <PasswordInput
            ref={ref}
            name={name}
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
