import React, { forwardRef, useState } from 'react'
import './MultiAutocompleteInput.scss'

interface MultiAutocompleteInputProps {
    value: string[]
    onChange: (value: string[]) => void
    placeholder?: string
    disabled?: boolean
}

// Tag input: type + Enter to add a value, click x to remove. Minimal, no
// third-party library, no reordering.
const MultiAutocompleteInput = forwardRef<HTMLInputElement, MultiAutocompleteInputProps>(
    ({ value = [], onChange, placeholder, disabled }, ref) => {
        const [inputValue, setInputValue] = useState('')

        const add = (raw: string) => {
            const trimmed = raw.trim()
            if (trimmed && !value.includes(trimmed)) {
                onChange([...value, trimmed])
            }
            setInputValue('')
        }

        const remove = (tag: string) => onChange(value.filter((v) => v !== tag))

        return (
            <div className="custom-multi-autocomplete">
                <div className="custom-multi-autocomplete__tags">
                    {value.map((tag) => (
                        <span key={tag} className="custom-multi-autocomplete__tag">
                            {tag}
                            <button
                                type="button"
                                onClick={() => remove(tag)}
                                disabled={disabled}
                                aria-label={`Remove ${tag}`}
                            >
                                x
                            </button>
                        </span>
                    ))}
                </div>
                <input
                    ref={ref}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            add(inputValue)
                        }
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                />
            </div>
        )
    },
)

MultiAutocompleteInput.displayName = 'MultiAutocompleteInput'

export default MultiAutocompleteInput
