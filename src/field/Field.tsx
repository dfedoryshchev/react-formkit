import React, { useMemo } from 'react'
import Control from '@/controls/Control'
import { withLabel } from './hocs/withLabel'
import { withFieldMessage } from './hocs/withFieldMessage'
import { withControlProps } from './hocs/withControlProps'
import { withRequired } from './hocs/withRequired'
import { withWrappingLabel } from '@/controls/toggles'

interface FieldProps {
    type: string
    name: string
    label?: string
    required?: boolean
    errorMessage?: string
    warningMessage?: string
    [key: string]: any
}

const WRAPPING_LABEL_TYPES = ['checkbox', 'switch']

const Field: React.FC<FieldProps> = (props) => {
    const { type, label, ...rest } = props

    const EnhancedControl = useMemo(() => {
        let component: any = Control

        component = withControlProps(component)

        // checkbox-style inputs wrap the label around the control (click text to
        // toggle); other types render a standard label above the control
        if (label) {
            if (WRAPPING_LABEL_TYPES.includes(type)) {
                component = withWrappingLabel(component)
            } else {
                component = withLabel(component)
            }
        }

        component = withFieldMessage(component)
        component = withRequired(component)

        return component
    }, [label, type])

    return <EnhancedControl type={type} label={label} {...rest} />
}

export default Field
