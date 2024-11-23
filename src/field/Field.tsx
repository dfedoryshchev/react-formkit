import React, { useMemo } from 'react'
import Control from '../controls/Control'
import { withLabel } from './hocs/withLabel'
import { withFieldMessage } from './hocs/withFieldMessage'
import { withControlProps } from './hocs/withControlProps'

interface FieldProps {
    type: string
    name: string
    label?: string
    required?: boolean
    errorMessage?: string
    warningMessage?: string
    [key: string]: any
}

const Field: React.FC<FieldProps> = (props) => {
    const { type, label, required, errorMessage, warningMessage, ...rest } = props

    // dynamically compose HOCs based on what props are present
    const EnhancedControl = useMemo(() => {
        let component: any = Control

        component = withControlProps(component)

        if (label) {
            component = withLabel(component)
        }

        component = withFieldMessage(component)

        return component
    }, [label])

    return (
        <EnhancedControl
            type={type}
            label={label}
            required={required}
            errorMessage={errorMessage}
            warningMessage={warningMessage}
            {...rest}
        />
    )
}

export default Field
