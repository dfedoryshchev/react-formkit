import { describe, it, expect, afterEach } from 'vitest'
import {
    defaultMessages,
    getMessages,
    interpolate,
    setMessages,
    withMessages,
} from '../../src/validation/messages'
import {
    required,
    email,
    minLength,
    maxLength,
} from '../../src/validation/validators/common.validators'
import { integer, between } from '../../src/validation/validators/number.validators'
import { digitsOnly } from '../../src/validation/validators/charset.validators'
import { personName } from '../../src/validation/validators/name.validators'

const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
    result.success ? undefined : result.error?.issues[0].message

afterEach(() => {
    setMessages()
})

describe('defaultMessages', () => {
    it('is what getMessages returns before any override', () => {
        expect(getMessages()).toBe(defaultMessages)
    })

    it('interpolates the bound value in parameterised messages', () => {
        expect(defaultMessages.minLength(3)).toBe('Must be at least 3 characters')
        expect(defaultMessages.between(1, 10)).toBe('Must be between 1 and 10')
    })
})

// The point of the extraction is that nothing user-visible moved. These pin
// the shipped wording so a future edit to the map is a deliberate choice.
describe('defaults are unchanged by the extraction', () => {
    it('keeps the common validator messages', () => {
        expect(firstError(required().safeParse(''))).toBe('This field is required')
        expect(firstError(email().safeParse('nope'))).toBe('Invalid email address')
        expect(firstError(minLength(3).safeParse('ab'))).toBe('Must be at least 3 characters')
    })

    it('keeps the number and charset messages', () => {
        expect(firstError(integer().safeParse(1.5))).toBe('Must be a whole number')
        expect(firstError(digitsOnly().safeParse('abc'))).toBe('Only digits allowed')
    })

    it('keeps the name messages', () => {
        expect(firstError(personName().safeParse('R2D2'))).toBe('Enter a valid name')
    })
})

describe('setMessages', () => {
    it('overrides one entry and leaves the rest alone', () => {
        setMessages({ email: 'Adresse e-mail invalide' })
        expect(firstError(email().safeParse('nope'))).toBe('Adresse e-mail invalide')
        expect(firstError(required().safeParse(''))).toBe('This field is required')
    })

    it('overrides a parameterised entry, interpolation included', () => {
        setMessages({ minLength: (min: number) => `${min} caracteres minimum` })
        expect(firstError(minLength(4).safeParse('ab'))).toBe('4 caracteres minimum')
    })

    it('restores the defaults when called with no argument', () => {
        setMessages({ email: 'nope' })
        setMessages()
        expect(firstError(email().safeParse('bad'))).toBe('Invalid email address')
    })

    it('does not mutate defaultMessages', () => {
        setMessages({ required: 'Champ obligatoire' })
        expect(defaultMessages.required).toBe('This field is required')
    })

    it('reaches a validator that passes an explicit message', () => {
        setMessages({ email: 'from the map' })
        expect(firstError(email('explicit').safeParse('nope'))).toBe('explicit')
    })
})

describe('interpolate', () => {
    it('substitutes named placeholders', () => {
        expect(interpolate('at least {min} of {max}', { min: 2, max: 8 })).toBe('at least 2 of 8')
    })

    it('leaves an unknown placeholder in place', () => {
        expect(interpolate('{min} to {nope}', { min: 1 })).toBe('1 to {nope}')
    })

    it('repeats a placeholder used twice', () => {
        expect(interpolate('{min}-{min}', { min: 5 })).toBe('5-5')
    })
})

// A translation bundle is JSON, so it cannot carry functions. A template string
// has to work everywhere a parameterised default does.
describe('template overrides', () => {
    it('accepts a template for a parameterised message', () => {
        setMessages({ minLength: 'Minimum {min} caracteres' })
        expect(firstError(minLength(4).safeParse('ab'))).toBe('Minimum 4 caracteres')
    })

    it('fills both values, in any order', () => {
        setMessages({ between: 'Entre {max} et {min}' })
        expect(getMessages().between(1, 10)).toBe('Entre 10 et 1')
    })

    it('still accepts a function override', () => {
        setMessages({ maxLength: (max: number) => `${max} max` })
        expect(firstError(maxLength(2).safeParse('abc'))).toBe('2 max')
    })
})

describe('withMessages', () => {
    it('applies overrides to validators built inside the callback', () => {
        const schema = withMessages({ required: 'Champ obligatoire' }, () => required())
        expect(firstError(schema.safeParse(''))).toBe('Champ obligatoire')
    })

    it('restores the previous map afterwards', () => {
        withMessages({ required: 'Champ obligatoire' }, () => required())
        expect(firstError(required().safeParse(''))).toBe('This field is required')
    })

    it('leaves messages built before the callback untouched', () => {
        const before = required()
        withMessages({ required: 'Champ obligatoire' }, () => required())
        expect(firstError(before.safeParse(''))).toBe('This field is required')
    })

    it('layers over the app-wide map instead of resetting it', () => {
        setMessages({ email: 'Adresse invalide', required: 'Obligatoire' })
        withMessages({ required: 'Vraiment obligatoire' }, () => {
            expect(firstError(required().safeParse(''))).toBe('Vraiment obligatoire')
            expect(firstError(email().safeParse('nope'))).toBe('Adresse invalide')
        })
    })

    it('restores the map even when the callback throws', () => {
        expect(() =>
            withMessages({ required: 'Champ obligatoire' }, () => {
                throw new Error('build failed')
            }),
        ).toThrow('build failed')
        expect(getMessages().required).toBe('This field is required')
    })

    it('returns whatever the callback builds', () => {
        expect(withMessages(undefined, () => 42)).toBe(42)
    })
})
