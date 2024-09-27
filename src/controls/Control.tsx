import React from 'react'
import TextInput from './inputs/TextInput'
import NumericInput from './inputs/NumericInput'
import TextareaInput from './inputs/TextareaInput'
import SelectInput from './inputs/SelectInput'
import CheckboxInput from './inputs/CheckboxInput'
import { Option } from '../types'

export type ControlType = 'text' | 'numeric' | 'textarea' | 'select' | 'checkbox'

interface BaseControlProps {
    type: ControlType
    value: any
    onChange: (value: any) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

interface SelectControlProps extends BaseControlProps {
    type: 'select'
    options: Option[]
}

interface CheckboxControlProps extends BaseControlProps {
    type: 'checkbox'
    label?: string
}

type ControlProps = SelectControlProps | CheckboxControlProps | BaseControlProps

const Control: React.FC<ControlProps> = ({ type, ...rest }) => {
    switch (type) {
        case 'text':
            return <TextInput {...rest} />
        case 'numeric':
            return <NumericInput {...rest} />
        case 'textarea':
            return <TextareaInput {...rest} />
        case 'select':
            return <SelectInput {...(rest as any)} />
        case 'checkbox':
            return (
                <CheckboxInput
                    checked={!!rest.value}
                    onChange={rest.onChange}
                    label={(rest as any).label}
                    disabled={rest.disabled}
                />
            )
        default:
            return <TextInput {...rest} />
    }
}

export default Control
