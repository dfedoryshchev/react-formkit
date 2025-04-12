# react-formkit

React + TypeScript form component library built on top of React Hook Form and Zod.

## Features

- Composable form fields with HOC pattern (label, validation message, required indicator)
- Typed control components: text, numeric, textarea, select, checkbox
- Zod schema validation via `@hookform/resolvers`
- `BasicForm` wrapper with `FormProvider`
- `FormField` bridges React Hook Form's `useController` to field components

## Available Controls

| Type | Component | Description |
|------|-----------|-------------|
| `text` | TextInput | Standard text input |
| `numeric` | NumericInput | Number input with empty value handling |
| `textarea` | TextareaInput | Multi-line text |
| `select` | SelectInput | Dropdown with typed options |
| `checkbox` | CheckboxInput | Boolean checkbox |

## Usage

```tsx
import BasicForm from './form/BasicForm'
import FormField from './field/FormField'
import { z } from 'zod'

const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
})

<BasicForm onSubmit={handleSubmit} validationSchema={schema}>
    <FormField name="name" type="text" label="Name" />
    <FormField name="email" type="text" label="Email" />
    <button type="submit">Submit</button>
</BasicForm>
```

## Dev

```bash
npm install
npm run dev
```

## Status

WIP — core controls and form integration work. Validation, additional input types, and tests are in progress.
