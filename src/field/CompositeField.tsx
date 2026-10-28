import React, { useId } from 'react'
import './CompositeField.scss'

// How a composite arranges its children: one under another, or side by side.
export type GroupLayout = 'stack' | 'row'

export interface CompositeFieldProps {
    // The path of the object value the children fill in, such as `address`.
    name: string
    label?: React.ReactNode
    description?: React.ReactNode
    layout?: GroupLayout
    // A function receives the group's own path, so a child builds its field
    // name from it rather than repeating the group name by hand.
    children: React.ReactNode | ((group: { name: string }) => React.ReactNode)
}

// Several fields presented as one: a fieldset with an optional legend and
// description around children that each register their own part of a nested
// value. The value itself belongs to the schema, so this component only lays
// the children out and names them.
export const CompositeField: React.FC<CompositeFieldProps> = ({
    name,
    label,
    description,
    layout = 'stack',
    children,
}) => {
    const descriptionId = useId()
    const hasDescription = description !== undefined && description !== null

    return (
        <fieldset
            name={name}
            className={`fk-group fk-group--${layout}`}
            aria-describedby={hasDescription ? descriptionId : undefined}
        >
            {label !== undefined && <legend className="fk-group__label">{label}</legend>}
            {hasDescription && (
                <p id={descriptionId} className="fk-group__description">
                    {description}
                </p>
            )}
            <div className="fk-group__fields">
                {typeof children === 'function' ? children({ name }) : children}
            </div>
        </fieldset>
    )
}
