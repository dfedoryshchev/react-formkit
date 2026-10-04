import { NativeFieldRenderer } from '@/config/nativeRenderer'
import type { FieldRendererRegistry } from '@/config/renderer.types'
import { MantineCheckboxRenderer } from './MantineCheckboxRenderer'
import { MantineDateRenderer } from './MantineDateRenderer'
import { MantineNumberRenderer } from './MantineNumberRenderer'
import { MantineSelectRenderer } from './MantineSelectRenderer'
import { MantineTextRenderer } from './MantineTextRenderer'

export {
    MantineCheckboxRenderer,
    MantineDateRenderer,
    MantineNumberRenderer,
    MantineSelectRenderer,
    MantineTextRenderer,
}

export const mantineRenderers: FieldRendererRegistry = {
    fallback: NativeFieldRenderer,
    byType: {
        text: MantineTextRenderer,
        numeric: MantineNumberRenderer,
        select: MantineSelectRenderer,
        checkbox: MantineCheckboxRenderer,
        date: MantineDateRenderer,
    },
}
