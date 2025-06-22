import { z } from 'zod'

export const minValue = (min: number, message?: string) =>
    z.number().min(min, message || `Must be at least ${min}`)

export const maxValue = (max: number, message?: string) =>
    z.number().max(max, message || `Must be at most ${max}`)

export const between = (min: number, max: number, message?: string) =>
    z.number().min(min).max(max).describe(message || `Must be between ${min} and ${max}`)

export const positive = (message = 'Must be positive') =>
    z.number().positive(message)

export const nonNegative = (message = 'Must be zero or greater') =>
    z.number().nonnegative(message)

export const integer = (message = 'Must be a whole number') =>
    z.number().int(message)

export const percentage = (message = 'Must be between 0 and 100') =>
    z.number().min(0).max(100).describe(message)
