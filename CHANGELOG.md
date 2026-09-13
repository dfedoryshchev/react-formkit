# Changelog

All notable changes to this project are documented in this file.

## 0.2.2 - 2026-09-13

### Added
- i18n: validator messages moved into a configurable map (`setMessages`), with per-form overrides and interpolation for parameterised messages
- Config: conditional fields via `showWhen`, and a `ConditionalField` wrapper for hand-written forms; a hidden field drops its value and is skipped by validation
- Validation: debounced async validators (`asyncCheck`) with a per-field pending indicator (`useIsAsyncValidating`)
- Fields: `FormFieldArray` with `useFieldArray` integration, plus add / remove / reorder row controls
- `Form` / `BasicForm`: submission outcome - `onSuccess` callback and `successContent`; the loading overlay now traps focus

### Fixed
- i18n: config-driven forms now read the message map too; a missing key no longer falls through to zod's own wording or a hardcoded default
- Async validation: an unchanged value re-arms the debounce window instead of being dropped; pending state is now tracked per field rather than per schema instance
- Peer dependencies: `react`, `react-dom`, `react-hook-form`, `@hookform/resolvers` and `zod` moved out of `dependencies` to stop a consumer resolving a second copy of any of them

## 0.2.1 - 2026-07-12

### Added
- Controls: `onFocus` and `autoFocus` passthrough
- Controls: consistent `className` and `readOnly` styling
- `NumericInput`: `step` / `min` / `max` passthrough

### Fixed
- Cross-field validators now re-validate on change, not only on submit
- `MultiAutocomplete`: keep the pending typed value on submit
- Tightened `ControlProps` for date / time / url inputs

## 0.2.0 - 2026-06-12

### Added
- Config-driven forms engine: `useFormFromConfig`, `ConfigFields`, `buildSchema`, and `FieldConfig` / `FormConfig` types
- `Form` component with a built-in loading-aware submit button (`withSubmitButton`, `ButtonWithFormLoader`)
- Loading overlay and reset-on-submit options on `BasicForm`
- Controls: `SwitchInput`, `PasswordInput`, `MultiSelectInput`, `AutocompleteInput`, `MultiAutocompleteInput`, `PhoneInput`
- `CheckboxGroup` routed in the Control router; `withWrappingLabel` applied for checkbox and switch
- Cross-field validation via `useFormLevelValidators`
- Name validators and length constants
- Accessibility: `aria-required` / `aria-invalid` / `aria-describedby`, input ids and label `htmlFor`
- CSS custom properties for theming
- Vitest suite (validators, hooks, Control router) and a GitHub Actions CI workflow
- Library build (Vite library mode) with package `exports`

### Changed
- Tightened `ControlProps` for text / numeric / select
- Renamed control CSS classes (dropped the `-restarted` suffix)

### Known limitations
- Type declarations are not generated yet
- Config: no nested / grouped fields, and `required` is not enforced across all field types
- Cross-field validators re-validate on submit only
- MultiSelect value mapping uses a serialize-compare workaround
