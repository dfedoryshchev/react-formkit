import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Library build for src/. The dev playground uses dev/vite.config.ts.
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
            },
        },
    },
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            formats: ['es', 'cjs'],
            fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
        },
        rollupOptions: {
            external: [
                'react',
                'react-dom',
                'react/jsx-runtime',
                'react-hook-form',
                '@hookform/resolvers',
                '@hookform/resolvers/zod',
                'zod',
                'react-select',
                'react-phone-input-2',
            ],
        },
    },
})
