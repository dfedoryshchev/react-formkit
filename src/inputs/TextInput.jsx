import React from 'react'

const TextInput = ({ value, onChange, placeholder }) => {
    return (
        <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    )
}

export default TextInput
