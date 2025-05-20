import React from 'react'
import TextInput from './inputs/TextInput'
import NumericInput from './inputs/NumericInput'
import TextareaInput from './inputs/TextareaInput'
import SelectInput from './inputs/SelectInput'
import CheckboxInput from './inputs/CheckboxInput'
import RadioGroup from './toggles/RadioGroup'
import { Option } from './control.types'

export type ControlType = 'text' | 'numeric' | 'textarea' | 'select' | 'checkbox' | 'radio'

interface BaseControlProps {
    type: ControlType
    value: any
    onChange: (value: any) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    name?: string
}

interface SelectControlProps extends BaseControlProps {
    type: 'select'
    options: Option[]
}

interface CheckboxControlProps extends BaseControlProps {
    type: 'checkbox'
    label?: string
}

interface RadioControlProps extends BaseControlProps {
    type: 'radio'
    options: { value: string; label: string }[]
}

type ControlProps = SelectControlProps | CheckboxControlProps | RadioControlProps | BaseControlProps

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
        case 'radio':
            return (
                <RadioGroup
                    value={rest.value}
                    onChange={rest.onChange}
                    options={(rest as any).options}
                    name={rest.name || ''}
                    disabled={rest.disabled}
                />
            )
        default:
            return <TextInput {...rest} />
    }
}

export default Control
