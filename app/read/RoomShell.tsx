'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

// RoomShell — the v3 kid-surface shell. Owns the `online`/`offline` state
// consumed by the shelf callback ("try again when you're back online"), and
// registers the service worker once per SPA session. No sw-app class, no
// bedtime flip — the drawn room is the design language, and the clock-driven
// LightingProvider (mounted per page) handles day/evening/night.

type RoomShellCtx = {
  online: boolean
}

const RoomShellContext = createContext<RoomShellCtx>({ online: true })

export function useRoomShell() {
  return useContext(RoomShellContext)
}

export function RoomShell({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    setOnline(navigator.onLine)
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)

    // Service worker registration — moved here from layout.tsx so it lives
    // with the online/offline wiring it enables.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const value = useMemo(() => ({ online }), [online])

  return <RoomShellContext.Provider value={value}>{children}</RoomShellContext.Provider>
}
