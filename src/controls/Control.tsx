import React from 'react'
import { TextInput, NumericInput, TextareaInput, SelectInput, CheckboxInput, EmailInput, UrlInput } from './inputs'
import { RadioGroup } from './toggles'
import { DateInput, TimeInput, DateTimeInput } from './datetime'
import { Option } from './control.types'

export type ControlType =
    | 'text'
    | 'numeric'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'email'
    | 'url'
    | 'date'
    | 'time'
    | 'datetime'

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
        case 'email':
            return <EmailInput {...rest} />
        case 'url':
            return <UrlInput {...rest} />
        case 'date':
            return <DateInput {...rest} />
        case 'time':
            return <TimeInput {...rest} />
        case 'datetime':
            return <DateTimeInput {...rest} />
        default:
            return <TextInput {...rest} />
    }
}

export default Control
