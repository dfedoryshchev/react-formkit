// @vitest-environment jsdom
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { defaultTheme, themeToCssVars, type FormTheme } from '../../src'

const declaredVars = (): Record<string, string> => {
    const source = readFileSync(join('src', 'styles', 'theme.scss'), 'utf8')
    const declarations = source.matchAll(/(--fk-[a-z-]+):\s*([^;]+);/g)
    return Object.fromEntries([...declarations].map(([, name, value]) => [name, value.trim()]))
}

const consumedVars = (): Set<string> => {
    const names = new Set<string>()
    const files = readdirSync('src', { recursive: true, encoding: 'utf8' })
    for (const file of files.filter((f) => f.endsWith('.scss'))) {
        const source = readFileSync(join('src', file), 'utf8')
        for (const [, name] of source.matchAll(/var\((--fk-[a-z-]+)/g)) names.add(name)
    }
    return names
}

describe('themeToCssVars', () => {
    it('maps each primitive onto the custom property the stylesheets read', () => {
        const theme: Required<FormTheme> = {
            borderColor: '#cbd5e0',
            focusColor: '#2b6cb0',
            focusRing: 'rgba(43, 108, 176, 0.25)',
            disabledBg: '#edf2f7',
            readonlyBg: '#f7fafc',
            radius: '6px',
        }
        expect(themeToCssVars(theme)).toEqual({
            '--fk-border-color': '#cbd5e0',
            '--fk-focus-color': '#2b6cb0',
            '--fk-focus-ring': 'rgba(43, 108, 176, 0.25)',
            '--fk-disabled-bg': '#edf2f7',
            '--fk-readonly-bg': '#f7fafc',
            '--fk-radius': '6px',
        })
    })

    it('leaves an unset primitive out, so the value from the enclosing scope still applies', () => {
        expect(themeToCssVars({ radius: '0' })).toEqual({ '--fk-radius': '0' })
        expect(themeToCssVars({})).toEqual({})
    })

    it('applies through a style prop on a wrapper', () => {
        const scoped = themeToCssVars({ focusColor: 'rebeccapurple', radius: '8px' })
        const { getByTestId } = render(<div data-testid="scope" style={scoped} />)
        const style = getByTestId('scope').style
        expect(style.getPropertyValue('--fk-focus-color')).toBe('rebeccapurple')
        expect(style.getPropertyValue('--fk-radius')).toBe('8px')
    })
})

describe('defaultTheme', () => {
    it('matches the :root defaults the stylesheet declares', () => {
        expect(themeToCssVars(defaultTheme)).toEqual(declaredVars())
    })

    it('covers every custom property a control stylesheet reads', () => {
        const mapped = Object.keys(themeToCssVars(defaultTheme))
        expect([...consumedVars()].sort()).toEqual(mapped.sort())
    })
})
