// Standard length tiers for field constraints. Use e.g. LENGTHS.M for a
// 256-char text field.
export const LENGTHS = {
    XXS: 32,
    XS: 64,
    S: 128,
    M: 256,
    L: 512,
    XL: 2048,
    XXL: 4096,
    XXXL: 8192,
} as const

export const MIN_NAME = 2
export const MAX_PERSON_NAME = 30
export const MAX_COMPANY_NAME = 40
