'use client'

// Falling drawn stars / lantern fragments. Replaces v2 Confetti (emoji ✦●▲✶).
// Small hand-drawn 5-point stars in warm pigments — ink-outlined with the
// wobble filter so they match the room. Reduced-motion snaps to static.

const INK = 'var(--ink, #46362A)'

function StarPiece({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M 10 2 L 12 8 L 18 9 L 13 13 L 15 19 L 10 15 L 5 19 L 7 13 L 2 9 L 8 8 Z"
        fill={color}
        stroke={INK}
        strokeWidth="1.2"
        filter="url(#lf-wobble)"
      />
    </svg>
  )
}

export function DrawnConfetti({ n = 14 }: { n?: number }) {
  const colors = [
    'var(--pigment-terracotta, #D95B43)',
    'var(--pigment-marigold, #E2A93B)',
    'var(--pigment-butter, #EFC85C)',
    'var(--pigment-sage, #7C9A62)',
    'var(--pigment-dusk, #5D6A8A)',
  ]
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          className="lf-confetti-piece"
          style={{
            position: 'absolute',
            left: `${6 + (i * 89) % 90}%`,
            top: -20,
            animationDelay: `${(i * 0.17) % 1.4}s`,
            animationDuration: `${2.6 + (i % 4) * 0.5}s`,
            transform: `rotate(${(i * 37) % 360}deg)`,
          }}
        >
          <StarPiece color={colors[i % colors.length]!} />
        </span>
      ))}
    </div>
  )
}
