import React from 'react'
import { useIsFieldRequired } from '@/validation/useIsFieldRequired'

interface WithRequiredProps {
    name?: string
    required?: boolean
}

export const withRequired = <P extends WithRequiredProps>(
    WrappedComponent: React.ComponentType<P>,
) => {
    const WithRequired = React.forwardRef<unknown, P>((props, ref) => {
        const { name, required: explicitRequired } = props
        const schemaRequired = useIsFieldRequired(name || '')
        const isRequired = explicitRequired ?? schemaRequired

        // Merging `required` into generic props P cannot be expressed without a
        // cast (P could be a narrower subtype); confined to this one boundary.
        const mergedProps = { ...props, required: isRequired } as P
        const Wrapped = WrappedComponent as React.ComponentType<P & React.RefAttributes<unknown>>
        return <Wrapped {...mergedProps} ref={ref} />
    })

    WithRequired.displayName = `withRequired(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
    return WithRequired
}
