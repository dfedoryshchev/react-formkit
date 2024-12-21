import React from 'react'
import { z } from 'zod'
import BasicForm from '../src/form/BasicForm'
import FormField from '../src/field/FormField'

const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email'),
    age: z.number().optional(),
    bio: z.string().optional(),
    role: z.string().min(1, 'Select a role'),
    agree: z.boolean(),
})

const roleOptions = [
    { value: 'dev', label: 'Developer' },
    { value: 'pm', label: 'Project Manager' },
    { value: 'qa', label: 'QA Engineer' },
    { value: 'design', label: 'Designer' },
]

const App = () => {
    const handleSubmit = (data: any) => {
        alert(JSON.stringify(data, null, 2))
    }

    return (
        <div style={{ maxWidth: 500, margin: '40px auto', padding: '0 20px' }}>
            <h1>Form Fields - Dev</h1>
            <BasicForm
                onSubmit={handleSubmit}
                validationSchema={schema}
                defaultValues={{
                    name: '',
                    email: '',
                    age: undefined,
                    bio: '',
                    role: '',
                    agree: false,
                }}
            >
                <FormField name="name" type="text" label="Name" placeholder="Your name" />
                <FormField name="email" type="text" label="Email" placeholder="email@example.com" />
                <FormField name="age" type="numeric" label="Age" />
                <FormField name="bio" type="textarea" label="Bio" />
                <FormField name="role" type="select" label="Role" options={roleOptions} placeholder="-- select --" />
                <FormField name="agree" type="checkbox" label="I agree to the terms" />
                <button type="submit" style={{ marginTop: 16, padding: '8px 20px' }}>
                    Submit
                </button>
            </BasicForm>
        </div>
    )
}

export default App
