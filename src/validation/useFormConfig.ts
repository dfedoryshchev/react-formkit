import { useEffect, useMemo } from 'react'
import { useForm, UseFormProps } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ZodSchema } from 'zod'
import { FormLevelValidator, useFormLevelValidators } from './useFormLevelValidators'

interface FormConfig {
    validationSchema?: ZodSchema
    defaultValues?: Record<string, any>
    formLevelValidators?: FormLevelValidator[]
    // RHF's validation trigger. Left to RHF's own default when unset.
    mode?: UseFormProps['mode']
}

export const useFormConfig = ({
    validationSchema,
    defaultValues = {},
    formLevelValidators,
    mode,
}: FormConfig) => {
    const schema = useFormLevelValidators(validationSchema, formLevelValidators)

    const formOptions = useMemo<UseFormProps>(() => {
        const opts: UseFormProps = { defaultValues }
        if (mode) opts.mode = mode
        if (schema) {
            // @hookform/resolvers v5 overloads zodResolver for zod 3 and zod 4;
            // our zod 3 ZodSchema needs a cast to match the v3 overload.
            opts.resolver = zodResolver(schema as any)
        }
        return opts
    }, [schema, defaultValues, mode])

    const methods = useForm(formOptions)

    // Cross-field refinements attach their error to a `path`, but RHF only
    // re-validates the field being edited - so changing another field the
    // refinement reads leaves the path's error stale until the next submit.
    // Re-trigger the dependent paths on every change (once the form has been
    // submitted, so errors don't surface prematurely).
    const dependentPaths = useMemo(
        () =>
            (formLevelValidators ?? [])
                .map((v) => v.path?.join('.'))
                .filter((p): p is string => !!p),
        [formLevelValidators],
    )

    useEffect(() => {
        if (!dependentPaths.length) return
        const subscription = methods.watch(() => {
            if (methods.formState.isSubmitted) {
                methods.trigger(dependentPaths)
            }
        })
        return () => subscription.unsubscribe()
    }, [methods, dependentPaths])

    return methods
}
