import React from 'react'

const Checkbox = ({ checked, onChange, label }) => {
    return (
        <label>
            <input
                type="checkbox"
                checked={!!checked}
                onChange={e => onChange(e.target.checked)}
            />
            {label}
        </label>
    )
}

export default Checkbox
