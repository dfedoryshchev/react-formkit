import React, { forwardRef, useId } from 'react'
import { BaseInputProps } from '../control.types'
import './AutocompleteInput.scss'

interface AutocompleteInputProps extends BaseInputProps {
    suggestions?: string[]
}

// Text input with native datalist suggestions. No custom dropdown/filtering.
const AutocompleteInput = forwardRef<HTMLInputElement, AutocompleteInputProps>(
    ({ value, onChange, placeholder, disabled, className, suggestions, ...rest }, ref) => {
        const listId = useId()

        return (
            <div className="custom-autocomplete-input">
                <input
                    ref={ref}
                    type="text"
                    list={suggestions ? listId : undefined}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={className}
                    {...rest}
                />
                {suggestions && (
                    <datalist id={listId}>
                        {suggestions.map((s) => (
                            <option key={s} value={s} />
                        ))}
                    </datalist>
                )}
            </div>
        )
    },
)

AutocompleteInput.displayName = 'AutocompleteInput'

export default AutocompleteInput
