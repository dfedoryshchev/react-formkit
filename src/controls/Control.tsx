import React from 'react'
import { TextInput, NumericInput, TextareaInput, SelectInput, CheckboxInput, EmailInput, UrlInput, PasswordInput } from './inputs'
import { RadioGroup, CheckboxGroup, SwitchInput } from './toggles'
import { MultiSelectInput } from './selects'
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
    | 'checkbox-group'
    | 'switch'
    | 'password'
    | 'multiselect'

interface CommonControlProps {
    placeholder?: string
    disabled?: boolean
    className?: string
    name?: string
    id?: string
}

interface TextControlProps extends CommonControlProps {
    type: 'text'
    value: string
    onChange: (value: string) => void
}

interface NumericControlProps extends CommonControlProps {
    type: 'numeric'
    value: number | undefined
    onChange: (value: number | undefined) => void
}

interface SelectControlProps extends CommonControlProps {
    type: 'select'
    value: unknown
    onChange: (value: unknown) => void
    options: Option[]
}

// TODO: tighten the remaining control prop types (textarea, checkbox, radio,
// email, url, date, time, datetime) the way text/numeric/select now are.
interface LooseControlProps extends CommonControlProps {
    type:
        | 'textarea'
        | 'checkbox'
        | 'radio'
        | 'email'
        | 'url'
        | 'date'
        | 'time'
        | 'datetime'
        | 'checkbox-group'
        | 'switch'
        | 'password'
        | 'multiselect'
    value: any
    onChange: (value: any) => void
    options?: Option[]
    label?: string
}

type ControlProps = TextControlProps | NumericControlProps | SelectControlProps | LooseControlProps

const Control: React.FC<ControlProps> = (props) => {
    switch (props.type) {
        case 'text': {
            const { type, ...rest } = props
            return <TextInput {...rest} />
        }
        case 'numeric': {
            const { type, ...rest } = props
            return <NumericInput {...rest} />
        }
        case 'select': {
            const { type, ...rest } = props
            return <SelectInput {...rest} />
        }
        case 'textarea': {
            const { type, ...rest } = props
            return <TextareaInput {...(rest as any)} />
        }
        case 'checkbox':
            return (
                <CheckboxInput
                    checked={!!props.value}
                    onChange={props.onChange}
                    disabled={props.disabled}
                />
            )
        case 'radio':
            return (
                <RadioGroup
                    value={props.value}
                    onChange={props.onChange}
                    options={(props.options ?? []) as any}
                    name={props.name || ''}
                    disabled={props.disabled}
                />
            )
        case 'checkbox-group':
            return (
                <CheckboxGroup
                    value={(props.value ?? []) as string[]}
                    onChange={props.onChange}
                    options={(props.options ?? []) as any}
                    disabled={props.disabled}
                />
            )
        case 'switch':
            return (
                <SwitchInput
                    checked={!!props.value}
                    onChange={props.onChange}
                    disabled={props.disabled}
                />
            )
        case 'multiselect':
            return (
                <MultiSelectInput
                    value={(props.value ?? []) as string[]}
                    onChange={props.onChange}
                    options={(props.options ?? []) as any}
                    placeholder={props.placeholder}
                    isDisabled={props.disabled}
                />
            )
        case 'email': {
            const { type, ...rest } = props
            return <EmailInput {...(rest as any)} />
        }
        case 'url': {
            const { type, ...rest } = props
            return <UrlInput {...(rest as any)} />
        }
        case 'password': {
            const { type, ...rest } = props
            return <PasswordInput {...(rest as any)} />
        }
        case 'date': {
            const { type, ...rest } = props
            return <DateInput {...(rest as any)} />
        }
        case 'time': {
            const { type, ...rest } = props
            return <TimeInput {...(rest as any)} />
        }
        case 'datetime': {
            const { type, ...rest } = props
            return <DateTimeInput {...(rest as any)} />
        }
        default:
            return <TextInput {...(props as any)} />
    }
}

export default Control
