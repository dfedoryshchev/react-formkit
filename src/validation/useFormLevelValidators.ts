import { useMemo } from 'react'
import { ZodSchema, ZodTypeAny } from 'zod'

export interface FormLevelValidator {
    refinement: (data: any) => boolean
    message: string
    path?: (string | number)[]
}

// Applies cross-field zod refinements on top of a field-level schema. Each
// refinement receives the whole form object; `path` maps the error to a field.
//
// Because RHF only re-validates the field being edited, changing another field
// the refinement reads would leave the `path` error stale. useFormConfig closes
// that gap by re-triggering the dependent paths on change (after first submit).
export const useFormLevelValidators = (
    validationSchema?: ZodSchema,
    formLevelValidators?: FormLevelValidator[],
): ZodSchema | undefined => {
    return useMemo(() => {
        if (!validationSchema || !formLevelValidators?.length) {
            return validationSchema
        }
        let schema: ZodTypeAny = validationSchema
        for (const validator of formLevelValidators) {
            schema = schema.refine(validator.refinement, {
                message: validator.message,
                path: validator.path,
            })
        }
        return schema as ZodSchema
    }, [validationSchema, formLevelValidators])
}
