import { useMemo } from 'react'
import { useForm, UseFormProps } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ZodSchema } from 'zod'
import { FormLevelValidator, useFormLevelValidators } from './useFormLevelValidators'

interface FormConfig {
    validationSchema?: ZodSchema
    defaultValues?: Record<string, any>
    formLevelValidators?: FormLevelValidator[]
}

export const useFormConfig = ({
    validationSchema,
    defaultValues = {},
    formLevelValidators,
}: FormConfig) => {
    const schema = useFormLevelValidators(validationSchema, formLevelValidators)

    const formOptions = useMemo<UseFormProps>(() => {
        const opts: UseFormProps = { defaultValues }
        if (schema) {
            opts.resolver = zodResolver(schema)
        }
        return opts
    }, [schema, defaultValues])

    return useForm(formOptions)
}
