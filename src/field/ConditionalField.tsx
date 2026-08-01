import React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'

// The predicate half of a conditional field: which sibling to watch, and what
// makes the branch visible. `is` takes precedence over `isNot`, which takes
// precedence over `test`; with none of them the branch is always visible.
export interface FieldCondition {
    field: string
    is?: unknown
    isNot?: unknown
    test?: (value: unknown) => boolean
}

export interface ConditionalFieldProps extends Omit<FieldCondition, 'field'> {
    when: string
    children: React.ReactNode
}

const matches = (value: unknown, condition: Omit<FieldCondition, 'field'>): boolean => {
    if (condition.is !== undefined) return value === condition.is
    if (condition.isNot !== undefined) return value !== condition.isNot
    if (condition.test) return condition.test(value)
    return true
}

// Renders its children only while a sibling field matches the condition. The
// watched value is read through react-hook-form, so the branch appears and
// disappears as that field changes rather than only on submit.
// TODO: a hidden branch still keeps whatever value it last held, and the schema
// still validates it, so a required field inside one can block submit with an
// error nobody can see.
export const ConditionalField: React.FC<ConditionalFieldProps> = ({ when, children, ...condition }) => {
    const { control } = useFormContext()
    const value = useWatch({ control, name: when })

    if (!matches(value, condition)) return null
    return <>{children}</>
}
