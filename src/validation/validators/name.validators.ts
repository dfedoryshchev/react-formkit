import { z } from 'zod'
import { MIN_NAME, MAX_PERSON_NAME, MAX_COMPANY_NAME } from '../constants/length.constants'
import { LATIN_CHARS } from '../constants/charset.constants'
import { getMessages } from '../messages'

// Person name: Latin letters, spaces, hyphens and apostrophes only, length
// bounded. Intentionally strict (no accented characters yet); consumers can
// swap in their own charset rule.
export const personName = (message = getMessages().personName) =>
    z
        .string()
        .min(MIN_NAME, getMessages().minLength(MIN_NAME))
        .max(MAX_PERSON_NAME, getMessages().maxLength(MAX_PERSON_NAME))
        .regex(LATIN_CHARS, message)

// Company name: any characters within length bounds (numbers, punctuation ok).
export const companyName = (message = getMessages().maxLength(MAX_COMPANY_NAME)) =>
    z.string().min(MIN_NAME, getMessages().minLength(MIN_NAME)).max(MAX_COMPANY_NAME, message)
