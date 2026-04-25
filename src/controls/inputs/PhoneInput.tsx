import React from 'react'
import PhoneInput2 from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

interface PhoneInputProps {
    value?: string
    onChange?: (value: string) => void
    country?: string
    onlyCountries?: string[]
    className?: string
    disabled?: boolean
    placeholder?: string
}

// Wraps react-phone-input-2 (country dropdown + formatting). The library owns
// its input internally, so ref forwarding is not supported - FormField's ref
// does not attach here.
const PhoneInput: React.FC<PhoneInputProps> = ({
    value,
    onChange,
    country = 'gb',
    onlyCountries,
    className,
    disabled,
    placeholder,
}) => {
    return (
        <PhoneInput2
            country={country}
            value={value}
            onChange={(phone: string) => onChange?.(phone)}
            onlyCountries={onlyCountries}
            disabled={disabled}
            placeholder={placeholder}
            inputClass={className}
        />
    )
}

export default PhoneInput
