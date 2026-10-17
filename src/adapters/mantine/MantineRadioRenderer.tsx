import React from 'react'
import { Group, Radio } from '@mantine/core'
import { useController, useFormContext } from 'react-hook-form'
import { useIsFieldRequired } from '@/validation/useIsFieldRequired'
import type { FieldRenderProps } from '@/config/renderer.types'

export const MantineRadioRenderer: React.FC<FieldRenderProps> = ({ field, required }) => {
    const { control } = useFormContext()
    const schemaRequired = useIsFieldRequired(field.name)
    const {
        field: { name, value, onChange, onBlur },
        fieldState: { error },
    } = useController({ name: field.name, control })

    return (
        <Radio.Group
            name={name}
            value={value ?? null}
            onChange={(next) => onChange(next)}
            label={field.label}
            description={field.description}
            withAsterisk={required ?? schemaRequired}
            error={error?.message}
        >
            <Group mt="xs">
                {(field.options ?? []).map((option) => (
                    <Radio
                        key={option.value}
                        value={option.value}
                        label={option.label}
                        disabled={field.disabled}
                        onBlur={onBlur}
                    />
                ))}
            </Group>
        </Radio.Group>
    )
}
