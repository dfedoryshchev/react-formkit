// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, fireEvent, waitFor, within } from '@testing-library/react'
import { FormFromPrompt } from '../../examples/form-from-prompt/FormFromPrompt'

const mount = () => {
    const { container } = render(<FormFromPrompt />)
    const view = within(container)
    const input = (name: string) =>
        container.querySelector<HTMLInputElement>(`input[name="${name}"]`)
    return {
        container,
        view,
        input,
        type: (name: string, value: string) => {
            const el = input(name)
            if (!el) throw new Error(`no input named ${name}`)
            fireEvent.change(el, { target: { value } })
        },
        submit: () => fireEvent.click(view.getByRole('button', { name: 'Book' })),
        submitted: () => container.querySelector('pre'),
    }
}

describe('form-from-prompt example', () => {
    it('renders every field of the JSON config, the company block hidden until ticked', () => {
        const form = mount()
        expect(form.input('fullName')).not.toBeNull()
        expect(form.input('email')).not.toBeNull()
        expect(form.container.querySelector('select[name="session"]')).not.toBeNull()
        expect(form.input('attendees.0.name')).not.toBeNull()
        expect(form.input('company.name')).toBeNull()

        fireEvent.click(form.view.getByRole('checkbox', { name: 'Booking for a company' }))
        expect(form.input('company.name')).not.toBeNull()
    })

    it('blocks an invalid submit with the messages from the message map', async () => {
        const form = mount()
        form.type('fullName', 'S')
        form.submit()

        await waitFor(() =>
            expect(form.view.getByText('Must be at least 2 characters')).toBeTruthy(),
        )
        expect(form.view.getAllByText('This field is required').length).toBeGreaterThan(0)
        expect(form.submitted()).toBeNull()
    })

    it('submits nested group and array values once the form is valid', async () => {
        const form = mount()
        form.type('fullName', 'Sam Example')
        form.type('email', 'sam@example.com')
        fireEvent.click(form.view.getByRole('checkbox', { name: 'Booking for a company' }))
        form.type('company.name', 'Example Ltd')
        form.type('attendees.0.name', 'Sam Example')
        form.type('attendees.0.email', 'sam@example.com')
        fireEvent.click(form.view.getByRole('button', { name: 'Add attendee' }))
        await waitFor(() => expect(form.input('attendees.1.name')).not.toBeNull())
        form.type('attendees.1.name', 'Jo Example')
        form.type('attendees.1.email', 'jo@example.com')
        form.submit()

        await waitFor(() => expect(form.submitted()).not.toBeNull())
        expect(JSON.parse(form.submitted()!.textContent ?? '')).toEqual({
            fullName: 'Sam Example',
            email: 'sam@example.com',
            session: 'morning',
            forCompany: true,
            company: { name: 'Example Ltd', vatNumber: '' },
            attendees: [
                { name: 'Sam Example', email: 'sam@example.com' },
                { name: 'Jo Example', email: 'jo@example.com' },
            ],
        })
    })
})
