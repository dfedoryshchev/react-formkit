import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import FormHelperText from '@mui/material/FormHelperText'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

const theme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
    },
    components: {
        MuiTextField: {
            defaultProps: { size: 'small', variant: 'outlined' },
        },
    },
})

interface FormData {
    name: string
    email: string
    role: string
}

// this works but... it's A LOT of config for what is essentially
// just wrapping inputs. I want something lighter where i control
// the markup and styling myself. mui adds too much overhead.

const MuiForm = () => {
    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
        defaultValues: { name: '', email: '', role: '' }
    })

    const onSubmit = (data: FormData) => {
        alert(JSON.stringify(data, null, 2))
    }

    return (
        <ThemeProvider theme={theme}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 400, mx: 'auto', mt: 3 }}>
                <Controller
                    control={control}
                    name="name"
                    rules={{ required: 'Name is required' }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Name"
                            fullWidth
                            margin="normal"
                            error={!!errors.name}
                            helperText={errors.name?.message}
                        />
                    )}
                />
                <Controller
                    control={control}
                    name="email"
                    rules={{ required: 'Email is required' }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Email"
                            fullWidth
                            margin="normal"
                            error={!!errors.email}
                            helperText={errors.email?.message}
                        />
                    )}
                />
                <FormControl fullWidth margin="normal" error={!!errors.role}>
                    <InputLabel>Role</InputLabel>
                    <Controller
                        control={control}
                        name="role"
                        rules={{ required: 'Pick a role' }}
                        render={({ field }) => (
                            <Select {...field} label="Role">
                                <MenuItem value="dev">Developer</MenuItem>
                                <MenuItem value="pm">PM</MenuItem>
                                <MenuItem value="qa">QA</MenuItem>
                            </Select>
                        )}
                    />
                    {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
                </FormControl>
                <Button type="submit" variant="contained" sx={{ mt: 2 }}>Submit</Button>
            </Box>
        </ThemeProvider>
    )
}

export default MuiForm
