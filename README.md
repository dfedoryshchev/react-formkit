# react-formkit

React + TypeScript form component library built on React Hook Form and Zod.

## Architecture

```
BasicForm (FormProvider + zodResolver + ValidationSchemaContext)
  └─ FormField (useController bridge + useIsFieldRequired)
       └─ Field (HOC composition: withRequired → withFieldMessage → withLabel → withControlProps)
            └─ Control (type router)
                 └─ TextInput | NumericInput | SelectInput | CheckboxInput | RadioGroup | ...
```

## Controls

| Type            | Component     | Description                                   |
| --------------- | ------------- | --------------------------------------------- |
| `text`          | TextInput     | Standard text input                           |
| `numeric`       | NumericInput  | Number input with empty value handling        |
| `textarea`      | TextareaInput | Multi-line text                               |
| `select`        | SelectInput   | Dropdown with typed options and serialization |
| `checkbox`      | CheckboxInput | Boolean checkbox                              |
| `radio`         | RadioGroup    | Radio button group                            |
| `email`         | EmailInput    | Email input                                   |
| `url`           | UrlInput      | URL input                                     |
| `date`          | DateInput     | Date picker                                   |
| `time`          | TimeInput     | Time picker                                   |
| `datetime`      | DateTimeInput | Date + time picker                            |
| `checkboxGroup` | CheckboxGroup | Multi-select checkboxes                       |

## Validation

Zod-based validators:

```tsx
// common
import { required, email, minLength, maxLength, phone, url } from '@/validation'

// numbers
import { positive, between, integer, percentage } from '@/validation'

// charset
import { latinOnly, cyrillicOnly, digitsOnly } from '@/validation'
```

Schema-driven required field detection — fields with `.describe('required')` or `min(1)` automatically show the required indicator via `useIsFieldRequired`.

## Usage

```tsx
import { BasicForm } from './form'
import { FormField } from './field'
import { z } from 'zod'

const schema = z.object({
    name: z.string().min(2, 'Too short'),
    email: z.string().email(),
    role: z.string().min(1, 'Required'),
})

const MyForm = () => (
    <BasicForm onSubmit={console.log} validationSchema={schema}>
        <FormField name="name" type="text" label="Name" />
        <FormField name="email" type="email" label="Email" />
        <FormField name="role" type="select" label="Role" options={roleOptions} />
        <button type="submit">Submit</button>
    </BasicForm>
)
```

## Dev

```bash
npm install
npm run dev
```

## Status

Active development. Core form system, validation, and base controls are functional.
