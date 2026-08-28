# CLAUDE.md

Guidance for coding agents writing application code that *uses* react-formkit.

If you are changing the library itself rather than consuming it, read `AGENTS.md` instead.
`llms.txt` is the short index of the API surface.

## Pick the right entry point first

There are two ways to build a form and they share one runtime. Choosing wrong is the most
common way generated code ends up fighting the library.

**Write JSX when the form is known at authoring time.** Declare a Zod schema, pass it to
`Form`, and list `FormField` children.

```tsx
import { Form, FormField } from 'react-formkit'
import { z } from 'zod'

const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
})

<Form validationSchema={schema} onSubmit={onSubmit}>
    <FormField name="name" type="text" label="Name" />
    <FormField name="email" type="email" label="Email" />
</Form>
```

**Write a config when the form comes from data** - a CMS, an API response, a feature flag, or
anything else that decides the fields at runtime.

```tsx
import { Form, useFormFromConfig, ConfigFields, type FormConfig } from 'react-formkit'

const config: FormConfig = [
    { name: 'fullName', type: 'text', label: 'Full name', validation: ['required'] },
    { name: 'age', type: 'numeric', label: 'Age', validation: [{ rule: 'min', value: 18 }] },
]

function SignupForm() {
    const { defaults, fields, schema } = useFormFromConfig(config)
    return (
        <Form defaultValues={defaults} validationSchema={schema} onSubmit={onSubmit}>
            <ConfigFields config={fields} />
        </Form>
    )
}
```

Do not mix the two for one form. A config already produces the schema; handing `Form` a
separate hand-written schema alongside `ConfigFields` means two sources of truth for the same
fields.

`Form` includes a loading-aware submit button. Use `BasicForm` when you supply your own submit
control; it is the same pipeline without the button.

## Mistakes to avoid

**Hoist the config.** An inline array literal passed to `useFormFromConfig` re-derives the
default values and the Zod schema on every render. Put it at module scope, or memoise it.

```tsx
// wrong - new array identity every render
const { fields, schema } = useFormFromConfig([{ name: 'a', type: 'text' }])
```

**Do not expect a React provider to change validation messages.** Validators run when the
schema is built, outside rendering, so by the time React renders, the strings are already inside
the Zod schema. Use the mechanisms below instead.

**Do not pass an already-built schema when you want per-form messages.** The `messages` prop
only affects a schema built inside the form, which is why `validationSchema` also accepts a
builder function. A ready-made schema already carries its strings.

**Do not hand-write a required message.** The required indicator is inferred from the schema by
`useIsFieldRequired`, and the message comes from the message map. Writing `'Required'` inline
gives you a string no override can reach and wording that does not match the library's own
default, which is `'This field is required'`.

**`select`, `multiselect`, `radio` and `checkbox-group` need `options`.** A select with no
options renders empty rather than erroring.

## Translating or changing messages

Every built-in message lives in one map. Three scopes, smallest first:

```tsx
import { setMessages, defaultMessages } from 'react-formkit'

// app-wide, once at startup. Pass nothing to restore the defaults.
setMessages({
    required: 'Champ obligatoire',
    minLength: 'Au moins {min} caracteres',
})
```

Parameterised messages (`minLength`, `maxLength`, `minValue`, `maxValue`, `between`) are
functions by default, because a translation needs to move the number inside the sentence. An
override may be either a function or a template with named placeholders, so a JSON translation
bundle - which cannot hold functions - still works. An unknown placeholder is left visible
rather than blanked, so a wrong key shows up instead of silently vanishing.

Per form, pass `messages`, and give `validationSchema` a **builder** so it is built inside the
override scope:

```tsx
<Form
    messages={{ required: 'Obligatoire' }}
    validationSchema={() => z.object({ name: z.string().min(1) })}
    onSubmit={onSubmit}
/>
```

## Conditional fields

In a config, `showWhen` renders a field only while a sibling matches, validates it only while
visible, and drops its value when it hides - so a required field in a collapsed branch can
neither block submit with an error nobody can see nor leave a stale value in the payload.

```tsx
{ name: 'street', type: 'text', label: 'Street', showWhen: { field: 'hasAddress', is: true } }
```

Conditions are `is`, `isNot`, or a `test` predicate.

Outside a config, wrap any subtree. Here clearing is **opt-in**, because a branch collapsed only
for space should keep what was typed into it:

```tsx
<ConditionalField when="hasAddress" is={true} clear="street">
    <FormField name="street" type="text" label="Street" />
</ConditionalField>
```

Making a hand-written schema conditional is yours to do; the automatic half applies to `showWhen`
in a config.

## Validation

Field rules come from the Zod schema. The library also exports ready-made validators:

- common: `required`, `requiredNumber`, `email`, `url`, `phone`, `minLength`, `maxLength`,
  `matchesRegex`
- number: `positive`, `nonNegative`, `notZero`, `integer`, `between`, `minValue`, `maxValue`,
  `percentage`
- charset: `latinOnly`, `cyrillicOnly`, `latinOrCyrillic`, `digitsOnly`, `alphanumeric`
- presets: `personName`, `companyName`

Cross-field rules (confirm-password, date ranges, "one of these is required") do not belong in a
per-field schema. Use `useFormLevelValidators`.

### Asking a server: `asyncCheck`

`asyncCheck(base, check, options)` wraps a field schema in a debounced remote check, the canonical
one being "is this username still free?"; `check` resolves `true` when the value is acceptable. A
debounce is only worth its delay under a `mode` that validates before submit, so pass one.

```tsx
import { Form, FormField, asyncCheck, required } from 'react-formkit'
import { z } from 'zod'

// module scope, not inside the component - see below
const schema = z.object({
    username: asyncCheck(required(), isUsernameFree, {
        delay: 300,
        message: 'That username is taken',
    }),
})

<Form validationSchema={schema} mode="onChange" onSubmit={onSubmit}>
    <FormField name="username" type="text" label="Username" />
</Form>
```

Four things to know before generating code around it:

**Hoist the schema.** The debounce lives in the closure the validator was built with, because
validators run outside React and there is no hook to hold it in. A schema rebuilt on every render
hands the field a fresh channel that has never seen a keystroke, so the window never elapses.

**The check never sees an empty value.** The base schema owns that case, and clearing the field
also cancels a request that was already counting down.

**A verdict about a value the user has left cannot decide the current one.** Every parse waiting
on a window receives the verdict for the value that window ends on, whatever order the requests
come back in.

**A check that throws fails open.** A network blip leaves the field valid rather than
unsubmittable; the server is still the authority at submit.

`asyncCheck` applies to a hand-written schema. A config's `validation` list is data, and a remote
check is a function, so the config entry point has no way to express one yet.

## Styling

Styling is CSS custom properties, not props or a theme object. Override them in any scope:

```css
:root {
    --fk-focus-color: #485fc7;
    --fk-border-color: #dbdbdb;
    --fk-focus-ring: rgba(72, 95, 199, 0.15);
    --fk-disabled-bg: #f5f5f5;
    --fk-radius: 4px;
}
```

## Current limits, so you do not generate around them

- No nested or grouped fields in a config; object- and array-shaped values cannot be modelled yet.
- Async and cross-field rules are not part of the config schema; `asyncCheck` and
  `useFormLevelValidators` apply to a hand-written schema only.
- `required` is not enforced across every field type, and non-required fields are not made optional.
- A hidden conditional field is absent from the submitted values rather than present and empty.
- Type declarations are not generated yet, so there are no `.d.ts` files in the published package.
