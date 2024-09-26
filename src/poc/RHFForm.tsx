import React from 'react'
import { useForm, FormProvider, useFormContext, useController } from 'react-hook-form'

const FormInput = ({ name, label, rules }) => {
    const { control } = useFormContext()
    const { field, fieldState } = useController({ control, name, rules })

    return (
        <div style={{ marginBottom: 10 }}>
            <label>{label}</label>
            <br />
            <input {...field} />
            {fieldState.error && (
                <span style={{ color: 'red', fontSize: 12 }}>{fieldState.error.message}</span>
            )}
        </div>
    )
}

const FormSelect = ({ name, label, options }) => {
    const { control } = useFormContext()
    const { field } = useController({ control, name })

    return (
        <div style={{ marginBottom: 10 }}>
            <label>{label}</label>
            <br />
            <select {...field}>
                <option value="">-- select --</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </div>
    )
}

// this is nice. FormProvider wraps everything, child components pull context
// no need to drill control prop everywhere
const RHFForm = () => {
    const methods = useForm({
        defaultValues: { name: '', email: '', role: '' },
    })

    const onSubmit = (data) => {
        alert(JSON.stringify(data, null, 2))
    }

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                <FormInput name="name" label="Name" rules={{ required: 'Name required' }} />
                <FormInput name="email" label="Email" rules={{ required: 'Email required' }} />
                <FormSelect
                    name="role"
                    label="Role"
                    options={[
                        { value: 'dev', label: 'Developer' },
                        { value: 'pm', label: 'PM' },
                        { value: 'qa', label: 'QA' },
                    ]}
                />
                <button type="submit">Submit</button>
            </form>
        </FormProvider>
    )
}

export default RHFForm
