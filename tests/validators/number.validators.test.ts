import { describe, it, expect } from 'vitest'
import {
    minValue,
    maxValue,
    between,
    positive,
    nonNegative,
    integer,
    percentage,
} from '../../src/validation/validators/number.validators'

describe('minValue', () => {
    it('rejects below min', () => {
        expect(minValue(5).safeParse(4).success).toBe(false)
    })
    it('accepts at min', () => {
        expect(minValue(5).parse(5)).toBe(5)
    })
})

describe('maxValue', () => {
    it('rejects above max', () => {
        expect(maxValue(5).safeParse(6).success).toBe(false)
    })
    it('accepts at max', () => {
        expect(maxValue(5).parse(5)).toBe(5)
    })
})

describe('between', () => {
    it('rejects below min', () => {
        expect(between(1, 10).safeParse(0).success).toBe(false)
    })
    it('rejects above max', () => {
        expect(between(1, 10).safeParse(11).success).toBe(false)
    })
    it('accepts within range', () => {
        expect(between(1, 10).parse(5)).toBe(5)
    })
    it('accepts boundaries', () => {
        expect(between(1, 10).parse(1)).toBe(1)
        expect(between(1, 10).parse(10)).toBe(10)
    })
})

describe('positive', () => {
    it('rejects zero', () => {
        expect(positive().safeParse(0).success).toBe(false)
    })
    it('rejects negative', () => {
        expect(positive().safeParse(-1).success).toBe(false)
    })
    it('accepts positive', () => {
        expect(positive().parse(3)).toBe(3)
    })
})

describe('nonNegative', () => {
    it('accepts zero', () => {
        expect(nonNegative().parse(0)).toBe(0)
    })
    it('rejects negative', () => {
        expect(nonNegative().safeParse(-1).success).toBe(false)
    })
})

describe('integer', () => {
    it('rejects a float', () => {
        expect(integer().safeParse(1.5).success).toBe(false)
    })
    it('accepts an integer', () => {
        expect(integer().parse(3)).toBe(3)
    })
})

describe('percentage', () => {
    it('rejects above 100', () => {
        expect(percentage().safeParse(101).success).toBe(false)
    })
    it('accepts within 0-100', () => {
        expect(percentage().parse(50)).toBe(50)
    })
})
