# AGENTS.md

Working notes for coding agents making changes in this repository.

The README documents how to *use* the library. This file is about how to *change* it: the
commands that have to pass, where a given kind of change belongs, and the handful of rules that
are not visible from the call site and are therefore easy to get wrong.

## Commands

```bash
npm install
npm run dev        # playground at dev/
npm test           # vitest, single run
npm run test:watch
npm run lint       # eslint src
npm run typecheck  # tsc --noEmit
npm run build      # library build
npm run format     # prettier over src
```

**A change is not done until `npm test`, `npm run typecheck` and `npm run lint` all pass.** CI
runs exactly those three, in that order, on Node 20 (`.github/workflows/ci.yml`), so a green
local run and a green CI run mean the same thing. `npm run build` is not in CI; run it anyway
when you touch anything under `src/`, because the library build resolves the `@/` alias
differently from `tsc` and is the only step that would catch a bad import path.

## Layout

```
src/
  form/        BasicForm, Form, submit-button HOCs
  field/       FormField, Field, the field HOC chain, ConditionalField, FormFieldArray
  controls/    Control (the type router) + every concrete input
  validation/  validators, the message map, form-level rules, required detection
  config/      config types, buildSchema, useFormFromConfig, ConfigFields
  styles/      theme.scss (CSS custom properties)
  index.ts     the public API barrel
tests/         mirrors src/ by area
```

Imports inside `src/` use the `@/` alias for `src/` (`tsconfig.json` paths, mirrored in
`vite.config.ts`). Relative imports are fine within a directory.

## The render pipeline

Every field goes down one path, and new work should join it rather than route around it:

```
Form / BasicForm      FormProvider + zodResolver + ValidationSchemaContext
  FormField           useController bridge + useIsFieldRequired
    Field             HOC chain: withRequired, withFieldMessage, withLabel, withControlProps
      Control         type router
        TextInput | SelectInput | SwitchInput | ...
```

`Form` is `BasicForm` plus an automatic loading-aware submit button. Use `BasicForm` when the
consumer supplies their own submit control.

## Where a change belongs

**A new control.** Add the component under the right `controls/` subdirectory (`inputs/`,
`toggles/`, `selects/`, `datetime/`), export it from that subdirectory's `index.ts`, add the
type to `ControlType`, and register it in the `Control` router. A control that is not in the
router is unreachable from `FormField` and from a config.

**A new validator.** Add it to the matching file under `validation/validators/` and export it
from `validation/index.ts`. **Its default message goes in `defaultMessages` in
`validation/messages.ts` and the validator reads it from `getMessages()`. Never inline an
English string in a validator** - that is the one thing the message map exists to prevent, and
an inlined string is unreachable by every override mechanism the library offers.

**A new config rule.** Extend `ValidationDescriptor` in `config/config.types.ts` and handle it
in `applyRule` in `config/buildSchema.ts`. Give it a `message?: string`, and fall back to the
message map when the descriptor does not carry one.

**Anything exported.** Re-export it from the area barrel; `src/index.ts` re-exports the five
area barrels and nothing else.

## Rules that are not visible from the call site

These are the ones to read before touching validation or config.

**Messages resolve when the schema is built, not when the module loads.** Validator factories
are ordinary functions called at schema-build time, outside React rendering. That is why the
active map is a module-level binding in `validation/messages.ts` and not context: by the time
React renders, the strings are already baked into the Zod schema, so a provider can never reach
them. Anything that needs to affect a message has to be active while the schema is built.

**`withMessages` is a synchronous scoped swap, and it must stay synchronous.** It layers
overrides over the current map, runs `build()`, and restores the previous map in a `finally` so
a throw cannot leak into the next form. Making it async would let two forms interleave and take
each other's messages.

**That is why `validationSchema` accepts `ZodSchema | (() => ZodSchema)`.** Only a builder can
run inside the swap. A ready-made schema already carries its strings, so per-form `messages`
cannot affect it - a real limit, stated in the prop comment rather than papered over.

**A parameterised message is a function, not a string.** A translation needs to put the number
somewhere else in the sentence. Overrides may also be templates with named placeholders
(`'Must be at least {min} characters'`) so a JSON bundle, which cannot hold functions, can
supply every entry; `placeholders` in `messages.ts` maps each parameterised key to its argument
names in order. An unknown placeholder is left as written rather than blanked, so a wrong key is
visible instead of silently vanishing. Adding a parameterised message means adding its entry
there too.

**`zodResolver` already parses asynchronously, so an async rule needs nothing from the resolver
setup.** `useFormConfig` builds it with no `mode` option, and that default path calls
`schema.parseAsync`. The config engine is the exception: `buildSchema` validates each `showWhen`
field with a synchronous `safeParse` inside a `superRefine`, and zod throws when an async
refinement is reached during a synchronous parse. That is why `asyncCheck` is for hand-written
schemas only; supporting it in a config means making that refinement async for every config form,
and finding a way for a data-only `ValidationDescriptor` to name a function.

**A debounced validator holds its state in the closure it was built with.** Same reason as the
message map: the factory runs at schema-build time, outside React, so there is no ref or state to
put it in. One `asyncCheck` call is one debounce channel PER FIELD PATH, which makes a stable
schema a correctness requirement rather than an optimisation - a schema rebuilt each render
restarts the window each render and it never elapses.

**Only a change to the value re-arms that window.** The refinement does not see keystrokes, it sees
parses, and under a resolver the parse is the whole schema - so editing any other field runs it
again with a value nobody touched. Treating that as a keystroke starves the check twice over: the
window is pushed out for as long as the neighbouring field is being typed into, and a request
already in flight for the same value is stranded behind the `timer !== undefined` guard in `finish`,
so the answer is discarded and re-requested. `ask` compares against `latest` and joins the existing
wait when the value is unchanged. Anything added there has to keep that comparison ahead of the
re-arm.

**The state of an async check is keyed off the schema instance AND the field path, and it needs
both.** The instance alone is not an address: every doc here tells consumers to hoist the schema,
so one validator routinely sits on two fields or on every row of an array, and one set of
`latest`/`waiting`/`timer` behind two fields lets one field's verdict answer for the other - the
rejected value submits. The path alone is not an address either, since two forms may both have a
`username`. So the `WeakMap` `useIsAsyncValidating` subscribes through is keyed by the schema the
factory returned and hands back a channel per path, while the refinement reads its own path off
`ctx.path`; the hook finds the node with `fieldAt` over `ValidationSchemaContext`, the same context
`useIsFieldRequired` reads. The consequence to keep in mind: zod methods that clone rather than wrap
(`.describe()` builds `new This({ ...this._def })`) return an instance the channel is not attached
to. Wrapping is safe - `unwrapField` in `schema.utils.ts` peels `ZodEffects`, `ZodOptional`,
`ZodNullable` and `ZodDefault` - so a new wrapper type needs a case there or the indicator silently
goes dead.

**React Hook Form's per-field `isValidating` cannot stand in for it.** Measured against RHF 7.71
under `zodResolver`: editing one field marks only that field validating even while a sibling's
remote check is in flight on the same parse, and `handleSubmit` marks every mounted field, remote
check or not. Both follow from the resolver parsing the whole schema at once. RHF also only
maintains the map at all once something subscribes to `formState.isValidating` or
`formState.validatingFields`, which is why the test that pins this reads `formState.validatingFields`
rather than `getFieldState`.

**Required detection is inferred from the schema, not declared.** `useIsFieldRequired` reads the
resolved schema, so it has to unwrap wrappers (`ZodEffects` among them) to find the field. A
change that wraps the schema and forgets the unwrap silently drops the required marker from
every field on the form rather than failing loudly.

**A field name is a PATH, and the lookup walks it.** `fieldAt` in `schema.utils.ts` resolves
`address.street` and `contacts.0.email` as well as `email`, unwrapping each container on the way
down and handing back the field it lands on still wrapped - whether that field is optional is
usually the question being asked, so unwrapping it would answer a different one. An array index
is matched as digits and discarded, because every element of an array shares one schema; that is
also why an index past the end, which happens for one render after a row is removed, still
resolves. The cost of the walk is that a literal field name containing a dot is no longer
findable, which react-hook-form does not allow anyway.

**`useIsAsyncValidating` walks the path, and the path is also what addresses the wait.** Two rows
of one element schema are one identical schema node - verified - so the node alone cannot tell
them apart and asking it for a channel would light every row's indicator at once. The channel is
looked up by schema node *and* field path, which is the same pair `asyncCheck` keys its state on.

**Config conditionals clear; hand-written ones do not, by default.** A `showWhen` field in a
config is validated only while visible and its value is dropped when it hides. The standalone
`ConditionalField` takes `clear` as an opt-in, because a branch that is only collapsed for space
should keep what was typed into it. Do not quietly align the two: they are different defaults on
purpose.

**Configs must be hoisted by the consumer.** An inline array literal re-derives defaults and
schema on every render. The README says so; keep any new config-facing API honest about it
rather than adding memoisation that hides the cost.

## Tests

Vitest with jsdom; `tests/setup.ts` pulls in `@testing-library/jest-dom`. `tests/` mirrors
`src/` by area, and a new test belongs in the existing file for its area when one exists.

**Write the failing test first and check that it fails for the reason you think.** A test
written after the change passes for reasons nobody has verified. When a change could plausibly
break an existing behaviour, pin that behaviour with its own test in the same commit - for
instance the message work pins that an explicit `message` on a descriptor still wins over the
map, since that is exactly what the fallback could have broken.

Prefer behaviour through the public surface over reaching into internals; most of the suite
renders a form and asserts on what a user would see.

## Style

Prettier owns formatting: no semicolons, single quotes, 4-space indent, trailing commas,
100-column width. Run `npm run format` rather than hand-aligning.

Comments explain *why*, and the existing ones are the model: they carry the constraint that
forced the shape, not a restatement of the code. A comment that would go stale the moment
someone edits the line below it is not worth adding.

## Known limitations

The README's "Known limitations" list is the current one; read it before proposing a fix for
something already known and deliberately open. Type declarations are not generated yet, so the
published package ships JavaScript and CSS without `.d.ts` files.
