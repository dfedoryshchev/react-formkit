import React, { useState } from 'react'
import { BasicForm } from '../../src/form'
import { ConfigFields, useFormFromConfig, type FormConfig } from '../../src/config'
import workshopBooking from './workshop-booking.json'

const config = workshopBooking as unknown as FormConfig

export function FormFromPrompt() {
    const { defaults, fields, schema } = useFormFromConfig(config)
    const [submitted, setSubmitted] = useState<unknown>(null)

    return (
        <>
            <BasicForm defaultValues={defaults} validationSchema={schema} onSubmit={setSubmitted}>
                <ConfigFields config={fields} />
                <button type="submit" style={{ marginTop: 16, padding: '8px 20px', fontSize: 14 }}>
                    Book
                </button>
            </BasicForm>
            {submitted !== null && <pre>{JSON.stringify(submitted, null, 2)}</pre>}
        </>
    )
}
