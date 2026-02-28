import React, { useMemo } from 'react'
import Control from '@/controls/Control'
import { withLabel } from './hocs/withLabel'
import { withFieldMessage } from './hocs/withFieldMessage'
import { withControlProps } from './hocs/withControlProps'
import { withRequired } from './hocs/withRequired'

interface FieldProps {
    type: string
    name: string
    label?: string
    required?: boolean
    errorMessage?: string
    warningMessage?: string
    [key: string]: any
}

const WRAPPING_LABEL_TYPES = ['checkbox']

const Field: React.FC<FieldProps> = (props) => {
    const { type, label, ...rest } = props

    const EnhancedControl = useMemo(() => {
        let component: any = Control

        component = withControlProps(component)

        // checkbox uses wrapping label (label wraps the input)
        // other types use standard label above the input
        if (label && !WRAPPING_LABEL_TYPES.includes(type)) {
            component = withLabel(component)
        }

        component = withFieldMessage(component)
        component = withRequired(component)

        return component
    }, [label, type])

    return <EnhancedControl type={type} label={label} {...rest} />
}

export default Field
