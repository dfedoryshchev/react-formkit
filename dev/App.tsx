import React from 'react'
import { z } from 'zod'
import BasicForm from '../src/form/BasicForm'
import FormField from '../src/field/FormField'

const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email'),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    age: z.number().optional(),
    bio: z.string().optional(),
    role: z.string().min(1, 'Select a role'),
    experience: z.string().min(1, 'Select experience level'),
    agree: z.boolean(),
})

const roleOptions = [
    { value: 'dev', label: 'Developer' },
    { value: 'pm', label: 'Project Manager' },
    { value: 'qa', label: 'QA Engineer' },
    { value: 'design', label: 'Designer' },
]

const experienceOptions = [
    { value: 'junior', label: 'Junior (0-2 years)' },
    { value: 'mid', label: 'Mid (2-5 years)' },
    { value: 'senior', label: 'Senior (5+ years)' },
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
                    website: '',
                    age: undefined,
                    bio: '',
                    role: '',
                    experience: '',
                    agree: false,
                }}
            >
                <FormField name="name" type="text" label="Name" placeholder="Your name" />
                <FormField name="email" type="email" label="Email" />
                <FormField name="website" type="url" label="Website" />
                <FormField name="age" type="numeric" label="Age" />
                <FormField name="bio" type="textarea" label="Bio" />
                <FormField
                    name="role"
                    type="select"
                    label="Role"
                    options={roleOptions}
                    placeholder="-- select --"
                />
                <FormField
                    name="experience"
                    type="radio"
                    label="Experience"
                    options={experienceOptions}
                />
                <FormField name="agree" type="checkbox" label="I agree to the terms" />
                <button type="submit" style={{ marginTop: 16, padding: '8px 20px' }}>
                    Submit
                </button>
            </BasicForm>
        </div>
    )
}

export default App
