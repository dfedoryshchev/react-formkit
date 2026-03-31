import React, { ReactNode } from 'react'
import { ButtonWithFormLoader } from './ButtonWithFormLoader'

interface WithSubmitButtonProps {
    buttonLabel?: string
    children?: ReactNode
}

// Wraps a form component and appends a loading-aware submit button after its
// children. The button only renders when a buttonLabel is supplied.
const withSubmitButton = <P extends object>(Component: React.ComponentType<P>) => {
    const WithSubmitButton: React.FC<P & WithSubmitButtonProps> = ({
        buttonLabel,
        children,
        ...props
    }) => {
        return (
            <Component {...(props as unknown as P)}>
                {children}
                {buttonLabel && <ButtonWithFormLoader label={buttonLabel} type="submit" />}
            </Component>
        )
    }

    WithSubmitButton.displayName = `withSubmitButton(${Component.displayName || Component.name || 'Component'})`
    return WithSubmitButton
}

export default withSubmitButton
