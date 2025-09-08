import React from 'react'

interface WithWrappingLabelProps {
    label?: string
}

export const withWrappingLabel = <P extends WithWrappingLabelProps>(
    WrappedComponent: React.ComponentType<P>,
) => {
    const WithWrappingLabel = React.forwardRef<unknown, P>((props, ref) => {
        const { label, ...rest } = props as any

        if (!label) {
            return <WrappedComponent {...(rest as P)} ref={ref} />
        }

        return (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WrappedComponent {...(rest as P)} ref={ref} />
                <span>{label}</span>
            </label>
        )
    })

    WithWrappingLabel.displayName = `withWrappingLabel(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
    return WithWrappingLabel
}
