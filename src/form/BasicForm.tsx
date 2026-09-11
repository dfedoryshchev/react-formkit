import React, { useMemo } from 'react'
import { FormProvider, UseFormProps } from 'react-hook-form'
import { ZodSchema } from 'zod'
import { useFormConfig } from '@/validation/useFormConfig'
import { FormLevelValidator } from '@/validation/useFormLevelValidators'
import { ValidationSchemaContext } from '@/validation/ValidationSchemaContext'
import { MessageContext } from '@/validation/MessageContext'
import { MessageOverrides, resolveMessages, withMessages } from '@/validation/messages'
import FormLoadingOverlay from './FormLoadingOverlay'

interface BasicFormProps {
    // Whatever this resolves to is handed to onSuccess, so a handler that
    // returns the created record can pass it straight to the next step.
    onSubmit: (data: any) => any
    // Pass a builder function instead of a schema when using `messages`: the
    // overrides can only reach the validators while the schema is being built.
    validationSchema?: ZodSchema | (() => ZodSchema)
    defaultValues?: Record<string, any>
    children: React.ReactNode
    resetOnSubmit?: boolean
    loadingOverlay?: boolean
    // Runs after onSubmit has resolved without throwing, never after a submit
    // the schema rejected.
    onSuccess?: (result: any, data: any) => void
    // Rendered once a submit has succeeded, in place of the form unless
    // keepFormOnSuccess is set.
    successContent?: React.ReactNode
    keepFormOnSuccess?: boolean
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
    onSuccess,
    successContent,
    keepFormOnSuccess,
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
        const result = await onSubmit(data)
        if (resetOnSubmit) methods.reset()
        onSuccess?.(result, data)
    }

    const busy = !!loadingOverlay && methods.formState.isSubmitting
    // isSubmitSuccessful stays true from one submit until the next one settles,
    // so the submitting state has to be excluded here or a resubmit shows the
    // previous outcome while it is still in flight.
    const showSuccess =
        successContent != null &&
        methods.formState.isSubmitSuccessful &&
        !methods.formState.isSubmitting

    return (
        <ValidationSchemaContext.Provider value={schema}>
            <MessageContext.Provider value={resolvedMessages}>
                <FormProvider {...methods}>
                    <div style={{ position: 'relative' }}>
                        {!(showSuccess && !keepFormOnSuccess) && (
                            <form
                                onSubmit={methods.handleSubmit(handleSubmit)}
                                aria-busy={busy || undefined}
                                style={busy ? { pointerEvents: 'none' } : undefined}
                            >
                                {children}
                            </form>
                        )}
                        {showSuccess && (
                            <div className="fk-form-success" role="status">
                                {successContent}
                            </div>
                        )}
                        {busy && <FormLoadingOverlay />}
                    </div>
                </FormProvider>
            </MessageContext.Provider>
        </ValidationSchemaContext.Provider>
    )
}

export default BasicForm
