'use client'

// App-wide error boundary (non-/read routes: marketing home, parent tools).
// Plain, calm, and recoverable — never a raw crash screen.

import { useEffect } from 'react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app] error boundary:', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 32,
        textAlign: 'center',
        background: '#faf7f0',
        color: '#2a2420',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Something went wrong</h1>
      <p style={{ margin: 0, maxWidth: 420, fontSize: 15, lineHeight: 1.5, color: '#6f675d' }}>
        The page hit an unexpected error. Trying again usually fixes it.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={reset}
          style={{
            minHeight: 44,
            padding: '10px 22px',
            borderRadius: 10,
            border: 'none',
            background: '#b8562f',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <a
          href="/"
          style={{
            minHeight: 44,
            padding: '10px 20px',
            borderRadius: 10,
            background: '#fff',
            border: '1px solid #e2dcd1',
            color: '#2a2420',
            fontSize: 15,
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          Go home
        </a>
      </div>
    </div>
  )
}
