import React from 'react'
import './FieldMessage.scss'

type MessageType = 'error' | 'warning' | 'info'

interface FieldMessageProps {
    message?: string
    type?: MessageType
    visible?: boolean
}

const FieldMessage: React.FC<FieldMessageProps> = ({ message, type = 'error', visible = true }) => {
    if (!message || !visible) return null

    return (
        <div className={`custom-field-message custom-field-message--${type}`}>
            <span>{message}</span>
        </div>
    )
}

export default FieldMessage
