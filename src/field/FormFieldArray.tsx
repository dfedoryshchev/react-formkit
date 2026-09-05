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
}

export interface FormFieldArrayProps {
    name: string
    children: (row: FieldArrayRow) => React.ReactNode
    // Rendered instead of the rows while there are none. Without it an empty
    // array renders nothing, which is right for a list that is about to be
    // filled and wrong for one the user is meant to notice is empty.
    empty?: React.ReactNode
}

// Repeats its children once per item in an array-valued field. It renders rows
// and nothing else: adding, removing and reordering are the caller's for now,
// through react-hook-form's own `useFieldArray` on the same name.
//
// The array itself is not registered as a field, so its schema is whatever the
// form's schema says about that key. A row's errors arrive on the row's path,
// which is why each field is named against the row rather than the array.
export const FormFieldArray: React.FC<FormFieldArrayProps> = ({ name, children, empty }) => {
    const { control } = useFormContext()
    const { fields } = useFieldArray({ control, name })

    if (fields.length === 0) return <>{empty ?? null}</>

    return (
        <>
            {fields.map((field, index) => (
                <React.Fragment key={field.id}>
                    {children({ name: `${name}.${index}`, index, id: field.id })}
                </React.Fragment>
            ))}
        </>
    )
}
