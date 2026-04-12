import React from 'react'
import { FormProvider } from 'react-hook-form'
import { ZodSchema } from 'zod'
import { useFormConfig } from '@/validation/useFormConfig'
import { FormLevelValidator } from '@/validation/useFormLevelValidators'
import { ValidationSchemaContext } from '@/validation/ValidationSchemaContext'

interface BasicFormProps {
    onSubmit: (data: any) => void | Promise<void>
    validationSchema?: ZodSchema
    defaultValues?: Record<string, any>
    children: React.ReactNode
    resetOnSubmit?: boolean
    loadingOverlay?: boolean
    formLevelValidators?: FormLevelValidator[]
}

const BasicForm: React.FC<BasicFormProps> = ({
    onSubmit,
    validationSchema,
    defaultValues = {},
    children,
    resetOnSubmit,
    loadingOverlay,
    formLevelValidators,
}) => {
    const methods = useFormConfig({ validationSchema, defaultValues, formLevelValidators })

    const handleSubmit = async (data: any) => {
        await onSubmit(data)
        if (resetOnSubmit) methods.reset()
    }

    return (
        <ValidationSchemaContext.Provider value={validationSchema}>
            <FormProvider {...methods}>
                <div style={{ position: 'relative' }}>
                    <form onSubmit={methods.handleSubmit(handleSubmit)}>{children}</form>
                    {loadingOverlay && methods.formState.isSubmitting && (
                        // TODO: overlay has no z-index and does not block pointer events
                        // or trap focus, so controls underneath stay reachable while
                        // submitting. Revisit (z-index + pointer-events + focus trap).
                        <div
                            className="fk-form-loading-overlay"
                            style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255, 255, 255, 0.6)',
                            }}
                        >
                            Submitting...
                        </div>
                    )}
                </div>
            </FormProvider>
        </ValidationSchemaContext.Provider>
    )
}

export default BasicForm
