import React from 'react'
import { z } from 'zod'
import BasicForm from '../src/form/BasicForm'
import FormField from '../src/field/FormField'

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
    skills: z.array(z.string()).optional(),
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

const skillOptions = [
    { value: 'react', label: 'React' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'node', label: 'Node.js' },
    { value: 'css', label: 'CSS/SCSS' },
]

const App = () => {
    const handleSubmit = (data: any) => {
        console.log('Form submitted:', data)
        alert(JSON.stringify(data, null, 2))
    }

    return (
        <div style={{ maxWidth: 500, margin: '40px auto', padding: '0 20px' }}>
            <h1>react-formkit dev</h1>
            <p style={{ color: '#666', marginBottom: 24 }}>All available controls</p>

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
                    startDate: '',
                    preferredTime: '',
                    skills: [],
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

                <div style={{ marginTop: 24 }}>
                    <button type="submit" style={{ padding: '10px 24px', fontSize: 14 }}>
                        Submit
                    </button>
                </div>
            </BasicForm>
        </div>
    )
}

export default App
