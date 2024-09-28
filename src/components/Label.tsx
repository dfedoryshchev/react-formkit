import React from 'react'
import './Label.scss'

interface LabelProps {
    text?: string
    required?: boolean
    children?: React.ReactNode
    htmlFor?: string
}

const Label: React.FC<LabelProps> = ({ text, required, children, htmlFor }) => {
    if (children) {
        return (
            <div className="custom-field-label">
                <label htmlFor={htmlFor}>
                    {text}
                    {required && <span className="required-mark">*</span>}
                </label>
                {children}
            </div>
        )
    }

    return (
        <label className="custom-field-label" htmlFor={htmlFor}>
            {text}
            {required && <span className="required-mark">*</span>}
        </label>
    )
}

export default Label
