import React from 'react'
import { useController, useFormContext } from 'react-hook-form'
import { useIsFieldRequired } from '@/validation/useIsFieldRequired'
import Field from './Field'

interface FormFieldProps {
    name: string
    type: string
    label?: string
    required?: boolean
    defaultValue?: unknown
    [key: string]: any
}

const FormField: React.FC<FormFieldProps> = ({
    name,
    type,
    required: explicitRequired,
    defaultValue,
    ...rest
}) => {
    const { control } = useFormContext()
    const schemaRequired = useIsFieldRequired(name)

    const {
        field: { value, onChange, onBlur, ref },
        fieldState: { error },
    } = useController({
        name,
        control,
        defaultValue,
    })

    return (
        <Field
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            ref={ref}
            errorMessage={error?.message}
            required={explicitRequired ?? schemaRequired}
            {...rest}
        />
    )
}

export default FormField
