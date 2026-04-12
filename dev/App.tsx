import React from 'react'
import { z } from 'zod'
import { Form, BasicForm } from '../src/form'
import { FormField } from '../src/field'

const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email'),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    age: z.number().min(0).max(120).optional(),
    bio: z.string().optional(),
    role: z.string().min(1, 'Select a role'),
    experience: z.string().min(1, 'Select experience level'),
    startDate: z.string().optional(),
    preferredTime: z.string().optional(),
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

const passwordSchema = z.object({
    password: z.string().min(6, 'At least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
})

const passwordMatchValidators = [
    {
        refinement: (data: any) => data.password === data.confirmPassword,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    },
]

const App = () => {
    const handleSubmit = async (data: any) => {
        // simulate a request so the submit button shows its loading state
        await new Promise((resolve) => setTimeout(resolve, 1200))
        console.log('Form submitted:', data)
        alert(JSON.stringify(data, null, 2))
    }

    return (
        <div style={{ maxWidth: 500, margin: '40px auto', padding: '0 20px' }}>
            <h1>react-formkit dev</h1>
            <p style={{ color: '#666', marginBottom: 24 }}>All available controls</p>

            <Form
                buttonLabel="Submit"
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
                    startDate: '',
                    preferredTime: '',
                    agree: false,
                }}
            >
                <h3>Text inputs</h3>
                <FormField name="name" type="text" label="Name" placeholder="Your name" />
                <FormField name="email" type="email" label="Email" />
                <FormField name="website" type="url" label="Website" />
                <FormField name="age" type="numeric" label="Age" />
                <FormField
                    name="bio"
                    type="textarea"
                    label="Bio"
                    placeholder="Tell us about yourself"
                />

                <h3>Selection</h3>
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
                    label="Experience Level"
                    options={experienceOptions}
                />

                <h3>Date &amp; Time</h3>
                <FormField name="startDate" type="date" label="Start Date" />
                <FormField name="preferredTime" type="time" label="Preferred Time" />

                <h3>Toggles</h3>
                <FormField name="agree" type="checkbox" label="I agree to the terms" />

            </Form>

            <h2 style={{ marginTop: 48 }}>Cross-field validation</h2>
            <p style={{ color: '#666', marginBottom: 16 }}>
                Confirm-password must match password (form-level validator).
            </p>
            <BasicForm
                onSubmit={(data) => alert(JSON.stringify(data, null, 2))}
                validationSchema={passwordSchema}
                defaultValues={{ password: '', confirmPassword: '' }}
                formLevelValidators={passwordMatchValidators}
            >
                <FormField name="password" type="text" label="Password" />
                <FormField name="confirmPassword" type="text" label="Confirm password" />
                <button type="submit" style={{ marginTop: 16, padding: '8px 20px', fontSize: 14 }}>
                    Change password
                </button>
            </BasicForm>
        </div>
    )
}

export default App
