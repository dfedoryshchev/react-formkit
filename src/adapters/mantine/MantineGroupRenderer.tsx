import React, { useId } from 'react'
import { Fieldset, Group, Stack, Text } from '@mantine/core'
import type { GroupRenderProps } from '@/config/renderer.types'

export const MantineGroupRenderer: React.FC<GroupRenderProps> = ({ group, children }) => {
    const descriptionId = useId()

    return (
        <Fieldset
            name={group.name}
            legend={group.label}
            aria-describedby={group.description ? descriptionId : undefined}
        >
            {group.description && (
                <Text id={descriptionId} size="sm" c="dimmed" mb="sm">
                    {group.description}
                </Text>
            )}
            {group.layout === 'row' ? (
                <Group grow align="flex-start">
                    {children}
                </Group>
            ) : (
                <Stack>{children}</Stack>
            )}
        </Fieldset>
    )
}
