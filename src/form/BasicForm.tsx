import React from 'react'
import { FormProvider } from 'react-hook-form'
import { ZodSchema } from 'zod'
import { useFormConfig } from '@/validation/useFormConfig'
import { ValidationSchemaContext } from '@/validation/ValidationSchemaContext'

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
    const methods = useFormConfig({ validationSchema, defaultValues })

    return (
        <ValidationSchemaContext.Provider value={validationSchema}>
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
            </FormProvider>
        </ValidationSchemaContext.Provider>
    )
}

export default BasicForm
