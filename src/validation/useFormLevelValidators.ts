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
// a refinement attached to `path` only re-validates when that field
// changes (or on submit). Changing the *other* field referenced by the
// refinement will not clear or raise the error until submit, because the form
// validates on submit. So cross-field rules effectively fire on submit only.
// TODO: revalidate dependent fields on change (RHF trigger()).
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
