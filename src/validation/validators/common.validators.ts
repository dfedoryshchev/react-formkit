import { z } from 'zod'
import { getMessages } from '../messages'

export const required = (message = getMessages().required) =>
    z.string().min(1, message).describe('required')

export const requiredNumber = (message = getMessages().required) =>
    z.number({ required_error: message }).describe('required')

export const minLength = (min: number, message?: string) =>
    z.string().min(min, message || getMessages().minLength(min))

export const maxLength = (max: number, message?: string) =>
    z.string().max(max, message || getMessages().maxLength(max))

export const email = (message = getMessages().email) => z.string().email(message)

export const phone = (message = getMessages().phone) =>
    z.string().regex(/^\+?[\d\s\-()]{7,}$/, message)

export const url = (message = getMessages().url) => z.string().url(message)

export const notZero = (message = getMessages().notZero) =>
    z.number().refine((v) => v !== 0, message)

export const matchesRegex = (pattern: RegExp, message = getMessages().matchesRegex) =>
    z.string().regex(pattern, message)
