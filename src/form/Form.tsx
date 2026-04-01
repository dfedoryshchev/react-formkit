import React, { ReactNode } from 'react'
import { ZodSchema } from 'zod'
import BasicForm from './BasicForm'
import withSubmitButton from './withSubmitButton'

interface FormProps {
    onSubmit: (data: any) => void
    validationSchema?: ZodSchema
    defaultValues?: Record<string, any>
    buttonLabel?: string
    children?: ReactNode
}

// BasicForm plus an automatic loading-aware submit button. Use BasicForm
// directly when you want to supply your own submit control.
const Form: React.FC<FormProps> = ({ buttonLabel = 'Submit', children, ...formProps }) => {
    const FormWithButton = withSubmitButton(BasicForm)
    return (
        <FormWithButton {...formProps} buttonLabel={buttonLabel}>
            {children}
        </FormWithButton>
    )
}

export default Form
