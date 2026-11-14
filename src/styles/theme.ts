import type { CSSProperties } from 'react'

export interface FormTheme {
    borderColor?: string
    focusColor?: string
    focusRing?: string
    disabledBg?: string
    readonlyBg?: string
    radius?: string
}

const cssVarNames: Record<keyof FormTheme, `--fk-${string}`> = {
    borderColor: '--fk-border-color',
    focusColor: '--fk-focus-color',
    focusRing: '--fk-focus-ring',
    disabledBg: '--fk-disabled-bg',
    readonlyBg: '--fk-readonly-bg',
    radius: '--fk-radius',
}

export const defaultTheme: Readonly<Required<FormTheme>> = {
    borderColor: '#dbdbdb',
    focusColor: '#485fc7',
    focusRing: 'rgba(72, 95, 199, 0.15)',
    disabledBg: '#f5f5f5',
    readonlyBg: '#fafafa',
    radius: '4px',
}

export function themeToCssVars(theme: FormTheme): CSSProperties {
    const vars: Record<string, string> = {}
    for (const key of Object.keys(cssVarNames) as (keyof FormTheme)[]) {
        const value = theme[key]
        if (value !== undefined) vars[cssVarNames[key]] = value
    }
    return vars as CSSProperties
}
