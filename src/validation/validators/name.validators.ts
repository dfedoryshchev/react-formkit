import { z } from 'zod'
import { MIN_NAME, MAX_PERSON_NAME, MAX_COMPANY_NAME } from '../constants/length.constants'
import { LATIN_CHARS } from '../constants/charset.constants'

// Person name: Latin letters, spaces, hyphens and apostrophes only, length
// bounded. Intentionally strict (no accented characters yet); consumers can
// swap in their own charset rule.
export const personName = (message = 'Enter a valid name') =>
    z
        .string()
        .min(MIN_NAME, `Must be at least ${MIN_NAME} characters`)
        .max(MAX_PERSON_NAME, `Must be at most ${MAX_PERSON_NAME} characters`)
        .regex(LATIN_CHARS, message)

// Company name: any characters within length bounds (numbers, punctuation ok).
export const companyName = (message = `Must be at most ${MAX_COMPANY_NAME} characters`) =>
    z.string().min(MIN_NAME, `Must be at least ${MIN_NAME} characters`).max(MAX_COMPANY_NAME, message)
