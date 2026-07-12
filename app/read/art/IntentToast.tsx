'use client'

// The buddy misfire etiquette UI (PRD R17). A drawn cream card with an
// optional row of two tap chips. Replaces v2 IntentToast which used a
// bubble emoji + a "×" dismiss glyph.

interface IntentToastProps {
  message: string
  options?: string[]
  onPick?: (index: number, label: string) => void
  onClose?: () => void
}

const INK = 'var(--ink, #46362A)'

function CloseGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <path
        d="M 5 5 L 17 17 M 17 5 L 5 17"
        stroke={INK}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        filter="url(#lf-wobble)"
      />
    </svg>
  )
}

export function IntentToast({ message, options, onPick, onClose }: IntentToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="lf-screen-in lf-drawn-border"
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%) rotate(-0.4deg)',
        top: 20,
        zIndex: 50,
        maxWidth: 480,
        width: 'calc(100vw - 32px)',
        background: 'var(--paper-bright, #F9F2E3)',
        backgroundImage: 'var(--texture-paper)',
        border: 'none',
        borderRadius: '16px 20px 17px 19px',
        boxShadow: '0 12px 30px -12px rgba(70,54,42,.35)',
        padding: '14px 16px 16px',
        color: 'var(--ink, #46362A)',
        font: '700 15.5px/1.4 var(--font-body)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ flex: 1 }}>{message}</span>
        {onClose && (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onClose}
            className="lf-press"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              marginTop: -2,
              padding: 4,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ink-faint, #97836B)',
            }}
          >
            <CloseGlyph />
          </button>
        )}
      </div>
      {options && options.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {options.slice(0, 2).map((opt, i) => (
            <button
              key={i}
              type="button"
              className="lf-press lf-drawn-border"
              onClick={() => onPick?.(i, opt)}
              style={{
                background: 'var(--paper, #F4EBD8)',
                backgroundImage: 'var(--texture-paper)',
                border: 'none',
                borderRadius: '14px 18px 15px 17px',
                padding: '10px 18px',
                font: '700 14px var(--font-body)',
                color: 'var(--ink, #46362A)',
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
