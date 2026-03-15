import React from 'react'
import FieldMessage from '@/field/FieldMessage'

interface WithFieldMessageProps {
    errorMessage?: string
    warningMessage?: string
}

export const withFieldMessage = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const WithFieldMessage = React.forwardRef<unknown, P & WithFieldMessageProps>((props, ref) => {
        const { errorMessage, warningMessage, ...rest } = props as any
        const message = errorMessage || warningMessage
        const name = rest.name as string | undefined
        const messageId = name ? `field-message-${name}` : undefined

        return (
            <>
                <WrappedComponent
                    {...(rest as P)}
                    aria-required={rest.required ? true : undefined}
                    aria-invalid={errorMessage ? true : undefined}
                    aria-describedby={message && messageId ? messageId : undefined}
                    ref={ref}
                />
                <FieldMessage
                    id={messageId}
                    message={message}
                    type={errorMessage ? 'error' : 'warning'}
                    visible={!!message}
                />
            </>
        )
    })

    WithFieldMessage.displayName = `withFieldMessage(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
    return WithFieldMessage
}
