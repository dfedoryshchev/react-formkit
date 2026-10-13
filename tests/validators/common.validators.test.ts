import { describe, it, expect } from 'vitest'
import {
    required,
    requiredNumber,
    minLength,
    maxLength,
    email,
    phone,
    url,
    notZero,
    matchesRegex,
} from '../../src/validation/validators/common.validators'
import { defaultMessages, setMessages } from '../../src/validation/messages'

describe('required', () => {
    it('rejects empty string', () => {
        expect(required().safeParse('').success).toBe(false)
    })
    it('accepts non-empty string', () => {
        expect(required().parse('hello')).toBe('hello')
    })
    it('carries the "required" description', () => {
        expect(required().description).toBe('required')
    })

    const firstMessage = (schema: ReturnType<typeof required>, value: unknown) => {
        const result = schema.safeParse(value)
        return result.success ? undefined : result.error.issues[0].message
    }
    it('shows its message for a missing value', () => {
        expect(firstMessage(required('Enter a name'), undefined)).toBe('Enter a name')
    })
    it('shows the message map text for a missing value', () => {
        expect(firstMessage(required(), undefined)).toBe(defaultMessages.required)
    })
    it('shows an overridden map text for a missing value', () => {
        setMessages({ required: 'Champ obligatoire' })
        try {
            expect(firstMessage(required(), undefined)).toBe('Champ obligatoire')
        } finally {
            setMessages()
        }
    })
    it('keeps the type message for a value of the wrong type', () => {
        expect(firstMessage(required('Enter a name'), 12)).not.toBe('Enter a name')
    })
})

describe('requiredNumber', () => {
    const firstMessage = (value: unknown) => {
        const result = requiredNumber('Enter a number').safeParse(value)
        return result.success ? undefined : result.error.issues[0].message
    }
    it('shows its message for a missing value', () => {
        expect(firstMessage(undefined)).toBe('Enter a number')
    })
    it('keeps the type message for a value of the wrong type', () => {
        expect(firstMessage('12')).not.toBe('Enter a number')
    })
    it('accepts a number', () => {
        expect(requiredNumber().parse(12)).toBe(12)
    })
})

describe('minLength', () => {
    it('rejects strings shorter than min', () => {
        expect(minLength(3).safeParse('ab').success).toBe(false)
    })
    it('accepts strings at min length', () => {
        expect(minLength(3).parse('abc')).toBe('abc')
    })
})

describe('maxLength', () => {
    it('rejects strings longer than max', () => {
        expect(maxLength(3).safeParse('abcd').success).toBe(false)
    })
    it('accepts strings at max length', () => {
        expect(maxLength(3).parse('abc')).toBe('abc')
    })
})

describe('email', () => {
    it('rejects invalid email', () => {
        expect(email().safeParse('notanemail').success).toBe(false)
    })
    it('accepts valid email', () => {
        expect(email().parse('test@example.com')).toBe('test@example.com')
    })
})

describe('url', () => {
    it('rejects invalid url', () => {
        expect(url().safeParse('not-a-url').success).toBe(false)
    })
    it('accepts valid url', () => {
        expect(url().parse('https://example.com')).toBe('https://example.com')
    })
})

describe('phone', () => {
    it('rejects letters / too short', () => {
        expect(phone().safeParse('abc').success).toBe(false)
    })
    it('accepts a plausible number', () => {
        expect(phone().parse('+44 20 7946 0958')).toBe('+44 20 7946 0958')
    })
})

describe('notZero', () => {
    it('rejects zero', () => {
        expect(notZero().safeParse(0).success).toBe(false)
    })
    it('accepts non-zero', () => {
        expect(notZero().parse(5)).toBe(5)
    })
})

describe('matchesRegex', () => {
    it('rejects non-matching input', () => {
        expect(matchesRegex(/^[a-z]+$/).safeParse('ABC').success).toBe(false)
    })
    it('accepts matching input', () => {
        expect(matchesRegex(/^[a-z]+$/).parse('abc')).toBe('abc')
    })
})
