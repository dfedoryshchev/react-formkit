import { NativeFieldRenderer } from '@/config/nativeRenderer'
import type { FieldRendererRegistry } from '@/config/renderer.types'
import { MantineTextRenderer } from './MantineTextRenderer'

export { MantineTextRenderer }

export const mantineRenderers: FieldRendererRegistry = {
    fallback: NativeFieldRenderer,
    byType: { text: MantineTextRenderer },
}
