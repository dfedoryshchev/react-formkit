// Every validation message the built-in validators produce, in one place.
// Validators read their defaults from here instead of inlining English
// strings, so a consumer can swap the whole map (or one entry) without
// forking the validators.
//
// Parameterised messages are functions - the bound value is interpolated at
// call time, not baked into the string, which is what lets a translation
// reorder it.

export const defaultMessages = {
    // common
    required: 'This field is required',
    minLength: (min: number) => `Must be at least ${min} characters`,
    maxLength: (max: number) => `Must be at most ${max} characters`,
    email: 'Invalid email address',
    phone: 'Invalid phone number',
    url: 'Invalid URL',
    notZero: 'Must not be zero',
    matchesRegex: 'Invalid format',

    // number
    minValue: (min: number) => `Must be at least ${min}`,
    maxValue: (max: number) => `Must be at most ${max}`,
    between: (min: number, max: number) => `Must be between ${min} and ${max}`,
    positive: 'Must be positive',
    nonNegative: 'Must be zero or greater',
    integer: 'Must be a whole number',
    percentage: 'Must be between 0 and 100',

    // charset
    latinOnly: 'Only Latin characters allowed',
    cyrillicOnly: 'Only Cyrillic characters allowed',
    latinOrCyrillic: 'Only Latin or Cyrillic characters allowed',
    digitsOnly: 'Only digits allowed',
    alphanumeric: 'Only letters and numbers allowed',

    // name
    personName: 'Enter a valid name',

    // async
    asyncCheck: 'This value is not available',
}

export type MessageMap = typeof defaultMessages

// An override for one message. A plain message takes a string; a parameterised
// one takes either the same function or a template carrying named placeholders
// (`'Must be at least {min} characters'`), so a JSON translation bundle - which
// cannot hold functions - can supply every entry.
export type MessageOverrides = {
    [K in keyof MessageMap]?: MessageMap[K] extends (...args: never[]) => string
        ? MessageMap[K] | string
        : string
}

// The placeholder names a template may use, per parameterised message, listed
// in the order the validator passes the values.
const placeholders: Record<string, readonly string[]> = {
    minLength: ['min'],
    maxLength: ['max'],
    minValue: ['min'],
    maxValue: ['max'],
    between: ['min', 'max'],
}

// Substitute `{name}` from params. An unknown placeholder is left as written
// rather than blanked, so a wrong key shows up instead of vanishing.
export const interpolate = (template: string, params: Record<string, unknown>): string =>
    template.replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match))

const toMessage = (key: string, override: string | ((...args: never[]) => string)) => {
    if (typeof override === 'function') return override
    const names = placeholders[key]
    if (!names) return override
    return (...args: unknown[]) =>
        interpolate(override, Object.fromEntries(names.map((name, index) => [name, args[index]])))
}

// Layer overrides on top of a base map, turning template strings into the
// interpolating functions the validators expect.
export const resolveMessages = (
    overrides?: MessageOverrides,
    base: MessageMap = defaultMessages,
): MessageMap => {
    if (!overrides) return base
    const resolved: Record<string, unknown> = { ...base }
    for (const [key, override] of Object.entries(overrides)) {
        if (override === undefined) continue
        resolved[key] = toMessage(key, override)
    }
    return resolved as MessageMap
}

// The active map. Kept as a module-level binding so the validator factories -
// which are called at schema-build time, outside React - can reach it.
let messages: MessageMap = defaultMessages

export const getMessages = (): MessageMap => messages

// Set the app-wide map. Pass no argument to restore the defaults.
export const setMessages = (overrides?: MessageOverrides): MessageMap => {
    messages = resolveMessages(overrides)
    return messages
}

// Per-form overrides. Validators are ordinary functions called while the schema
// is built, outside rendering, so React context alone can never reach them: the
// map has to be active at build time. `build` runs synchronously with
// `overrides` layered over the current map, and the previous map is restored
// before it returns, so nothing leaks to the next form.
export const withMessages = <T>(overrides: MessageOverrides | undefined, build: () => T): T => {
    const previous = messages
    messages = resolveMessages(overrides, previous)
    try {
        return build()
    } finally {
        messages = previous
    }
}
