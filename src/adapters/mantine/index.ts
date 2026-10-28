import { NativeFieldRenderer } from '@/config/nativeRenderer'
import type { FieldRendererRegistry } from '@/config/renderer.types'
import { MantineAutocompleteRenderer } from './MantineAutocompleteRenderer'
import { MantineCheckboxGroupRenderer } from './MantineCheckboxGroupRenderer'
import { MantineCheckboxRenderer } from './MantineCheckboxRenderer'
import { MantineDateRenderer } from './MantineDateRenderer'
import { MantineGroupRenderer } from './MantineGroupRenderer'
import { MantineMultiSelectRenderer } from './MantineMultiSelectRenderer'
import { MantineNumberRenderer } from './MantineNumberRenderer'
import { MantinePasswordRenderer } from './MantinePasswordRenderer'
import { MantineRadioRenderer } from './MantineRadioRenderer'
import { MantineSelectRenderer } from './MantineSelectRenderer'
import { MantineSwitchRenderer } from './MantineSwitchRenderer'
import { MantineTagsRenderer } from './MantineTagsRenderer'
import { MantineTextareaRenderer } from './MantineTextareaRenderer'
import { MantineTextRenderer } from './MantineTextRenderer'
import {
    MantineDateTimeRenderer,
    MantineEmailRenderer,
    MantineTimeRenderer,
    MantineUrlRenderer,
} from './MantineTypedInputRenderers'

export {
    MantineAutocompleteRenderer,
    MantineCheckboxGroupRenderer,
    MantineCheckboxRenderer,
    MantineDateRenderer,
    MantineDateTimeRenderer,
    MantineEmailRenderer,
    MantineGroupRenderer,
    MantineMultiSelectRenderer,
    MantineNumberRenderer,
    MantinePasswordRenderer,
    MantineRadioRenderer,
    MantineSelectRenderer,
    MantineSwitchRenderer,
    MantineTagsRenderer,
    MantineTextareaRenderer,
    MantineTextRenderer,
    MantineTimeRenderer,
    MantineUrlRenderer,
}

// `phone` is left to the fallback: Mantine has no phone control, and a plain tel
// input would drop the country picker and formatting the native one carries.
export const mantineRenderers: FieldRendererRegistry = {
    fallback: NativeFieldRenderer,
    byType: {
        text: MantineTextRenderer,
        numeric: MantineNumberRenderer,
        textarea: MantineTextareaRenderer,
        select: MantineSelectRenderer,
        checkbox: MantineCheckboxRenderer,
        radio: MantineRadioRenderer,
        email: MantineEmailRenderer,
        url: MantineUrlRenderer,
        date: MantineDateRenderer,
        time: MantineTimeRenderer,
        datetime: MantineDateTimeRenderer,
        'checkbox-group': MantineCheckboxGroupRenderer,
        switch: MantineSwitchRenderer,
        password: MantinePasswordRenderer,
        multiselect: MantineMultiSelectRenderer,
        autocomplete: MantineAutocompleteRenderer,
        'multi-autocomplete': MantineTagsRenderer,
    },
    group: MantineGroupRenderer,
}
