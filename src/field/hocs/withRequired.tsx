import React from 'react'
import { useIsFieldRequired } from '../../validation/useIsFieldRequired'

interface WithRequiredProps {
    name?: string
    required?: boolean
}

export const withRequired = <P extends WithRequiredProps>(
    WrappedComponent: React.ComponentType<P>,
) => {
    const WithRequired = React.forwardRef<unknown, P>((props, ref) => {
        const { name, required: explicitRequired } = props as any
        const schemaRequired = useIsFieldRequired(name || '')
        const isRequired = explicitRequired ?? schemaRequired

        return <WrappedComponent {...props} required={isRequired} ref={ref} />
    })

    WithRequired.displayName = `withRequired(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
    return WithRequired
}
