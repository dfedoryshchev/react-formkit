import React, { useState } from 'react'
import Control from './controls/Control'

const options = [
    { value: 'dev', label: 'Developer' },
    { value: 'pm', label: 'Project Manager' },
    { value: 'qa', label: 'QA' },
]

const App = () => {
    const [name, setName] = useState('')
    const [age, setAge] = useState<number | undefined>(undefined)
    const [bio, setBio] = useState('')
    const [role, setRole] = useState('')
    const [agree, setAgree] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        alert(JSON.stringify({ name, age, bio, role, agree }, null, 2))
    }

    return (
        <div style={{ maxWidth: 500, margin: '40px auto', padding: '0 20px' }}>
            <h1>Form Fields</h1>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label>Name</label>
                    <Control type="text" value={name} onChange={setName} placeholder="Your name" />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>Age</label>
                    <Control type="numeric" value={age} onChange={setAge} />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>Bio</label>
                    <Control type="textarea" value={bio} onChange={setBio} />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>Role</label>
                    <Control
                        type="select"
                        value={role}
                        onChange={setRole}
                        options={options}
                        placeholder="-- pick --"
                    />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <Control type="checkbox" value={agree} onChange={setAgree} label="I agree" />
                </div>
                <button type="submit">Submit</button>
            </form>
        </div>
    )
}

export default App
