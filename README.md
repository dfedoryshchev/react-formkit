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

### Async rules

`asyncCheck` wraps a field schema in a debounced remote check - "is this username still taken?". The check resolves `true` when the value is acceptable, and `mode` decides when it runs:

```tsx
import { Form, FormField, asyncCheck, required } from 'react-formkit'

// hoist the schema: the debounce lives in the closure the validator was built with,
// so a schema rebuilt each render restarts the window each render
const schema = z.object({
    username: asyncCheck(required(), isUsernameFree, { delay: 300, message: 'That username is taken' }),
})

const SignupForm = () => (
    <Form validationSchema={schema} mode="onChange" onSubmit={console.log}>
        <FormField name="username" type="text" label="Username" />
    </Form>
)
```

The check is never asked about an empty value, clearing the field cancels a request already counting down, and a verdict about a value the user has moved on from cannot decide the value now in the field. A check that throws fails open, so a network blip leaves the field submittable.

`mode` is passed straight to React Hook Form (`onChange`, `onBlur`, `onTouched`, `all`, `onSubmit`) and applies to every rule on the form, not just the async ones.

#### Showing that a field is waiting

`useIsAsyncValidating` reports whether one field is waiting on its remote check - true from the keystroke that arms the debounce window until the verdict lands, and one uninterrupted wait across a burst of keystrokes rather than one per key:

```tsx
const UsernameField = () => {
    const waiting = useIsAsyncValidating('username')
    return (
        <>
            <FormField name="username" type="text" label="Username" />
            {waiting && <Spinner />}
        </>
    )
}
```

It works anywhere inside a `Form` or `BasicForm`, and is false for a field with no `asyncCheck` on it.

React Hook Form's own per-field `isValidating` answers a different question here. The resolver parses the whole schema, so RHF marks the field whose event started the parse rather than the fields actually waiting on a request, and on submit it marks every mounted field whether it has a remote check or not.

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

### Conditional fields

A field is rendered only while a sibling matches its `showWhen` condition (`is`, `isNot`, or a `test` predicate):

```tsx
const config: FormConfig = [
    { name: 'hasAddress', type: 'checkbox', label: 'I have a mailing address' },
    { name: 'street', type: 'text', label: 'Street', showWhen: { field: 'hasAddress', is: true } },
]
```

A config-driven conditional field is validated only while it is visible, and its value is
dropped when it hides - so a required field inside a collapsed branch can neither block submit
with an unreachable error nor smuggle a stale value into the payload.

The same thing outside a config, around any subtree:

```tsx
<ConditionalField when="hasAddress" is={true} clear="street">
    <FormField name="street" type="text" label="Street" />
</ConditionalField>
```

`clear` is opt-in here and takes a field name or a list of them. Without it the branch keeps
its values while hidden, which is what you want when a branch is only collapsed for space.
Validation of a hand-written schema is yours to make conditional; the automatic half applies to
`showWhen` in a config.

### Repeated fields

`FormFieldArray` repeats its children once per item in an array-valued field. It is a render
prop, and the row it hands you carries the path prefix to build field names from:

```tsx
<FormFieldArray name="contacts" empty={<p>No contacts yet</p>}>
    {({ name, index }) => (
        <FormField name={`${name}.email`} type="email" label={`Email ${index + 1}`} />
    )}
</FormFieldArray>
```

Compose the name from `row.name` rather than writing `contacts.${index}` yourself - that is the
one place a field array goes quietly wrong. Rows are keyed by react-hook-form's own row id, not
by the index, so a later reorder moves a row rather than retyping two of them.

Errors land on the row's own path, and the required indicator now reads the schema through that
path too, so a `min(1)` inside the element schema marks the field in every row.

Add, remove and reorder come with the row. Each row carries `remove`, `moveUp` and `moveDown`,
plus `isFirst` / `isLast` so a row knows which of the two to offer; the array as a whole gets an
`actions` slot with `append` and `count`:

```tsx
<FormFieldArray
    name="contacts"
    actions={({ append }) => (
        <button type="button" onClick={() => append({ email: '' })}>
            Add contact
        </button>
    )}
>
    {({ name, remove, moveUp, isFirst }) => (
        <>
            <FormField name={`${name}.email`} type="email" label="Email" />
            <button type="button" onClick={remove}>
                Remove
            </button>
            <button type="button" onClick={moveUp} disabled={isFirst}>
                Up
            </button>
        </>
    )}
</FormFieldArray>
```

The buttons are yours; the component supplies only the behaviour. `actions` renders in the empty
state as well, because an add control that appears only once a row exists leaves an emptied array
with no way back. A move past either end is refused rather than passed on. `append` takes the
value a new row starts as - the component never sees the element schema, so it cannot invent one.

Array shapes are a hand-written-schema feature: a config cannot express a repeated field yet.

### Known limitations
- Hoist the config - an inline array literal re-derives defaults/schema each render.
- `required` is not yet enforced across all field types, and non-required fields are not made optional.
- No nested / grouped fields in a config; `FormFieldArray` is the hand-written-schema half only.
- `useIsAsyncValidating` does not resolve a field inside an array. One `asyncCheck` is shared by every row, so the pending state would be shared too.
- A conditional field is cleared by dropping it from the form, so a hidden branch is absent from the submitted values rather than present and empty.
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
