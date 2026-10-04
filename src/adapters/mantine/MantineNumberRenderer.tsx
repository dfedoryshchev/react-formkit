import React from 'react'
import { NumberInput } from '@mantine/core'
import { useController, useFormContext } from 'react-hook-form'
import { useIsFieldRequired } from '@/validation/useIsFieldRequired'
import type { FieldRenderProps } from '@/config/renderer.types'

export const MantineNumberRenderer: React.FC<FieldRenderProps> = ({ field, required }) => {
    const { control } = useFormContext()
    const schemaRequired = useIsFieldRequired(field.name)
    const {
        field: { name, value, onChange, onBlur, ref },
        fieldState: { error },
    } = useController({ name: field.name, control })

    return (
        <NumberInput
            ref={ref}
            name={name}
            value={value ?? ''}
            onChange={(next) => onChange(next === '' ? undefined : next)}
            onBlur={onBlur}
            label={field.label}
            placeholder={field.placeholder}
            disabled={field.disabled}
            withAsterisk={required ?? schemaRequired}
            error={error?.message}
        />
    )
}
