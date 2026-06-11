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
            // @hookform/resolvers v5 overloads zodResolver for zod 3 and zod 4;
            // our zod 3 ZodSchema needs a cast to match the v3 overload.
            opts.resolver = zodResolver(schema as any)
        }
        return opts
    }, [schema, defaultValues])

    return useForm(formOptions)
}
