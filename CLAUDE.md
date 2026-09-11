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

## What the form does while it submits, and once it has

Both sides of a submit are props, on `Form` and on `BasicForm` alike:

```tsx
<Form
    onSubmit={createOrder}
    onSuccess={(order, values) => track('order-created', order.id, values.email)}
    successContent={<p>Thanks - your order is on its way.</p>}
    loadingOverlay
>
    <FormField name="email" type="email" label="Email" />
</Form>
```

- `loadingOverlay` blocks the form while the handler is in flight. It paints above the form's
  own positioned content, takes the form out of pointer events, and holds keyboard focus until
  it closes, when focus returns to the control that had it.
- `onSuccess(result, data)` runs once `onSubmit` has resolved. `result` is whatever `onSubmit`
  returned, so an API response reaches the next step without a second source of truth for it.
- `successContent` renders once a submit has succeeded, in place of the form. Add
  `keepFormOnSuccess` to keep the form and put the content beside it.

**Neither side runs on a failed submit.** A schema error never reaches `onSubmit`, and a handler
that throws leaves both untouched. So do not wrap the body of `onSubmit` in a `try/catch` that
swallows the error - that is the one way to make `successContent` announce something that did
not happen.

**The success content is not a permanent state.** It shows from the submit that succeeded until
the next submit is in flight, and returns when that one succeeds. A form that leaves the page on
success should navigate from `onSuccess` rather than rely on the content staying put.

## Mistakes to avoid

**Do not edit a config rule in place and expect the schema to follow.** `useFormFromConfig`
memoises the defaults and the schema on a signature made of the field names and types, so an
inline array literal is *not* a performance problem - it is a correctness one in the opposite
direction. An edit that leaves every name and type alone is invisible to the memo:

```tsx
// the schema keeps min(2); a 3-character value still passes
const config = tightened ? [{ name: 'nick', type: 'text', validation: [{ rule: 'minLength', value: 8 }] }]
                         : [{ name: 'nick', type: 'text', validation: [{ rule: 'minLength', value: 2 }] }]
```

Changing a `name` or a `type`, or adding or removing a field, refreshes both. Changing a
`validation` entry, a `message` or a `defaultValue` does not. Generate configs whose shape
carries their rules, or move the component onto a new `key` when the rules change.

`label`, `placeholder`, `options`, `disabled` and `showWhen` are exempt - `fields` is the array
handed straight back, so those are read fresh every render.

**Do not repeat a field name in a config.** `useFormFromConfig` throws during render rather than
letting the later field last-win over the earlier one in both the defaults and the schema:

```
Error: useFormFromConfig: duplicate field name(s): email
```

De-duplicate a config assembled from more than one source before passing it in.

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

## Repeated fields

`FormFieldArray` repeats its children once per item in an array-valued field. It is a render
prop, and the row it hands you carries the path prefix:

```tsx
<FormFieldArray name="contacts" empty={<p>No contacts yet</p>}>
    {({ name, index }) => (
        <FormField name={`${name}.email`} type="email" label={`Email ${index + 1}`} />
    )}
</FormFieldArray>
```

**Build the field name from `row.name`, not from the index.** `` `${name}.email` `` and
`` `contacts.${index}.email` `` agree today and stop agreeing the moment the array is nested or
renamed, and a name that is one character off registers a second field rather than failing.

Rows are keyed by react-hook-form's row id rather than the index, so reordering moves a row
instead of retyping two of them. Errors arrive on the row's own path, and the required indicator
reads the schema through that path - a `min(1)` in the element schema marks the field in every
row.

### Adding, removing and reordering

The row also carries `remove`, `moveUp` and `moveDown`, and `isFirst` / `isLast` so it knows
which of the two moves to offer. `append` belongs to the array rather than to a row, so it comes
through the `actions` slot alongside `count`:

```tsx
<FormFieldArray
    name="contacts"
    empty={<p>No contacts yet</p>}
    actions={({ append, count }) => (
        <button type="button" onClick={() => append({ email: '' })}>
            {`Add contact (${count})`}
        </button>
    )}
>
    {({ name, remove, moveUp, moveDown, isFirst, isLast }) => (
        <>
            <FormField name={`${name}.email`} type="email" label="Email" />
            <button type="button" onClick={remove}>
                Remove
            </button>
            <button type="button" onClick={moveUp} disabled={isFirst}>
                Up
            </button>
            <button type="button" onClick={moveDown} disabled={isLast}>
                Down
            </button>
        </>
    )}
</FormFieldArray>
```

**Give every one of those buttons `type="button"`.** A bare `<button>` inside a form submits it,
so a remove control without the type removes the row and posts the form.

**`append` takes the value the new row starts as.** The component never sees the element schema,
so a blank row it invented would be a guess at a shape only you know.

**`actions` renders in the empty state too**, next to `empty` rather than instead of it. An add
control that appears only once a row exists leaves an emptied array with no way back into it.

A move past either end is refused rather than passed to react-hook-form, so `disabled` on those
buttons is presentation and not the guard.

One thing it deliberately does not do: **no config support.** A repeated field cannot be expressed
in a `FormConfig` yet, so this is the hand-written-schema entry point only.

`useIsAsyncValidating` resolves a row's path, so a row whose element schema carries an `asyncCheck`
gets its own pending indicator: call it with the row's own field name, built from `row.name` the
same way the field is.

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

Five things to know before generating code around it:

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

**One request per value, not per parse.** Validation parses the whole schema, so editing any other
field runs this one's check too - but with an unchanged value that joins the wait already open
instead of starting a new window. Request volume tracks what the user typed into this field, not
how busy the rest of the form is.

`asyncCheck` applies to a hand-written schema. A config's `validation` list is data, and a remote
check is a function, so the config entry point has no way to express one yet.

### The pending indicator: `useIsAsyncValidating`

`useIsAsyncValidating(fieldName)` is true while that one field waits on its remote check, from the
keystroke that arms the window until the verdict lands. A burst of keystrokes is one wait, not one
per key, which is the indicator a debounced field should show.

```tsx
const waiting = useIsAsyncValidating('username')
```

It reads the wait out of the validator closure, for the same reason the closure holds the debounce.
The field is found through the form's schema, so the hook works anywhere inside `Form` or
`BasicForm` and returns false for a field with no `asyncCheck` on it.

**Do not reach for React Hook Form's per-field `isValidating` instead.** It answers a different
question under a resolver: the resolver parses the whole schema, so RHF marks the field whose event
started the parse rather than the fields that are waiting on a request, and on submit it marks every
mounted field whether it has a remote check or not.

**Keep `asyncCheck` outermost.** Zod methods that clone rather than wrap - `.describe()` among them -
return an instance the pending channel is not attached to, and the hook then reads false forever.
Wrapping is fine: `.optional()` and a further `.refine()` both keep it reachable.

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
  `FormFieldArray` covers the hand-written-schema half of that only.
- Async and cross-field rules are not part of the config schema; `asyncCheck` and
  `useFormLevelValidators` apply to a hand-written schema only.
- `required` is not enforced across every field type, and non-required fields are not made optional.
- A hidden conditional field is absent from the submitted values rather than present and empty.
- A config's defaults and schema are cached against its field names and types, so a rule changed
  without a rename or a retype does not reach them, and duplicate names throw.
- `react-select` and `react-phone-input-2` are reached from the package root barrel, so both have
  to be installed even by an app that uses neither the multiselect nor the phone control.
- Type declarations are not generated yet, so there are no `.d.ts` files in the published package.
- The loading overlay's styling is inline, `z-index: 10` included, so a `.fk-form-loading-overlay`
  rule can add to it but cannot restyle what is already set there.
