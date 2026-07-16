'use client'

// Kid-surface error boundary. A 4-year-old must never meet a stack trace or a
// blank screen — any render error in the reading app lands here: warm copy,
// one big "try again" (reset) and a way back to the shelf. The error itself
// goes to the console for debugging (visible in Vercel logs when it happened
// during SSR, and in devtools when client-side).

import { useEffect } from 'react'

export default function ReadError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[read] surface error:', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: 32,
        textAlign: 'center',
        background: '#F4EBD8',
        color: '#46362A',
        fontFamily: 'var(--font-body, Georgia, serif)',
      }}
    >
      <div style={{ fontSize: 56 }} aria-hidden="true">
        📖💤
      </div>
      <h1 style={{ font: '700 26px var(--font-display, Georgia, serif)', margin: 0 }}>
        This page fell asleep!
      </h1>
      <p style={{ margin: 0, maxWidth: 420, fontSize: 17, lineHeight: 1.5, color: '#6E5B49' }}>
        Let&rsquo;s give it a gentle poke and try again.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={reset}
          style={{
            minHeight: 60,
            padding: '12px 30px',
            borderRadius: '20px 24px 21px 23px',
            border: 'none',
            background: '#D95B43',
            color: '#F9F2E3',
            font: '700 19px var(--font-display, Georgia, serif)',
            boxShadow: '0 8px 18px rgba(217,91,67,.4)',
            cursor: 'pointer',
            touchAction: 'manipulation',
          }}
        >
          Try again
        </button>
        <a
          href="/read"
          style={{
            minHeight: 60,
            padding: '12px 26px',
            borderRadius: '20px 24px 21px 23px',
            background: '#F9F2E3',
            color: '#46362A',
            font: '700 18px var(--font-display, Georgia, serif)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            border: '2px solid #E4D6B8',
          }}
        >
          Back to my shelf
        </a>
      </div>
    </div>
  )
}
