import { z } from 'zod'
import {
    LATIN_CHARS,
    CYRILLIC_CHARS,
    LATIN_AND_CYRILLIC,
    DIGITS_ONLY,
    ALPHANUMERIC,
} from '../constants/charset.constants'
import { getMessages } from '../messages'

export const latinOnly = (message = getMessages().latinOnly) =>
    z.string().regex(LATIN_CHARS, message)

export const cyrillicOnly = (message = getMessages().cyrillicOnly) =>
    z.string().regex(CYRILLIC_CHARS, message)

export const latinOrCyrillic = (message = getMessages().latinOrCyrillic) =>
    z.string().regex(LATIN_AND_CYRILLIC, message)

export const digitsOnly = (message = getMessages().digitsOnly) =>
    z.string().regex(DIGITS_ONLY, message)

export const alphanumeric = (message = getMessages().alphanumeric) =>
    z.string().regex(ALPHANUMERIC, message)
