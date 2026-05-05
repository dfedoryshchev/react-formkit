import { describe, it, expect } from 'vitest'
import { personName, companyName } from '../../src/validation/validators/name.validators'

describe('personName', () => {
    it('accepts a normal name', () => {
        expect(personName().parse('John Doe')).toBe('John Doe')
    })
    it('rejects too short', () => {
        expect(personName().safeParse('J').success).toBe(false)
    })
    it('rejects digits', () => {
        expect(personName().safeParse('John123').success).toBe(false)
    })
    it('rejects too long', () => {
        expect(personName().safeParse('a'.repeat(31)).success).toBe(false)
    })
})

describe('companyName', () => {
    it('accepts names with numbers and punctuation', () => {
        expect(companyName().parse('Acme Inc. 2')).toBe('Acme Inc. 2')
    })
    it('rejects too short', () => {
        expect(companyName().safeParse('A').success).toBe(false)
    })
    it('rejects too long', () => {
        expect(companyName().safeParse('a'.repeat(41)).success).toBe(false)
    })
})
