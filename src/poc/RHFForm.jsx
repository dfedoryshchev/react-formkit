import React from 'react'
import { useForm, useController } from 'react-hook-form'

const ControlledInput = ({ control, name, label, rules }) => {
    const { field, fieldState } = useController({ control, name, rules })

    return (
        <div>
            <label>{label}</label>
            <input {...field} />
            {fieldState.error && (
                <span style={{ color: 'red' }}>{fieldState.error.message}</span>
            )}
        </div>
    )
}

const ControlledSelect = ({ control, name, label, options }) => {
    const { field } = useController({ control, name })

    return (
        <div>
            <label>{label}</label>
            <select {...field}>
                <option value="">-- select --</option>
                {options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    )
}

const RHFForm = () => {
    const { control, handleSubmit } = useForm({
        defaultValues: { name: '', email: '', role: '' }
    })

    const onSubmit = (data) => {
        alert(JSON.stringify(data, null, 2))
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <ControlledInput control={control} name="name" label="Name" rules={{ required: 'Name required' }} />
            <ControlledInput control={control} name="email" label="Email" rules={{ required: 'Email required' }} />
            <ControlledSelect
                control={control}
                name="role"
                label="Role"
                options={[
                    { value: 'dev', label: 'Developer' },
                    { value: 'pm', label: 'PM' },
                ]}
            />
            <button type="submit">Submit</button>
        </form>
    )
}

export default RHFForm
