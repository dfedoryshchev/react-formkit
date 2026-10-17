import React from 'react'
import { Switch } from '@mantine/core'
import { useController, useFormContext } from 'react-hook-form'
import type { FieldRenderProps } from '@/config/renderer.types'

export const MantineSwitchRenderer: React.FC<FieldRenderProps> = ({ field }) => {
    const { control } = useFormContext()
    const {
        field: { name, value, onChange, onBlur, ref },
        fieldState: { error },
    } = useController({ name: field.name, control })

    return (
        <Switch
            ref={ref}
            name={name}
            checked={!!value}
            onChange={(e) => onChange(e.currentTarget.checked)}
            onBlur={onBlur}
            label={field.label}
            description={field.description}
            disabled={field.disabled}
            error={error?.message}
        />
    )
}
