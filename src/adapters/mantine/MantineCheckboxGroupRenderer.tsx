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

    const options = field.options ?? []
    const toOptionValue = (raw: string): unknown =>
        options.find((option) => String(option.value) === raw)?.value ?? raw

    return (
        <Checkbox.Group
            name={name}
            value={((value as unknown[] | undefined) ?? []).map(String)}
            onChange={(next) => onChange(next.map(toOptionValue))}
            label={field.label}
            description={field.description}
            withAsterisk={required ?? schemaRequired}
            error={error?.message}
        >
            <Group mt="xs">
                {options.map((option) => (
                    <Checkbox
                        key={String(option.value)}
                        value={String(option.value)}
                        label={option.label}
                        disabled={field.disabled}
                        onBlur={onBlur}
                    />
                ))}
            </Group>
        </Checkbox.Group>
    )
}
