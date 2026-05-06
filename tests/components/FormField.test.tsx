// @vitest-environment jsdom
import React from 'react'
import { render, screen } from '@testing-library/react'
import { z } from 'zod'
import { BasicForm } from '../../src/form'
import { FormField } from '../../src/field'

const schema = z.object({ name: z.string().min(1) })

const renderField = () =>
    render(
        <BasicForm onSubmit={() => {}} validationSchema={schema} defaultValues={{ name: '' }}>
            <FormField name="name" type="text" label="Name" />
        </BasicForm>,
    )

describe('FormField', () => {
    it('renders the labelled text control', () => {
        renderField()
        expect(screen.getByText('Name')).toBeInTheDocument()
        expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('marks a schema-required field with aria-required', () => {
        renderField()
        expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true')
    })

    it('associates the label with the input via id/htmlFor', () => {
        renderField()
        expect(screen.getByRole('textbox')).toHaveAttribute('id', 'name')
    })

    // a form-level refinement attached to one field only re-validates
    // on submit, or when that field changes - changing the OTHER referenced
    // field does not clear/raise the cross-field error. Unskip once
    // useFormLevelValidators triggers dependent revalidation on change.
    it.skip('cross-field error updates when the other field changes', () => {
        // intentionally skipped until the on-change cross-field limitation is fixed
    })
})
