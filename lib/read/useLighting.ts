// Little Fables — clock lighting hook.
// Reads `currentLighting(now)` on mount and ticks once per minute (battery-friendly,
// per A2). Consumers are the LightingProvider (which paints the register + vars
// onto the room root) and any surface that needs to know the current register —
// e.g. quiet-time books force `lantern` regardless of clock.

'use client'

import { useEffect, useState } from 'react'
import { currentLighting } from './lighting'

type LightingState = ReturnType<typeof currentLighting>

export function useLighting(): LightingState {
  // Compute a keyframe on first render so SSR-rendered markup has stable
  // values; the effect will silently refine to the client clock on mount.
  const [state, setState] = useState<LightingState>(() => currentLighting())

  useEffect(() => {
    // Refresh once immediately in case the initial-render state was from an
    // SSR clock (rare in this app, but cheap insurance).
    setState(currentLighting())
    const id = window.setInterval(() => {
      setState(currentLighting())
    }, 60_000)
    return () => window.clearInterval(id)
  }, [])

  return state
}
