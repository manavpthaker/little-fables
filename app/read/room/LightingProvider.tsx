'use client'

// Little Fables — v3 clock-lighting provider.
// Wraps the room root, reads `currentLighting()` on mount + every minute, and
// paints the resulting register + CSS vars onto the wrapped element.
//
// Per A2 (design/v3-build-addenda.md): interpolation happens once per minute
// (battery-friendly); reduced-motion snaps between keyframes on scene entry
// only; the drift is a *background* update — never a visible fast transition
// mid-view.

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useLighting } from '@/lib/read/useLighting'

// The transitions on the CSS variables happen inside the room via var(), so
// the *values* interpolate smoothly. In practice, once a minute we drop new
// values into the style. Because CSS custom properties themselves don't
// transition on the root, the visual smoothness comes from the child scene's
// own transitions on `background`, `filter`, etc., which are set inside
// read.css against these variables. That's the "cross-fade" — one long
// tween per property, kicked once a minute.

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

interface LightingProviderProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function LightingProvider({ children, className, style }: LightingProviderProps) {
  const { keyframe, register, vars } = useLighting()

  // Snap on first render (or every register change) if the user prefers
  // reduced motion. Otherwise, let CSS transitions on the child scene do
  // the cross-fade. We keep track of whether this is a first-mount so the
  // very first paint doesn't animate from a stale default.
  const firstMount = useRef(true)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mm = window.matchMedia(REDUCED_MOTION_QUERY)
    setReduced(mm.matches)
    const onChange = () => setReduced(mm.matches)
    mm.addEventListener?.('change', onChange)
    return () => mm.removeEventListener?.('change', onChange)
  }, [])

  useEffect(() => {
    firstMount.current = false
  }, [keyframe])

  // Compose the runtime CSS vars. If the first paint OR reduced-motion, we
  // set a marker attr so read.css can skip transitions on this pass. The
  // room's transitions live in read.css against the child elements; here we
  // just publish the values.
  const runtimeVars = {
    ...(vars as Record<string, string>),
  } as CSSProperties

  const dataAttrs: Record<string, string> = {}
  if (register === 'lantern') dataAttrs['data-register'] = 'lantern'
  // dawn/morning/midday/golden all use the default day register (no attr).
  dataAttrs['data-lighting-keyframe'] = keyframe
  if (reduced || firstMount.current) dataAttrs['data-lighting-snap'] = 'true'

  return (
    <div className={className} style={{ ...style, ...runtimeVars }} {...dataAttrs}>
      {children}
    </div>
  )
}
