import { z } from 'zod'
import {
    LATIN_CHARS,
    CYRILLIC_CHARS,
    LATIN_AND_CYRILLIC,
    DIGITS_ONLY,
    ALPHANUMERIC,
} from '../constants/charset.constants'

export const latinOnly = (message = 'Only Latin characters allowed') =>
    z.string().regex(LATIN_CHARS, message)

export const cyrillicOnly = (message = 'Only Cyrillic characters allowed') =>
    z.string().regex(CYRILLIC_CHARS, message)

export const latinOrCyrillic = (message = 'Only Latin or Cyrillic characters allowed') =>
    z.string().regex(LATIN_AND_CYRILLIC, message)

export const digitsOnly = (message = 'Only digits allowed') =>
    z.string().regex(DIGITS_ONLY, message)

export const alphanumeric = (message = 'Only letters and numbers allowed') =>
    z.string().regex(ALPHANUMERIC, message)
