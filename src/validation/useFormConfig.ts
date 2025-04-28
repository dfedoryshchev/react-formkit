import { useMemo } from 'react'
import { useForm, UseFormProps } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ZodSchema } from 'zod'

interface FormConfig {
    validationSchema?: ZodSchema
    defaultValues?: Record<string, any>
}

export const useFormConfig = ({ validationSchema, defaultValues = {} }: FormConfig) => {
    const formOptions = useMemo<UseFormProps>(() => {
        const opts: UseFormProps = { defaultValues }
        if (validationSchema) {
            opts.resolver = zodResolver(validationSchema)
        }
        return opts
    }, [validationSchema, defaultValues])

    return useForm(formOptions)
}
