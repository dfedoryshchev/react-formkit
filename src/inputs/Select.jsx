import React from 'react'

const Select = ({ value, onChange, options = [] }) => {
    return (
        <select value={value || ''} onChange={e => onChange(e.target.value)}>
            <option value="">-- select --</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    )
}

export default Select
