import { describe, it, expect, afterEach } from 'vitest'
import { defaultMessages, getMessages, setMessages } from '../../src/validation/messages'
import { required, email, minLength } from '../../src/validation/validators/common.validators'
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
