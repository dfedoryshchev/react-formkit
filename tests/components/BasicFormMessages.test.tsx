// @vitest-environment jsdom
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { afterEach } from 'vitest'
import { z } from 'zod'
import { BasicForm } from '../../src/form'
import { FormField } from '../../src/field'
import { getMessages, setMessages } from '../../src/validation/messages'
import { useMessages } from '../../src/validation/MessageContext'
import { required, minLength } from '../../src/validation/validators/common.validators'

afterEach(() => {
    setMessages()
})

const buildSchema = () => z.object({ name: required(), nickname: minLength(4) })

const frenchMessages = {
    required: 'Champ obligatoire',
    minLength: 'Minimum {min} caracteres',
}

const renderForm = (messages?: typeof frenchMessages) =>
    render(
        <BasicForm
            onSubmit={() => {}}
            validationSchema={buildSchema}
            defaultValues={{ name: '', nickname: 'ab' }}
            messages={messages}
        >
            <FormField name="name" type="text" label="Name" />
            <FormField name="nickname" type="text" label="Nickname" />
            <button type="submit">Submit</button>
        </BasicForm>,
    )

describe('BasicForm messages prop', () => {
    it('uses the defaults when no overrides are given', async () => {
        renderForm()
        fireEvent.click(screen.getByText('Submit'))
        await waitFor(() => expect(screen.getByText('This field is required')).toBeInTheDocument())
    })

    it('applies per-form overrides to the schema it builds', async () => {
        renderForm(frenchMessages)
        fireEvent.click(screen.getByText('Submit'))
        await waitFor(() => expect(screen.getByText('Champ obligatoire')).toBeInTheDocument())
        expect(screen.getByText('Minimum 4 caracteres')).toBeInTheDocument()
    })

    it('does not leak the overrides into the app-wide map', async () => {
        renderForm(frenchMessages)
        fireEvent.click(screen.getByText('Submit'))
        await waitFor(() => expect(screen.getByText('Champ obligatoire')).toBeInTheDocument())
        expect(getMessages().required).toBe('This field is required')
    })

    it('exposes the resolved map to children via useMessages', () => {
        const Peek = () => <span>{useMessages().required}</span>
        render(
            <BasicForm onSubmit={() => {}} messages={frenchMessages}>
                <Peek />
            </BasicForm>,
        )
        expect(screen.getByText('Champ obligatoire')).toBeInTheDocument()
    })

    it('keeps two forms on the page independent', async () => {
        render(
            <>
                <BasicForm
                    onSubmit={() => {}}
                    validationSchema={buildSchema}
                    defaultValues={{ name: '', nickname: 'abcd' }}
                    messages={frenchMessages}
                >
                    <FormField name="name" type="text" label="Name" />
                    <button type="submit">Submit FR</button>
                </BasicForm>
                <BasicForm
                    onSubmit={() => {}}
                    validationSchema={buildSchema}
                    defaultValues={{ name: '', nickname: 'abcd' }}
                >
                    <FormField name="name" type="text" label="Name" />
                    <button type="submit">Submit EN</button>
                </BasicForm>
            </>,
        )

        fireEvent.click(screen.getByText('Submit FR'))
        fireEvent.click(screen.getByText('Submit EN'))
        await waitFor(() => expect(screen.getByText('Champ obligatoire')).toBeInTheDocument())
        expect(screen.getByText('This field is required')).toBeInTheDocument()
    })
})
