import { describe, it, expect } from 'vitest'
import {
    required,
    minLength,
    maxLength,
    email,
    phone,
    url,
    notZero,
    matchesRegex,
} from '../../src/validation/validators/common.validators'

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
