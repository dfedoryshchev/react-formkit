import React from 'react'

// strips field-level props so only control-relevant props reach the input
const FIELD_PROPS = [
    'label',
    'required',
    'errorMessage',
    'warningMessage',
    'name',
    'rules',
] as const

type FieldPropKey = (typeof FIELD_PROPS)[number]

export const withControlProps = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const WithControlProps = React.forwardRef<unknown, P & Record<FieldPropKey, any>>(
        (props, ref) => {
            const controlProps = { ...props } as any
            for (const key of FIELD_PROPS) {
                delete controlProps[key]
            }
            return <WrappedComponent {...controlProps} ref={ref} />
        },
    )

    WithControlProps.displayName = `withControlProps(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
    return WithControlProps
}
