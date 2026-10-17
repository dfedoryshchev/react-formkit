import React from 'react'
import { Checkbox, Group } from '@mantine/core'
import { useController, useFormContext } from 'react-hook-form'
import { useIsFieldRequired } from '@/validation/useIsFieldRequired'
import type { FieldRenderProps } from '@/config/renderer.types'

export const MantineCheckboxGroupRenderer: React.FC<FieldRenderProps> = ({ field, required }) => {
    const { control } = useFormContext()
    const schemaRequired = useIsFieldRequired(field.name)
    const {
        field: { name, value, onChange, onBlur },
        fieldState: { error },
    } = useController({ name: field.name, control })

    return (
        <Checkbox.Group
            name={name}
            value={value ?? []}
            onChange={(next) => onChange(next)}
            label={field.label}
            description={field.description}
            withAsterisk={required ?? schemaRequired}
            error={error?.message}
        >
            <Group mt="xs">
                {(field.options ?? []).map((option) => (
                    <Checkbox
                        key={option.value}
                        value={option.value}
                        label={option.label}
                        disabled={field.disabled}
                        onBlur={onBlur}
                    />
                ))}
            </Group>
        </Checkbox.Group>
    )
}
