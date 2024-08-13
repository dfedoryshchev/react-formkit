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

const Form = () => {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [age, setAge] = useState(undefined)
    const [role, setRole] = useState('')
    const [agree, setAgree] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        console.log({ name, email, age, role, agree })
    }

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Name</label>
                <TextInput value={name} onChange={setName} />
            </div>
            <div>
                <label>Email</label>
                <TextInput value={email} onChange={setEmail} />
            </div>
            <div>
                <label>Age</label>
                <NumberInput value={age} onChange={setAge} />
            </div>
            <div>
                <label>Role</label>
                <Select value={role} onChange={setRole} options={roleOptions} />
            </div>
            <div>
                <Checkbox checked={agree} onChange={setAgree} label="I agree to terms" />
            </div>
            <button type="submit">Submit</button>
        </form>
    )
}

export default Form
