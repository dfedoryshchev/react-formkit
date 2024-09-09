import React from 'react'
import { useForm } from 'react-hook-form'

const RHFForm = () => {
    const { register, handleSubmit, formState: { errors } } = useForm()

    const onSubmit = (data) => {
        alert(JSON.stringify(data, null, 2))
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div>
                <label>Name</label>
                <input {...register('name', { required: 'Name is required' })} />
                {errors.name && <span style={{ color: 'red' }}>{errors.name.message}</span>}
            </div>
            <div>
                <label>Email</label>
                <input {...register('email', { required: true, pattern: /^\S+@\S+$/i })} />
                {errors.email && <span style={{ color: 'red' }}>Invalid email</span>}
            </div>
            <div>
                <label>Role</label>
                <select {...register('role')}>
                    <option value="">-- select --</option>
                    <option value="dev">Developer</option>
                    <option value="pm">PM</option>
                </select>
            </div>
            <button type="submit">Submit</button>
        </form>
    )
}

export default RHFForm
