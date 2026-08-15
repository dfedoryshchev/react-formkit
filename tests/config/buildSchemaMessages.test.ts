import { describe, it, expect, afterEach } from 'vitest'
import { buildSchema } from '../../src/config/buildSchema'
import { defaultMessages, setMessages } from '../../src/validation/messages'
import type { FormConfig } from '../../src/config/config.types'

const firstError = (schema: ReturnType<typeof buildSchema>, value: unknown) => {
    const result = schema.safeParse(value)
    return result.success ? undefined : result.error.issues[0].message
}

afterEach(() => {
    setMessages()
})

describe('buildSchema message defaults', () => {
    it('uses the shared required message, not its own literal', () => {
        const schema = buildSchema([{ name: 'name', type: 'text', validation: ['required'] }])
        expect(firstError(schema, { name: '' })).toBe(defaultMessages.required)
    })

    it('uses the shared default when a rule carries no message', () => {
        const config: FormConfig = [
            { name: 'name', type: 'text', validation: [{ rule: 'minLength', value: 2 }] },
        ]
        expect(firstError(buildSchema(config), { name: 'A' })).toBe(defaultMessages.minLength(2))
    })

    it('uses the shared default for each rule the config engine supports', () => {
        const cases: { config: FormConfig; value: unknown; expected: string }[] = [
            {
                config: [{ name: 'v', type: 'text', validation: [{ rule: 'maxLength', value: 3 }] }],
                value: { v: 'abcd' },
                expected: defaultMessages.maxLength(3),
            },
            {
                config: [{ name: 'v', type: 'text', validation: [{ rule: 'email' }] }],
                value: { v: 'nope' },
                expected: defaultMessages.email,
            },
            {
                config: [{ name: 'v', type: 'numeric', validation: [{ rule: 'min', value: 18 }] }],
                value: { v: 10 },
                expected: defaultMessages.minValue(18),
            },
            {
                config: [{ name: 'v', type: 'numeric', validation: [{ rule: 'max', value: 65 }] }],
                value: { v: 90 },
                expected: defaultMessages.maxValue(65),
            },
            {
                config: [{ name: 'v', type: 'text', validation: [{ rule: 'pattern', value: /^\d+$/ }] }],
                value: { v: 'abc' },
                expected: defaultMessages.matchesRegex,
            },
        ]
        for (const { config, value, expected } of cases) {
            expect(firstError(buildSchema(config), value)).toBe(expected)
        }
    })

    it('a message on the rule still wins over the default', () => {
        const config: FormConfig = [
            { name: 'name', type: 'text', validation: [{ rule: 'minLength', value: 2, message: 'Too short' }] },
        ]
        expect(firstError(buildSchema(config), { name: 'A' })).toBe('Too short')
    })

    it('picks up an app-wide override, so config forms translate too', () => {
        setMessages({ required: 'Champ obligatoire', minLength: 'Au moins {min} caracteres' })
        const config: FormConfig = [
            { name: 'a', type: 'text', validation: ['required'] },
            { name: 'b', type: 'text', validation: [{ rule: 'minLength', value: 4 }] },
        ]
        const schema = buildSchema(config)
        expect(firstError(schema, { a: '', b: 'xxxx' })).toBe('Champ obligatoire')
        expect(firstError(schema, { a: 'ok', b: 'x' })).toBe('Au moins 4 caracteres')
    })

    it('reads the map when the schema is built, not when the module loaded', () => {
        const config: FormConfig = [{ name: 'name', type: 'text', validation: ['required'] }]
        const before = buildSchema(config)
        setMessages({ required: 'Nope' })
        const after = buildSchema(config)
        expect(firstError(after, { name: '' })).toBe('Nope')
        // the schema built earlier keeps the message it was built with
        expect(firstError(before, { name: '' })).toBe(defaultMessages.required)
    })
})
