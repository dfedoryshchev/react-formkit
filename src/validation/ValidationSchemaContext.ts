import { createContext, useContext } from 'react'
import { ZodSchema } from 'zod'

export const ValidationSchemaContext = createContext<ZodSchema | undefined>(undefined)

export const useValidationSchema = () => {
    return useContext(ValidationSchemaContext)
}
