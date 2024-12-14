import React from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ZodSchema } from 'zod'

interface BasicFormProps {
    onSubmit: (data: any) => void
    validationSchema?: ZodSchema
    defaultValues?: Record<string, any>
    children: React.ReactNode
}

const BasicForm: React.FC<BasicFormProps> = ({
    onSubmit,
    validationSchema,
    defaultValues = {},
    children,
}) => {
    const methods = useForm({
        defaultValues,
        ...(validationSchema ? { resolver: zodResolver(validationSchema) } : {}),
    })

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                {children}
            </form>
        </FormProvider>
    )
}

export default BasicForm
