import React from 'react'
import './FieldMessage.scss'

type MessageType = 'error' | 'warning' | 'info'

interface FieldMessageProps {
    message?: string
    type?: MessageType
    visible?: boolean
    id?: string
}

const FieldMessage: React.FC<FieldMessageProps> = ({ message, type = 'error', visible = true, id }) => {
    if (!message || !visible) return null

    return (
        <div id={id} className={`custom-field-message custom-field-message--${type}`}>
            {message}
        </div>
    )
}

export default FieldMessage
