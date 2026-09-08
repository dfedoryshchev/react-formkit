import React from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'

// What a row knows about itself. `name` is the row's path prefix, not the
// array's, so a child builds its own field name from it and never composes the
// index by hand - that is the one place a field array goes wrong quietly.
export interface FieldArrayRow {
    name: string
    index: number
    // react-hook-form's own key for the row. It survives a reorder, which the
    // index does not, and it is what makes moving a row move the row rather
    // than retype two of them.
    id: string
    // Drops this row. Bound to the row rather than taking an index, for the
    // same reason `name` is: an index the child carries around is stale the
    // moment anything else in the array changes.
    remove: () => void
    moveUp: () => void
    moveDown: () => void
    // Whether an up/down control should be offered at all. The row cannot work
    // this out from `index` alone - it does not know how many siblings it has.
    isFirst: boolean
    isLast: boolean
}

// What the array as a whole offers, as opposed to one row.
export interface FieldArrayActions {
    // Appends a row with this value. There is no default: the component never
    // sees the element schema, so an invented blank row would be a guess at a
    // shape only the caller knows.
    append: (value: unknown) => void
    count: number
}

export interface FormFieldArrayProps {
    name: string
    children: (row: FieldArrayRow) => React.ReactNode
    // Rendered instead of the rows while there are none. Without it an empty
    // array renders nothing, which is right for a list that is about to be
    // filled and wrong for one the user is meant to notice is empty.
    empty?: React.ReactNode
    // Rendered after the rows, and also alongside `empty` when there are none.
    // An add control that renders only when a row already exists leaves an
    // emptied array with no way back into it.
    actions?: (actions: FieldArrayActions) => React.ReactNode
}

// Repeats its children once per item in an array-valued field, and hands each
// row the controls that edit the array around it. The component supplies the
// behaviour, never the markup: what an add or a remove button looks like is the
// caller's, so the row gets callbacks and the array gets an `actions` slot.
//
// The array itself is not registered as a field, so its schema is whatever the
// form's schema says about that key. A row's errors arrive on the row's path,
// which is why each field is named against the row rather than the array.
export const FormFieldArray: React.FC<FormFieldArrayProps> = ({
    name,
    children,
    empty,
    actions,
}) => {
    const { control } = useFormContext()
    const { fields, append, remove, move } = useFieldArray({ control, name })

    const rendered = actions?.({ append: (value) => append(value as never), count: fields.length })

    if (fields.length === 0)
        return (
            <>
                {empty ?? null}
                {rendered}
            </>
        )

    const last = fields.length - 1

    return (
        <>
            {fields.map((field, index) => (
                <React.Fragment key={field.id}>
                    {children({
                        name: `${name}.${index}`,
                        index,
                        id: field.id,
                        remove: () => remove(index),
                        // Both ends are refused here rather than left to the
                        // caller to disable. react-hook-form reorders by
                        // splicing, so a target of -1 puts the row back in
                        // before the last one and a target past the end leaves
                        // an undefined hole behind it - two silent corruptions
                        // that a forgotten `disabled` attribute would buy.
                        moveUp: () => {
                            if (index > 0) move(index, index - 1)
                        },
                        moveDown: () => {
                            if (index < last) move(index, index + 1)
                        },
                        isFirst: index === 0,
                        isLast: index === last,
                    })}
                </React.Fragment>
            ))}
            {rendered}
        </>
    )
}
