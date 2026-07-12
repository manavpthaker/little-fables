'use client'

// The offline banner — the ONE piece of behavior worth preserving from the
// v2 kit. A drawn small strip at the top of the screen, warm and quiet.
// The v2 version leaned on a ☁️ emoji; this one uses a drawn cloud in
// ink so it reads with the rest of the room.

const INK = 'var(--ink, #46362A)'

function CloudGlyph() {
  return (
    <svg width="28" height="20" viewBox="0 0 34 22" aria-hidden="true">
      <path
        d="M 6 16 Q 2 12 6 10 Q 6 4 12 6 Q 15 2 20 4 Q 26 2 28 8 Q 32 10 30 14 Q 30 18 26 18 L 8 18 Q 4 18 6 16 Z"
        fill="var(--paper-bright, #F9F2E3)"
        stroke={INK}
        strokeWidth="1.8"
        filter="url(#lf-wobble)"
      />
    </svg>
  )
}

export function OfflineBanner() {
  return (
    <div
      role="status"
      className="lf-drawn-border"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        background: 'var(--paper-bright, #F9F2E3)',
        backgroundImage: 'var(--texture-paper)',
        border: 'none',
        borderRadius: 0,
        padding: '10px 24px',
        font: '700 14px var(--font-body)',
        color: 'var(--ink, #46362A)',
      }}
    >
      <CloudGlyph />
      <span>No internet — your saved stories still work!</span>
    </div>
  )
}
