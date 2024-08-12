import React, { useState } from 'react'

const Form = () => {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        console.log({ name, email })
    }

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Name</label>
                <input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
                <label>Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button type="submit">Submit</button>
        </form>
    )
}

export default Form
