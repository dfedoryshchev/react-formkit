# react-formkit

React + TypeScript form component library built on React Hook Form and Zod.

## Install

```bash
npm install react-formkit
# peer dependencies
npm install react react-dom react-hook-form @hookform/resolvers zod
# optional, only if you use the multiselect / phone controls
npm install react-select react-phone-input-2
```

## Architecture

```
Form / BasicForm (FormProvider + zodResolver + ValidationSchemaContext)
  └─ FormField (useController bridge + useIsFieldRequired)
       └─ Field (HOC composition: withRequired -> withFieldMessage -> withLabel -> withControlProps)
            └─ Control (type router)
                 └─ TextInput | NumericInput | SelectInput | SwitchInput | ...
```

## Controls

| Type                 | Component             | Description                                   |
| -------------------- | --------------------- | --------------------------------------------- |
| `text`               | TextInput             | Standard text input                           |
| `numeric`            | NumericInput          | Number input with empty value handling        |
| `textarea`           | TextareaInput         | Multi-line text                               |
| `select`             | SelectInput           | Dropdown with typed options and serialization |
| `checkbox`           | CheckboxInput         | Boolean checkbox                              |
| `checkbox-group`     | CheckboxGroup         | Multi-select checkboxes                       |
| `radio`              | RadioGroup            | Radio button group                            |
| `switch`             | SwitchInput           | Toggle switch                                 |
| `password`           | PasswordInput         | Password with show/hide toggle                |
| `email`              | EmailInput            | Email input                                   |
| `url`                | UrlInput              | URL input                                     |
| `date` / `time` / `datetime` | DateInput / TimeInput / DateTimeInput | Date and time pickers         |
| `multiselect`        | MultiSelectInput      | Multi-value select (react-select)             |
| `autocomplete`       | AutocompleteInput     | Text input with datalist suggestions          |
| `multi-autocomplete` | MultiAutocompleteInput | Tag input (type + Enter)                     |
| `phone`              | PhoneInput            | Phone input with country code (react-phone-input-2) |

## Usage

```tsx
import { Form, FormField } from 'react-formkit'
import { z } from 'zod'

const schema = z.object({
    name: z.string().min(2, 'Too short'),
    email: z.string().email(),
    role: z.string().min(1, 'Required'),
})

const MyForm = () => (
    <Form buttonLabel="Submit" onSubmit={console.log} validationSchema={schema}>
        <FormField name="name" type="text" label="Name" />
        <FormField name="email" type="email" label="Email" />
        <FormField name="role" type="select" label="Role" options={roleOptions} />
    </Form>
)
```

`BasicForm` is the same pipeline without the built-in submit button - use it when you supply your own controls.

## Validation

```tsx
import { required, email, minLength, phone } from 'react-formkit' // common
import { positive, between, integer, percentage } from 'react-formkit' // numbers
import { latinOnly, cyrillicOnly, digitsOnly } from 'react-formkit' // charset
import { personName, companyName } from 'react-formkit' // presets
```

Required fields are detected from the schema - a field with `.describe('required')` or `min(1)` shows the required indicator automatically via `useIsFieldRequired`. Cross-field rules go through `useFormLevelValidators`.

## Config-driven forms

Describe a form as data and render it from a config array:

```tsx
import { Form, useFormFromConfig, ConfigFields, FormConfig } from 'react-formkit'

// hoist the config (module scope or memo) so it is not re-derived each render
const config: FormConfig = [
    { name: 'fullName', type: 'text', label: 'Full name', validation: ['required', { rule: 'minLength', value: 2 }] },
    { name: 'email', type: 'email', label: 'Email', validation: ['required', { rule: 'email' }] },
    { name: 'age', type: 'numeric', label: 'Age', validation: [{ rule: 'min', value: 18 }] },
]

function SignupForm() {
    const { defaults, fields, schema } = useFormFromConfig(config)
    return (
        <Form defaultValues={defaults} validationSchema={schema} onSubmit={console.log}>
            <ConfigFields config={fields} />
        </Form>
    )
}
```

`useFormFromConfig` derives the default values and a Zod schema from the config; `ConfigFields` renders the controls onto the native Field/Control stack.

### Known limitations
- Hoist the config - an inline array literal re-derives defaults/schema each render.
- `required` is not yet enforced across all field types, and non-required fields are not made optional.
- No nested / grouped fields yet.
- Async and cross-field rules are not part of the config schema (use `useFormLevelValidators`).

## Theming

Styling is driven by CSS custom properties. Override them in your own `:root` (or any scope):

```css
:root {
    --fk-focus-color: #2b6cb0;
    --fk-border-color: #cbd5e0;
    --fk-focus-ring: rgba(43, 108, 176, 0.25);
    --fk-disabled-bg: #edf2f7;
    --fk-radius: 6px;
}
```

## Dev

```bash
npm install
npm run dev    # playground
npm test       # vitest
npm run build  # library build
```

## Status

Active development. Core form system, validation, cross-field rules, and the full control set are functional. Type declarations are not generated yet.
