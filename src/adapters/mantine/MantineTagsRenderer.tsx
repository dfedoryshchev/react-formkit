import React from 'react'
import { TagsInput } from '@mantine/core'
import { useController, useFormContext } from 'react-hook-form'
import { useIsFieldRequired } from '@/validation/useIsFieldRequired'
import type { FieldRenderProps } from '@/config/renderer.types'

export const MantineTagsRenderer: React.FC<FieldRenderProps> = ({ field, required }) => {
    const { control } = useFormContext()
    const schemaRequired = useIsFieldRequired(field.name)
    const {
        field: { name, value, onChange, onBlur, ref },
        fieldState: { error },
    } = useController({ name: field.name, control })

    return (
        <TagsInput
            ref={ref}
            name={name}
            data={(field.options ?? []).map((option) => option.label)}
            value={value ?? []}
            onChange={(next) => onChange(next)}
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
