import React from 'react'

const NumberInput = ({ value, onChange }) => {
    return (
        <input
            type="number"
            value={value ?? ''}
            onChange={e => {
                const val = e.target.value
                onChange(val === '' ? undefined : Number(val))
            }}
        />
    )
}

export default NumberInput
