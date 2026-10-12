// @vitest-environment jsdom
import React from 'react'
import { renderHook } from '@testing-library/react'
import { z, ZodType } from 'zod'
import { useIsFieldRequired } from '../../src/validation/useIsFieldRequired'
import { ValidationSchemaContext } from '../../src/validation/ValidationSchemaContext'

const wrapper = (schema: ZodType | undefined) => {
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

    it('returns false for a string with no minimum', () => {
        const schema = z.object({ name: z.string() })
        const { result } = renderHook(() => useIsFieldRequired('name'), { wrapper: wrapper(schema) })
        expect(result.current).toBe(false)
    })

    it.each([
        ['refined', (s: z.ZodString) => s.refine((v) => v !== 'x')],
        ['transformed', (s: z.ZodString) => s.transform((v) => v.toUpperCase())],
        ['preprocessed', (s: z.ZodString) => z.preprocess((v) => v, s)],
    ])('reads the string under a %s field', (_, wrap) => {
        const schema = z.object({ min: wrap(z.string().min(1)), bare: wrap(z.string()) })
        const { result } = renderHook(
            () => [useIsFieldRequired('min'), useIsFieldRequired('bare')],
            { wrapper: wrapper(schema) },
        )
        expect(result.current).toEqual([true, false])
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

    // Field arrays name a field by its path, so the lookup has to walk one.
    const arraySchema = z.object({
        contacts: z.array(z.object({ email: z.string().min(1), note: z.string().optional() })),
    })

    it('walks into an array element', () => {
        const { result } = renderHook(() => useIsFieldRequired('contacts.0.email'), {
            wrapper: wrapper(arraySchema),
        })
        expect(result.current).toBe(true)
    })

    it('still reads an optional field inside an array as optional', () => {
        const { result } = renderHook(() => useIsFieldRequired('contacts.0.note'), {
            wrapper: wrapper(arraySchema),
        })
        expect(result.current).toBe(false)
    })

    it('does not care which row it is asked about', () => {
        // every element of an array shares one schema, so the index is the
        // form's business and not the schema's - including an index that is
        // past the end, which happens for one render after a row is removed.
        const { result } = renderHook(() => useIsFieldRequired('contacts.99.email'), {
            wrapper: wrapper(arraySchema),
        })
        expect(result.current).toBe(true)
    })

    it('walks a nested object path as well', () => {
        const schema = z.object({ address: z.object({ street: z.string().min(1) }) })
        const { result } = renderHook(() => useIsFieldRequired('address.street'), {
            wrapper: wrapper(schema),
        })
        expect(result.current).toBe(true)
    })

    it('peels an optional array before walking into it', () => {
        const schema = z.object({
            contacts: z.array(z.object({ email: z.string().min(1) })).optional(),
        })
        const { result } = renderHook(() => useIsFieldRequired('contacts.0.email'), {
            wrapper: wrapper(schema),
        })
        expect(result.current).toBe(true)
    })

    it('returns false for a path that leaves the schema', () => {
        const { result } = renderHook(() => useIsFieldRequired('contacts.0.email.nope'), {
            wrapper: wrapper(arraySchema),
        })
        expect(result.current).toBe(false)
    })

    it('returns false for a non-numeric segment where an index belongs', () => {
        const { result } = renderHook(() => useIsFieldRequired('contacts.first.email'), {
            wrapper: wrapper(arraySchema),
        })
        expect(result.current).toBe(false)
    })
})
