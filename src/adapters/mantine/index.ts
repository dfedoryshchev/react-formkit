import { NativeFieldRenderer } from '@/config/nativeRenderer'
import type { FieldRendererRegistry } from '@/config/renderer.types'
import { MantineCheckboxRenderer } from './MantineCheckboxRenderer'
import { MantineSelectRenderer } from './MantineSelectRenderer'
import { MantineTextRenderer } from './MantineTextRenderer'

export { MantineCheckboxRenderer, MantineSelectRenderer, MantineTextRenderer }

export const mantineRenderers: FieldRendererRegistry = {
    fallback: NativeFieldRenderer,
    byType: {
        text: MantineTextRenderer,
        select: MantineSelectRenderer,
        checkbox: MantineCheckboxRenderer,
    },
}
