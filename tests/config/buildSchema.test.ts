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

describe('buildSchema - conditional fields', () => {
    const config: FormConfig = [
        { name: 'hasAddress', type: 'checkbox' },
        {
            name: 'street',
            type: 'text',
            validation: ['required', { rule: 'minLength', value: 3 }],
            showWhen: { field: 'hasAddress', is: true },
        },
    ]

    it('does not enforce a hidden conditional field, so it cannot block submit invisibly', () => {
        const schema = buildSchema(config)
        expect(schema.safeParse({ hasAddress: false, street: '' }).success).toBe(true)
        expect(schema.safeParse({ hasAddress: false }).success).toBe(true)
    })

    it('enforces the conditional field once its condition is met', () => {
        const schema = buildSchema(config)
        expect(schema.safeParse({ hasAddress: true, street: '' }).success).toBe(false)
        expect(schema.safeParse({ hasAddress: true, street: 'Elm Street' }).success).toBe(true)
    })

    it('applies the other rules only while the field is visible', () => {
        const schema = buildSchema(config)
        expect(schema.safeParse({ hasAddress: true, street: 'ab' }).success).toBe(false)
        expect(schema.safeParse({ hasAddress: false, street: 'ab' }).success).toBe(true)
    })

    it('reports the issue on the conditional field own path', () => {
        const schema = buildSchema(config)
        const result = schema.safeParse({ hasAddress: true, street: '' })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].path).toEqual(['street'])
        }
    })

    it('honours isNot and test predicates too', () => {
        const isNotSchema = buildSchema([
            { name: 'plan', type: 'select' },
            { name: 'seats', type: 'text', validation: ['required'], showWhen: { field: 'plan', isNot: 'solo' } },
        ])
        expect(isNotSchema.safeParse({ plan: 'solo', seats: '' }).success).toBe(true)
        expect(isNotSchema.safeParse({ plan: 'team', seats: '' }).success).toBe(false)

        const testSchema = buildSchema([
            { name: 'count', type: 'numeric' },
            {
                name: 'reason',
                type: 'text',
                validation: ['required'],
                showWhen: { field: 'count', test: (v) => typeof v === 'number' && v > 5 },
            },
        ])
        expect(testSchema.safeParse({ count: 1, reason: '' }).success).toBe(true)
        expect(testSchema.safeParse({ count: 9, reason: '' }).success).toBe(false)
    })
})
