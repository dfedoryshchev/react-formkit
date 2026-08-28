import React, { useMemo } from 'react'
import { FormProvider, UseFormProps } from 'react-hook-form'
import { ZodSchema } from 'zod'
import { useFormConfig } from '@/validation/useFormConfig'
import { FormLevelValidator } from '@/validation/useFormLevelValidators'
import { ValidationSchemaContext } from '@/validation/ValidationSchemaContext'
import { MessageContext } from '@/validation/MessageContext'
import { MessageOverrides, resolveMessages, withMessages } from '@/validation/messages'

interface BasicFormProps {
    onSubmit: (data: any) => void | Promise<void>
    // Pass a builder function instead of a schema when using `messages`: the
    // overrides can only reach the validators while the schema is being built.
    validationSchema?: ZodSchema | (() => ZodSchema)
    defaultValues?: Record<string, any>
    children: React.ReactNode
    resetOnSubmit?: boolean
    loadingOverlay?: boolean
    formLevelValidators?: FormLevelValidator[]
    // Message overrides for this form only. Keep the object stable (module
    // scope or memoized); it is a dependency of the schema build.
    messages?: MessageOverrides
    // When validation runs, passed straight to RHF. A debounced async rule is
    // only worth its delay under 'onChange' or 'onBlur'; RHF's own default
    // (validate on submit, re-validate on change) applies when this is unset.
    mode?: UseFormProps['mode']
}

const BasicForm: React.FC<BasicFormProps> = ({
    onSubmit,
    validationSchema,
    defaultValues = {},
    children,
    resetOnSubmit,
    loadingOverlay,
    formLevelValidators,
    messages,
    mode,
}) => {
    const resolvedMessages = useMemo(() => resolveMessages(messages), [messages])

    // A schema passed ready-made already carries its strings, so only the
    // builder form can pick the overrides up.
    const schema = useMemo(
        () =>
            typeof validationSchema === 'function'
                ? withMessages(messages, validationSchema)
                : validationSchema,
        [validationSchema, messages],
    )

    const methods = useFormConfig({
        validationSchema: schema,
        defaultValues,
        formLevelValidators,
        mode,
    })

    const handleSubmit = async (data: any) => {
        await onSubmit(data)
        if (resetOnSubmit) methods.reset()
    }

    return (
        <ValidationSchemaContext.Provider value={schema}>
            <MessageContext.Provider value={resolvedMessages}>
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
            </MessageContext.Provider>
        </ValidationSchemaContext.Provider>
    )
}

export default BasicForm
