import React, { useId } from 'react'
import { Button, Fieldset, Group, Stack, Text } from '@mantine/core'
import type { ArrayItemRenderProps, ArrayRenderProps } from '@/config/renderer.types'

export const MantineArrayRenderer: React.FC<ArrayRenderProps> = ({ array, children, append }) => {
    const descriptionId = useId()

    return (
        <Fieldset
            name={array.name}
            legend={array.label}
            aria-describedby={array.description ? descriptionId : undefined}
        >
            {array.description && (
                <Text id={descriptionId} size="sm" c="dimmed" mb="sm">
                    {array.description}
                </Text>
            )}
            <Stack>
                {children}
                <Group>
                    <Button type="button" variant="light" onClick={append}>
                        {array.addLabel ?? 'Add'}
                    </Button>
                </Group>
            </Stack>
        </Fieldset>
    )
}

export const MantineArrayItemRenderer: React.FC<ArrayItemRenderProps> = ({
    array,
    item,
    children,
}) => (
    <Fieldset
        name={item.name}
        legend={array.itemLabel ? `${array.itemLabel} ${item.index + 1}` : undefined}
    >
        <Stack>
            {array.layout === 'row' ? (
                <Group grow align="flex-start">
                    {children}
                </Group>
            ) : (
                children
            )}
            <Group>
                <Button type="button" variant="subtle" onClick={item.remove}>
                    {array.removeLabel ?? 'Remove'}
                </Button>
            </Group>
        </Stack>
    </Fieldset>
)
