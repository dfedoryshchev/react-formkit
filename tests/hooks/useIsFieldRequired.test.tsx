// @vitest-environment jsdom
import React from 'react'
import { renderHook } from '@testing-library/react'
import { z, ZodSchema } from 'zod'
import { useIsFieldRequired } from '../../src/validation/useIsFieldRequired'
import { ValidationSchemaContext } from '../../src/validation/ValidationSchemaContext'

const wrapper = (schema: ZodSchema | undefined) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <ValidationSchemaContext.Provider value={schema}>{children}</ValidationSchemaContext.Provider>
    )
    return Wrapper
}

describe('useIsFieldRequired', () => {
    it('returns true for a required (min 1) field', () => {
        const schema = z.object({ name: z.string().min(1) })
        const { result } = renderHook(() => useIsFieldRequired('name'), { wrapper: wrapper(schema) })
        expect(result.current).toBe(true)
    })

    it('returns false for an optional field', () => {
        const schema = z.object({ notes: z.string().optional() })
        const { result } = renderHook(() => useIsFieldRequired('notes'), { wrapper: wrapper(schema) })
        expect(result.current).toBe(false)
    })

    it('returns false when no schema is provided', () => {
        const { result } = renderHook(() => useIsFieldRequired('name'), { wrapper: wrapper(undefined) })
        expect(result.current).toBe(false)
    })

    it('returns false for an unknown field', () => {
        const schema = z.object({ name: z.string().min(1) })
        const { result } = renderHook(() => useIsFieldRequired('missing'), { wrapper: wrapper(schema) })
        expect(result.current).toBe(false)
    })
})
