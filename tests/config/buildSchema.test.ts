import { describe, it, expect } from 'vitest'
import { buildSchema } from '../../src/config/buildSchema'
import type { FormConfig } from '../../src/config/config.types'

describe('buildSchema', () => {
    it('enforces a required string field as non-empty', () => {
        const schema = buildSchema([{ name: 'name', type: 'text', validation: ['required'] }])
        expect(schema.safeParse({ name: '' }).success).toBe(false)
        expect(schema.safeParse({ name: 'Ada' }).success).toBe(true)
    })

    it('keeps other required-string rules (minLength) intact', () => {
        const schema = buildSchema([
            { name: 'name', type: 'text', validation: ['required', { rule: 'minLength', value: 2 }] },
        ])
        expect(schema.safeParse({ name: 'A' }).success).toBe(false)
        expect(schema.safeParse({ name: 'Ada' }).success).toBe(true)
    })

    it('makes non-required fields optional so empty values pass', () => {
        const config: FormConfig = [
            { name: 'age', type: 'numeric', validation: [{ rule: 'min', value: 18 }] },
            { name: 'role', type: 'select' },
        ]
        const schema = buildSchema(config)
        // age empty (undefined) and role empty (null) must not fail
        expect(schema.safeParse({ age: undefined, role: null }).success).toBe(true)
    })

    it('still applies a non-required field rule when a value is present', () => {
        const schema = buildSchema([{ name: 'age', type: 'numeric', validation: [{ rule: 'min', value: 18 }] }])
        expect(schema.safeParse({ age: 10 }).success).toBe(false)
        expect(schema.safeParse({ age: 21 }).success).toBe(true)
    })
})
