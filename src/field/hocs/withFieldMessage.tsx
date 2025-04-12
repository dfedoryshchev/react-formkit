import React from 'react'
import FieldMessage from '../FieldMessage'

interface WithFieldMessageProps {
    errorMessage?: string
    warningMessage?: string
}

export const withFieldMessage = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const WithFieldMessage = React.forwardRef<unknown, P & WithFieldMessageProps>((props, ref) => {
        const { errorMessage, warningMessage, ...rest } = props as any

        return (
            <>
                <WrappedComponent {...(rest as P)} ref={ref} />
                <FieldMessage
                    message={errorMessage || warningMessage}
                    type={errorMessage ? 'error' : 'warning'}
                    visible={!!(errorMessage || warningMessage)}
                />
            </>
        )
    })

    WithFieldMessage.displayName = `withFieldMessage(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
    return WithFieldMessage
}
