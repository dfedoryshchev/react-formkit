import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Button from '@mui/material/Button'

interface FormData {
    name: string
    email: string
    role: string
}

const MuiForm = () => {
    const { control, handleSubmit } = useForm<FormData>({
        defaultValues: { name: '', email: '', role: '' }
    })

    const onSubmit = (data: FormData) => {
        alert(JSON.stringify(data, null, 2))
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: 400, margin: '20px auto' }}>
            <Controller
                control={control}
                name="name"
                render={({ field }) => (
                    <TextField {...field} label="Name" fullWidth margin="normal" />
                )}
            />
            <Controller
                control={control}
                name="email"
                render={({ field }) => (
                    <TextField {...field} label="Email" fullWidth margin="normal" />
                )}
            />
            <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Controller
                    control={control}
                    name="role"
                    render={({ field }) => (
                        <Select {...field} label="Role">
                            <MenuItem value="dev">Developer</MenuItem>
                            <MenuItem value="pm">PM</MenuItem>
                            <MenuItem value="qa">QA</MenuItem>
                        </Select>
                    )}
                />
            </FormControl>
            <Button type="submit" variant="contained" sx={{ mt: 2 }}>Submit</Button>
        </form>
    )
}

export default MuiForm
