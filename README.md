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
