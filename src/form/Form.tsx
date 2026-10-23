import React, { ReactNode } from 'react'
import { UseFormProps } from 'react-hook-form'
import { ZodType } from 'zod'
import BasicForm from './BasicForm'
import withSubmitButton from './withSubmitButton'
import { MessageOverrides } from '@/validation/messages'

interface FormProps {
    onSubmit: (data: any) => any
    validationSchema?: ZodType | (() => ZodType)
    defaultValues?: Record<string, any>
    buttonLabel?: string
    children?: ReactNode
    messages?: MessageOverrides
    mode?: UseFormProps['mode']
    onSuccess?: (result: any, data: any) => void
    successContent?: ReactNode
    keepFormOnSuccess?: boolean
}

const FormWithButton = withSubmitButton(BasicForm)

// BasicForm plus an automatic loading-aware submit button. Use BasicForm
// directly when you want to supply your own submit control.
const Form: React.FC<FormProps> = ({ buttonLabel = 'Submit', children, ...formProps }) => {
    return (
        <FormWithButton {...formProps} buttonLabel={buttonLabel}>
            {children}
        </FormWithButton>
    )
}

export default Form
