import { z } from 'zod'
import { getMessages } from '../messages'

export const minValue = (min: number, message?: string) =>
    z.number().min(min, message || getMessages().minValue(min))

export const maxValue = (max: number, message?: string) =>
    z.number().max(max, message || getMessages().maxValue(max))

export const between = (min: number, max: number, message?: string) =>
    z
        .number()
        .min(min)
        .max(max)
        .describe(message || getMessages().between(min, max))

export const positive = (message = getMessages().positive) => z.number().positive(message)

export const nonNegative = (message = getMessages().nonNegative) => z.number().nonnegative(message)

export const integer = (message = getMessages().integer) => z.number().int(message)

export const percentage = (message = getMessages().percentage) =>
    z.number().min(0).max(100).describe(message)
