import { createContext, useContext } from 'react'
import { ZodType } from 'zod'

export const ValidationSchemaContext = createContext<ZodType | undefined>(undefined)

export const useValidationSchema = () => {
    return useContext(ValidationSchemaContext)
}
