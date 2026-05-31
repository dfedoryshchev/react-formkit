import React from 'react'
import {
    TextInput,
    NumericInput,
    TextareaInput,
    SelectInput,
    CheckboxInput,
    EmailInput,
    UrlInput,
    PasswordInput,
    PhoneInput,
} from '@/controls/inputs'
import { RadioGroup, CheckboxGroup, SwitchInput } from '@/controls/toggles'
import { DateInput, TimeInput, DateTimeInput } from '@/controls/datetime'
import type { ControlType } from '@/controls/Control'

// POC: map a control type string to its component so config rendering can look
// a control up by `type` instead of routing through Control's switch.
export const controlRegistry: Partial<Record<ControlType, React.ComponentType<any>>> = {
    text: TextInput,
    numeric: NumericInput,
    textarea: TextareaInput,
    select: SelectInput,
    checkbox: CheckboxInput,
    'checkbox-group': CheckboxGroup,
    radio: RadioGroup,
    switch: SwitchInput,
    password: PasswordInput,
    email: EmailInput,
    url: UrlInput,
    phone: PhoneInput,
    date: DateInput,
    time: TimeInput,
    datetime: DateTimeInput,
}
