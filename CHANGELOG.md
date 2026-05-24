# Changelog

All notable changes to this project are documented in this file.

## Unreleased

### Added
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
- Cross-field validators re-validate on submit only
- MultiSelect value mapping uses a serialize-compare workaround
