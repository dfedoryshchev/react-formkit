import React from 'react'

// strips field-level props so only control-relevant props reach the input.
// `name` is intentionally kept so inputs receive a native name attribute and
// radio groups get a shared group name.
const FIELD_PROPS = ['label', 'required', 'errorMessage', 'warningMessage', 'rules'] as const

type FieldPropKey = (typeof FIELD_PROPS)[number]

export const withControlProps = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const WithControlProps = React.forwardRef<unknown, P & Record<FieldPropKey, any>>(
        (props, ref) => {
            const controlProps = { ...props } as any
            for (const key of FIELD_PROPS) {
                delete controlProps[key]
            }
            // default the input id to its name so a label's htmlFor can target it
            if (controlProps.id == null && controlProps.name) {
                controlProps.id = controlProps.name
            }
            return <WrappedComponent {...controlProps} ref={ref} />
        },
    )

    WithControlProps.displayName = `withControlProps(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
    return WithControlProps
}
