// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFormFromConfig } from '../../src/config/useFormFromConfig'
import type { FormConfig } from '../../src/config/config.types'

describe('useFormFromConfig', () => {
    it('derives defaults, fields, and a schema from config', () => {
        const config: FormConfig = [
            { name: 'name', type: 'text', validation: ['required'] },
            { name: 'subscribe', type: 'checkbox' },
        ]
        const { result } = renderHook(() => useFormFromConfig(config))

        expect(result.current.fields).toHaveLength(2)
        expect(result.current.defaults).toEqual({ name: '', subscribe: false })
        expect(result.current.schema.safeParse({ name: 'Ada', subscribe: false }).success).toBe(true)
    })

    it('throws on duplicate field names', () => {
        const config: FormConfig = [
            { name: 'email', type: 'email' },
            { name: 'email', type: 'text' },
        ]
        expect(() => renderHook(() => useFormFromConfig(config))).toThrow(/duplicate field name/i)
    })
})
