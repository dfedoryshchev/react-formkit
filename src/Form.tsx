import React, { useState } from 'react'
import TextInput from './inputs/TextInput'
import NumberInput from './inputs/NumberInput'
import Select from './inputs/Select'
import Checkbox from './inputs/Checkbox'

const roleOptions = [
    { value: 'dev', label: 'Developer' },
    { value: 'pm', label: 'Project Manager' },
    { value: 'qa', label: 'QA' },
]

const Form: React.FC = () => {
    const [name, setName] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [age, setAge] = useState<number | undefined>(undefined)
    const [role, setRole] = useState<string>('')
    const [agree, setAgree] = useState<boolean>(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const data = { name, email, age, role, agree }
        alert(JSON.stringify(data, null, 2))
    }

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '20px auto' }}>
            <h2>Registration</h2>
            <div style={{ marginBottom: 12 }}>
                <label>Name</label>
                <TextInput value={name} onChange={setName} placeholder="Your name" />
            </div>
            <div style={{ marginBottom: 12 }}>
                <label>Email</label>
                <TextInput value={email} onChange={setEmail} placeholder="Email address" />
            </div>
            <div style={{ marginBottom: 12 }}>
                <label>Age</label>
                <NumberInput value={age} onChange={setAge} />
            </div>
            <div style={{ marginBottom: 12 }}>
                <label>Role</label>
                <Select value={role} onChange={setRole} options={roleOptions} />
            </div>
            <div style={{ marginBottom: 12 }}>
                <Checkbox checked={agree} onChange={setAgree} label="I agree to terms" />
            </div>
            <button type="submit" style={{ padding: '8px 16px' }}>Submit</button>
        </form>
    )
}

export default Form
