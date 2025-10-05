# react-formkit

React + TypeScript form component library built on React Hook Form and Zod.

## Architecture

```
BasicForm (FormProvider + zodResolver)
  └─ FormField (useController bridge)
       └─ Field (HOC composition: withRequired → withFieldMessage → withLabel → withControlProps)
            └─ Control (type router)
                 └─ TextInput | NumericInput | SelectInput | CheckboxInput | RadioGroup | ...
```

## Available Controls

| Type | Component | Description |
|------|-----------|-------------|
| `text` | TextInput | Standard text input |
| `numeric` | NumericInput | Number input with empty value handling |
| `textarea` | TextareaInput | Multi-line text |
| `select` | SelectInput | Dropdown with typed options and serialization |
| `checkbox` | CheckboxInput | Boolean checkbox |
| `radio` | RadioGroup | Radio button group |
| `email` | EmailInput | Email-specific input |
| `url` | UrlInput | URL input |
| `date` | DateInput | Date picker |
| `time` | TimeInput | Time picker |
| `datetime` | DateTimeInput | Date + time picker |

## Validation

Built-in validators using Zod:

```tsx
import { required, email, minLength } from './validation/validators/common.validators'
import { positive, between } from './validation/validators/number.validators'
import { latinOnly } from './validation/validators/charset.validators'
```

Schema-driven required field detection via `useIsFieldRequired` — fields with `.describe('required')` or `min(1)` automatically show the required indicator.

## Usage

```tsx
import BasicForm from './form/BasicForm'
import FormField from './field/FormField'
import { z } from 'zod'

const schema = z.object({
    name: z.string().min(2, 'Too short'),
    email: z.string().email(),
    role: z.string().min(1, 'Required'),
    agree: z.boolean(),
})

const MyForm = () => (
    <BasicForm onSubmit={console.log} validationSchema={schema}>
        <FormField name="name" type="text" label="Name" />
        <FormField name="email" type="email" label="Email" />
        <FormField name="role" type="select" label="Role" options={roleOptions} />
        <FormField name="agree" type="checkbox" label="I agree" />
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

Active development. Core form system, validation, and base controls are functional. Upcoming: tests, additional controls, monorepo split.
