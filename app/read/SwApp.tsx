'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'

// Story World shell: owns bedtime state (persisted in localStorage) and applies
// the `sw-app` + optional `sw-bedtime` classes. Parent surfaces (/read/parent)
// deliberately never get the bedtime flip — the design keeps that flip on kid
// surfaces only.

type SwCtx = {
  bedtime: boolean
  toggleBedtime: () => void
  online: boolean
}

const SwContext = createContext<SwCtx>({
  bedtime: false,
  toggleBedtime: () => {},
  online: true,
})

export function useSwApp() {
  return useContext(SwContext)
}

const BEDTIME_KEY = 'sw-bedtime-v1'

export function SwApp({ children }: { children: React.ReactNode }) {
  const [bedtime, setBedtime] = useState(false)
  const [online, setOnline] = useState(true)
  const pathname = usePathname() ?? ''

  useEffect(() => {
    try {
      setBedtime(window.localStorage.getItem(BEDTIME_KEY) === '1')
    } catch {
      /* fresh start */
    }
    setOnline(navigator.onLine)
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const toggleBedtime = useCallback(() => {
    setBedtime((b) => {
      const next = !b
      try { window.localStorage.setItem(BEDTIME_KEY, next ? '1' : '0') } catch {}
      return next
    })
  }, [])

  const isKidSurface = pathname === '/read' || pathname.startsWith('/read/story')
  const applyBedtime = bedtime && isKidSurface

  const value = useMemo(() => ({ bedtime, toggleBedtime, online }), [bedtime, toggleBedtime, online])

  return (
    <SwContext.Provider value={value}>
      <div className={'sw-app' + (applyBedtime ? ' sw-bedtime' : '')}>
        {children}
      </div>
    </SwContext.Provider>
  )
}
