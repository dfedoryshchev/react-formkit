import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
    resolve: {
        alias: { '@': resolve(process.cwd(), 'src') },
    },
    test: {
        globals: true,
        // default to node (fast); DOM test files opt in with a
        // `// @vitest-environment jsdom` docblock.
        environment: 'node',
        setupFiles: ['./tests/setup.ts'],
        // run files sequentially - avoids jsdom worker-timeout flakiness here.
        fileParallelism: false,
    },
})
