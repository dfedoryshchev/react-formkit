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
}

export type MessageMap = typeof defaultMessages

// The active map. Kept as a module-level binding so the validator factories -
// which are called at schema-build time, outside React - can reach it.
// Per-form overrides via context land next.
let messages: MessageMap = defaultMessages

export const getMessages = (): MessageMap => messages

// Merge a partial override over the defaults. Pass no argument to restore.
export const setMessages = (overrides?: Partial<MessageMap>): MessageMap => {
    messages = overrides ? { ...defaultMessages, ...overrides } : defaultMessages
    return messages
}
