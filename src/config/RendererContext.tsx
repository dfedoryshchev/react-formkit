import React, { createContext, useContext } from 'react'
import type { FieldRendererRegistry } from './renderer.types'
import { nativeRenderers } from './nativeRenderer'

// The default is the native registry, so a ConfigFields with no provider above
// it renders exactly what it rendered before the seam existed.
const RendererContext = createContext<FieldRendererRegistry>(nativeRenderers)

export interface RendererProviderProps {
    renderers: FieldRendererRegistry
    children: React.ReactNode
}

// A nested provider replaces the registry above it rather than layering onto
// it: merging would let an inner registry inherit an outer `byType` entry for a
// type its own `fallback` is there to render.
export const RendererProvider: React.FC<RendererProviderProps> = ({ renderers, children }) => (
    <RendererContext.Provider value={renderers}>{children}</RendererContext.Provider>
)

export const useFieldRenderers = (): FieldRendererRegistry => useContext(RendererContext)
