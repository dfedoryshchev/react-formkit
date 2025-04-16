import { z } from 'zod'

export const required = (message = 'This field is required') =>
    z.string().min(1, message).describe('required')

export const requiredNumber = (message = 'This field is required') =>
    z.number({ required_error: message }).describe('required')

export const minLength = (min: number, message?: string) =>
    z.string().min(min, message || `Must be at least ${min} characters`)

export const maxLength = (max: number, message?: string) =>
    z.string().max(max, message || `Must be at most ${max} characters`)

export const email = (message = 'Invalid email address') => z.string().email(message)

export const phone = (message = 'Invalid phone number') =>
    z.string().regex(/^\+?[\d\s\-()]{7,}$/, message)

export const url = (message = 'Invalid URL') => z.string().url(message)

export const notZero = (message = 'Must not be zero') =>
    z.number().refine((v) => v !== 0, message)

export const matchesRegex = (pattern: RegExp, message = 'Invalid format') =>
    z.string().regex(pattern, message)
