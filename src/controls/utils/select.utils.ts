import { Option } from '@/controls/control.types'

export const isComplexOption = <T>(opt: T): opt is T & { value: unknown; label: string } => {
    return typeof opt === 'object' && opt !== null && 'value' in opt && 'label' in opt
}

export const serializeValue = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value
    return JSON.stringify(value)
}

export const getOptionLabel = <T>(opt: Option<T> | T): string => {
    if (isComplexOption(opt)) return opt.label
    return String(opt)
}

export const getOptionValue = <T>(opt: Option<T> | T): T => {
    if (isComplexOption(opt)) return opt.value as T
    return opt
}

export const isUnselected = (value: unknown): boolean => {
    return value === '' || value === null || value === undefined
}
