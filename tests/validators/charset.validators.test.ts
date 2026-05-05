import { describe, it, expect } from 'vitest'
import {
    latinOnly,
    cyrillicOnly,
    latinOrCyrillic,
    digitsOnly,
    alphanumeric,
} from '../../src/validation/validators/charset.validators'

describe('latinOnly', () => {
    it('accepts latin letters, spaces, hyphen and apostrophe', () => {
        expect(latinOnly().parse("O'Brien-Smith")).toBe("O'Brien-Smith")
    })
    it('rejects digits', () => {
        expect(latinOnly().safeParse('John123').success).toBe(false)
    })
    it('rejects cyrillic', () => {
        expect(latinOnly().safeParse('Иван').success).toBe(false)
    })
})

describe('cyrillicOnly', () => {
    it('accepts cyrillic', () => {
        expect(cyrillicOnly().parse('Иван')).toBe('Иван')
    })
    it('rejects latin', () => {
        expect(cyrillicOnly().safeParse('John').success).toBe(false)
    })
})

describe('latinOrCyrillic', () => {
    it('accepts latin', () => {
        expect(latinOrCyrillic().parse('John')).toBe('John')
    })
    it('accepts cyrillic', () => {
        expect(latinOrCyrillic().parse('Иван')).toBe('Иван')
    })
})

describe('digitsOnly', () => {
    it('accepts digits', () => {
        expect(digitsOnly().parse('12345')).toBe('12345')
    })
    it('rejects non-digits', () => {
        expect(digitsOnly().safeParse('12a').success).toBe(false)
    })
})

describe('alphanumeric', () => {
    it('accepts letters and numbers', () => {
        expect(alphanumeric().parse('abc123')).toBe('abc123')
    })
    it('rejects spaces', () => {
        expect(alphanumeric().safeParse('abc 123').success).toBe(false)
    })
    it('rejects punctuation', () => {
        expect(alphanumeric().safeParse('abc!').success).toBe(false)
    })
})
