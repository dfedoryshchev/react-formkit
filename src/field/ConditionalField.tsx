import React, { useEffect, useRef } from 'react'
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
    // Field name(s) to drop from the form when the branch hides. Opt-in: without
    // it a hidden branch keeps whatever it held, which is what you want when the
    // branch is only being collapsed for space.
    clear?: string | string[]
    children: React.ReactNode
}

// Exported so buildSchema evaluates a condition exactly the way the renderer
// does. If the two drifted, a field could be visible but unvalidated, or
// validated while invisible - which is the bug this whole pair exists to avoid.
export const matchesCondition = (
    value: unknown,
    condition: Omit<FieldCondition, 'field'>,
): boolean => {
    if (condition.is !== undefined) return value === condition.is
    if (condition.isNot !== undefined) return value !== condition.isNot
    if (condition.test) return condition.test(value)
    return true
}

// Renders its children only while a sibling field matches the condition. The
// watched value is read through react-hook-form, so the branch appears and
// disappears as that field changes rather than only on submit.
export const ConditionalField: React.FC<ConditionalFieldProps> = ({
    when,
    children,
    clear,
    ...condition
}) => {
    const { control, unregister } = useFormContext()
    const value = useWatch({ control, name: when })
    const visible = matchesCondition(value, condition)

    // Only the visible -> hidden edge clears. Clearing on every hidden render
    // would fight anything that legitimately writes to the field while it is
    // out of view, and clearing on mount would wipe incoming defaults.
    const wasVisible = useRef(visible)
    useEffect(() => {
        if (wasVisible.current && !visible && clear !== undefined) {
            // keepDefaultValue so reopening the branch restores the configured
            // default rather than leaving the input uncontrolled.
            unregister(clear as never, { keepDefaultValue: true })
        }
        wasVisible.current = visible
    }, [visible, clear, unregister])

    if (!visible) return null
    return <>{children}</>
}
