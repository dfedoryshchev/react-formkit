// @vitest-environment jsdom
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { BasicForm } from '../../src/form'
import { FormField } from '../../src/field'

const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
]

const submitted = async (onSubmit: ReturnType<typeof vi.fn>) => {
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    return onSubmit.mock.calls[0][0]
}

const renderOne = (
    field: React.ReactNode,
    defaultValues: Record<string, unknown>,
    onSubmit = vi.fn(),
) => {
    render(
        <BasicForm onSubmit={onSubmit} defaultValues={defaultValues}>
            {field}
            <button type="submit">Submit</button>
        </BasicForm>,
    )
    return onSubmit
}

describe('SwitchInput', () => {
    it('toggles the submitted boolean', async () => {
        const onSubmit = renderOne(<FormField name="on" type="switch" label="Enabled" />, {
            on: false,
        })
        const toggle = screen.getByRole('switch')
        expect(toggle).not.toBeChecked()

        await userEvent.click(toggle)

        expect(toggle).toBeChecked()
        expect(await submitted(onSubmit)).toEqual({ on: true })
    })

    it('does not toggle while disabled', async () => {
        renderOne(<FormField name="on" type="switch" label="Enabled" disabled />, { on: false })

        await userEvent.click(screen.getByRole('switch'))

        expect(screen.getByRole('switch')).not.toBeChecked()
    })
})

describe('PasswordInput', () => {
    it('masks the value until the toggle is pressed, and back again', async () => {
        renderOne(<FormField name="pw" type="password" label="Password" />, { pw: 'hunter2' })
        const input = screen.getByLabelText('Password')
        expect(input).toHaveAttribute('type', 'password')

        await userEvent.click(screen.getByRole('button', { name: 'Show password' }))
        expect(input).toHaveAttribute('type', 'text')

        await userEvent.click(screen.getByRole('button', { name: 'Hide password' }))
        expect(input).toHaveAttribute('type', 'password')
    })

    it('pressing the toggle does not submit the form', async () => {
        const onSubmit = renderOne(<FormField name="pw" type="password" label="Password" />, {
            pw: '',
        })

        await userEvent.click(screen.getByRole('button', { name: 'Show password' }))

        expect(onSubmit).not.toHaveBeenCalled()
    })

    it('submits what was typed while the value was masked', async () => {
        const onSubmit = renderOne(<FormField name="pw" type="password" label="Password" />, {
            pw: '',
        })

        await userEvent.type(screen.getByLabelText('Password'), 'secret')

        expect(await submitted(onSubmit)).toEqual({ pw: 'secret' })
    })
})

describe('CheckboxGroup', () => {
    it('submits the checked option values, in the order they were ticked', async () => {
        const onSubmit = renderOne(
            <FormField name="picks" type="checkbox-group" label="Picks" options={options} />,
            { picks: [] },
        )

        await userEvent.click(screen.getByLabelText('Beta'))
        await userEvent.click(screen.getByLabelText('Alpha'))

        expect(await submitted(onSubmit)).toEqual({ picks: ['b', 'a'] })
    })

    it('unticking removes only that option', async () => {
        const onSubmit = renderOne(
            <FormField name="picks" type="checkbox-group" label="Picks" options={options} />,
            { picks: ['a', 'b'] },
        )
        expect(screen.getByLabelText('Alpha')).toBeChecked()

        await userEvent.click(screen.getByLabelText('Alpha'))

        expect(await submitted(onSubmit)).toEqual({ picks: ['b'] })
    })

    it('treats a missing value as nothing ticked', () => {
        renderOne(
            <FormField name="picks" type="checkbox-group" label="Picks" options={options} />,
            {},
        )

        expect(screen.getByLabelText('Alpha')).not.toBeChecked()
        expect(screen.getByLabelText('Beta')).not.toBeChecked()
    })
})

describe('RadioGroup', () => {
    it('selecting an option replaces the previous one', async () => {
        const onSubmit = renderOne(
            <FormField name="pick" type="radio" label="Pick" options={options} />,
            { pick: 'a' },
        )
        expect(screen.getByLabelText('Alpha')).toBeChecked()

        await userEvent.click(screen.getByLabelText('Beta'))

        expect(screen.getByLabelText('Alpha')).not.toBeChecked()
        expect(await submitted(onSubmit)).toEqual({ pick: 'b' })
    })

    it('disables every option', () => {
        renderOne(<FormField name="pick" type="radio" label="Pick" options={options} disabled />, {
            pick: 'a',
        })

        expect(screen.getByLabelText('Alpha')).toBeDisabled()
        expect(screen.getByLabelText('Beta')).toBeDisabled()
    })
})

describe('TextareaInput', () => {
    it('submits multi-line text unchanged', async () => {
        const onSubmit = renderOne(<FormField name="bio" type="textarea" label="Bio" />, {
            bio: '',
        })

        await userEvent.type(screen.getByLabelText('Bio'), 'one{enter}two')

        expect(await submitted(onSubmit)).toEqual({ bio: 'one\ntwo' })
    })

    it('shows an empty box for a missing value', () => {
        renderOne(<FormField name="bio" type="textarea" label="Bio" />, {})

        expect(screen.getByLabelText('Bio')).toHaveValue('')
    })
})
