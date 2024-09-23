import React from 'react'
import TextInput from './inputs/TextInput'
import NumericInput from './inputs/NumericInput'
import TextareaInput from './inputs/TextareaInput'
import SelectInput from './inputs/SelectInput'
import CheckboxInput from './inputs/CheckboxInput'

type ControlType = 'text' | 'numeric' | 'textarea' | 'select' | 'checkbox'

interface ControlProps {
    type: ControlType
    value: any
    onChange: (value: any) => void
    options?: any[]
    label?: string
    placeholder?: string
    disabled?: boolean
    [key: string]: any
}

const Control: React.FC<ControlProps> = ({ type, ...props }) => {
    switch (type) {
        case 'text':
            return <TextInput {...props} />
        case 'numeric':
            return <NumericInput {...props} />
        case 'textarea':
            return <TextareaInput {...props} />
        case 'select':
            return <SelectInput {...props} />
        case 'checkbox':
            return <CheckboxInput checked={!!props.value} onChange={props.onChange} label={props.label} disabled={props.disabled} />
        default:
            return <TextInput {...props} />
    }
}

export default Control
