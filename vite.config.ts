import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import pkg from './package.json'

const externalPackages = [
    ...Object.keys(pkg.peerDependencies),
    ...Object.keys(pkg.dependencies),
]

// Subpaths must match: the bundle reaches for 'react/jsx-runtime' and '@hookform/resolvers/zod',
// which are not package names. Stylesheets must not: src imports react-phone-input-2's css, and
// externalising it drops 45 kB out of the emitted stylesheet and leaves a require() of a .css
// file in the cjs build.
const isExternal = (id: string) =>
    !id.endsWith('.css') &&
    externalPackages.some((name) => id === name || id.startsWith(`${name}/`))

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
            external: isExternal,
        },
    },
})
