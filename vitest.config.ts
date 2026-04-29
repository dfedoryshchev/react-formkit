import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        // validators and hooks-under-test are pure; component tests switch this
        // to jsdom when they are added.
        environment: 'node',
    },
})
