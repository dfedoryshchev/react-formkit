import React, { useMemo } from 'react'
import type { UseFormProps } from 'react-hook-form'
import { BasicForm, withSubmitButton } from '@/form'
import type { MessageOverrides } from '@/validation/messages'
import { buildSchema } from './buildSchema'
import { ConfigFields } from './ConfigFields'
import type { FormConfig } from './config.types'
import type { FieldRendererRegistry } from './renderer.types'
import { useFormFromConfig } from './useFormFromConfig'

export interface SchemaFormProps {
    config: FormConfig
    onSubmit: (data: any) => any
    renderers?: FieldRendererRegistry
    buttonLabel?: string
    children?: React.ReactNode
    messages?: MessageOverrides
    mode?: UseFormProps['mode']
    onSuccess?: (result: any, data: any) => void
    successContent?: React.ReactNode
    keepFormOnSuccess?: boolean
    loadingOverlay?: boolean
    resetOnSubmit?: boolean
}

const FormWithButton = withSubmitButton(BasicForm)

export const SchemaForm: React.FC<SchemaFormProps> = ({
    config,
    renderers,
    buttonLabel = 'Submit',
    children,
    ...formProps
}) => {
    const { defaults, fields, schema } = useFormFromConfig(config)

    // A ready-built schema already carries its messages, so the form gets a
    // builder it can run inside its `messages` scope. Keyed on `schema`, which
    // changes exactly when the config's schema inputs do.
    const buildFromConfig = useMemo(
        () => () => buildSchema(config),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [schema],
    )

    return (
        <FormWithButton
            {...formProps}
            defaultValues={defaults}
            validationSchema={buildFromConfig}
            buttonLabel={buttonLabel}
        >
            <ConfigFields config={fields} renderers={renderers} />
            {children}
        </FormWithButton>
    )
}
