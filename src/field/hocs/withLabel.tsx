import React from 'react'
import Label from '../../components/Label'

interface WithLabelProps {
    label?: string
    required?: boolean
}

export const withLabel = <P extends WithLabelProps>(WrappedComponent: React.ComponentType<P>) => {
    const WithLabel = React.forwardRef<unknown, P & WithLabelProps>((props, ref) => {
        const { label, required, ...rest } = props as any

        if (!label) {
            return <WrappedComponent {...(rest as P)} ref={ref} />
        }

        return (
            <Label text={label} required={required}>
                <WrappedComponent {...(rest as P)} ref={ref} />
            </Label>
        )
    })

    WithLabel.displayName = `withLabel(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
    return WithLabel
}
