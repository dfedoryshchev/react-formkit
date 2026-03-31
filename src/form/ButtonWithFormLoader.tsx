import React from 'react'
import { useFormContext } from 'react-hook-form'

interface ButtonWithFormLoaderProps {
    label: string
    type?: 'submit' | 'button'
    className?: string
}

// Submit button that reflects the form's submitting state. Must render inside a
// FormProvider (BasicForm provides one).
export const ButtonWithFormLoader: React.FC<ButtonWithFormLoaderProps> = ({
    label,
    type = 'submit',
    className,
}) => {
    const {
        formState: { isSubmitting },
    } = useFormContext()

    return (
        <button type={type} disabled={isSubmitting} className={className}>
            {isSubmitting ? 'Loading...' : label}
        </button>
    )
}

export default ButtonWithFormLoader
