'use client'

// Little Fables — the Drawn Room stage.
// Renders the north-star painting as a background image, then positions
// overlay tap-targets over the interactive zones in stage coordinates.
//
// Coordinate system: the SVG background uses viewBox 0 0 1180 820 (the
// landscape north-star). Overlay zones are absolutely-positioned within a
// container with `aspect-ratio: 1180 / 820`, so each zone's percent-based
// left/top hits the correct spot on the painting at every viewport size.
//
// Interactive zones (per the layout in design/handoff-v4-hifi/project/app/
// room.jsx `ROOM_LAYOUT.landscape`):
//   - buddy on rug        (center-lower)
//   - shelf niches        (top-right — face-out covers)
//   - sun row             (left, on the windowsill)
//   - word pins           (upper-mid wall)
//   - medallion mounts    (right, below the shelf)
//   - writing desk        (mid-lower — the "kitchen door")
//   - crate               (center-lower — someone new)
//   - door edge           (far-left — sliver to /read/parent)
//
// Overlays are rendered as `<button className="lf-press">` — the coral
// pressed treatment is designed inside read.css. Decorative SVG layers set
// `pointer-events: none` so only tap targets receive input (A1).

import type { ReactNode, CSSProperties, MouseEventHandler } from 'react'
import Image from 'next/image'

// Stage coordinates from ROOM_LAYOUT.landscape.
const STAGE = { w: 1180, h: 820 }

interface ZoneCoords {
  /** Left in stage px. */
  x: number
  /** Top in stage px. */
  y: number
  /** Width in stage px. */
  w: number
  /** Height in stage px. */
  h: number
}

/** Stage-coordinate positions of every interactive zone. */
export const ROOM_ZONES = {
  // On the rug — where the buddy sits + the "tap-to-listen" mic.
  buddy: { x: 356, y: 470, w: 190, h: 260 } satisfies ZoneCoords,
  // The Continue / today's-adventure card — center-lower over the rug/crate area.
  continue: { x: 420, y: 540, w: 340, h: 240 } satisfies ZoneCoords,
  // Windowsill — sun row lives across the sill (left column).
  suns: { x: 84, y: 420, w: 260, h: 120 } satisfies ZoneCoords,
  // Wall — word pins (upper-mid).
  wordWall: { x: 440, y: 140, w: 380, h: 200 } satisfies ZoneCoords,
  // Shelf — six face-out slots (two rows of three) on the top-right.
  shelfTop: { x: 800, y: 300, w: 300, h: 100 } satisfies ZoneCoords,
  shelfBottom: { x: 800, y: 448, w: 300, h: 100 } satisfies ZoneCoords,
  // Medallions — a row of mounts below the shelf.
  medallions: { x: 800, y: 580, w: 300, h: 60 } satisfies ZoneCoords,
  // Writing desk — the story kitchen door.
  desk: { x: 600, y: 460, w: 200, h: 160 } satisfies ZoneCoords,
  // Crate — someone new is coming.
  crate: { x: 640, y: 540, w: 140, h: 100 } satisfies ZoneCoords,
  // Door edge — far left. This is the parent-corner slip through.
  door: { x: 0, y: 96, w: 76, h: 500 } satisfies ZoneCoords,
} as const

export type RoomZone = keyof typeof ROOM_ZONES

// ------------------------------------------------------------------

interface RoomSceneProps {
  /** Overlay children — RoomZone renders and any absolutely-positioned art. */
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

/** The stage. Renders the north-star painting behind absolutely-positioned
 *  overlays. Consumers use <ZonedOverlay> to place items in stage coordinates. */
export function RoomScene({ children, className, style }: RoomSceneProps) {
  return (
    <div
      className={`lf-room-scene ${className ?? ''}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${STAGE.w} / ${STAGE.h}`,
        maxWidth: '100vw',
        maxHeight: '100dvh',
        margin: '0 auto',
        overflow: 'hidden',
        background: 'var(--paper, #F4EBD8)',
        ...style,
      }}
    >
      {/* the painting — decorative, drawn scene */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        <Image
          // v3.2 Phase 1 — north-star-empty-shelf.svg is the same painting with
          // the six baked-in decorative book covers removed. Real drawn covers
          // now render on top, positioned in the shelf niches. Prevents the
          // double-shelf effect where stock titles bled through under real books.
          src="/assets/lf-v3/north-star-empty-shelf.svg"
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
      </div>

      {/* Window sky — sits over the painted window rect in the SVG.
          The SVG's window is at (110, 118, 204x294) in stage coords;
          scaled to percentages here. --light-sky drives the fill. */}
      <div
        aria-hidden="true"
        className="lf-room-window-sky"
        style={{
          position: 'absolute',
          left: `${(110 / STAGE.w) * 100}%`,
          top: `${(118 / STAGE.h) * 100}%`,
          width: `${(204 / STAGE.w) * 100}%`,
          height: `${(294 / STAGE.h) * 100}%`,
          pointerEvents: 'none',
          background: 'var(--light-sky)',
          transition: 'background 900ms ease',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Sun — a small marigold disk positioned per keyframe. */}
        <div
          className="lf-room-sun"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 'var(--sun-x, 50%)',
            top: 'var(--sun-y, 30%)',
            width: '22%',
            aspectRatio: '1 / 1',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 40% 40%, var(--sun-color, #F3C453) 0%, var(--sun-color, #F3C453) 55%, transparent 78%)',
            opacity: 'var(--sun-opacity, 0)',
            filter: 'blur(1px)',
            transition:
              'left 900ms ease, top 900ms ease, opacity 900ms ease, background 900ms ease',
          }}
        />
        {/* Moon — a pale bone disk. */}
        <div
          className="lf-room-moon"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 'var(--moon-x, 60%)',
            top: 'var(--moon-y, 30%)',
            width: '16%',
            aspectRatio: '1 / 1',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 42% 40%, var(--moon-color, #EFE6C2) 0%, var(--moon-color, #EFE6C2) 62%, transparent 82%)',
            opacity: 'var(--moon-opacity, 0)',
            filter: 'blur(0.5px)',
            transition:
              'left 900ms ease, top 900ms ease, opacity 900ms ease, background 900ms ease',
          }}
        />
      </div>

      {/* Ambient wash — full-room tint blended `multiply` for warmth /
          `screen` doesn't quite work over a painted scene, `multiply` gives
          consistent tinting. Values in lighting.ts are chosen to be
          obviously different at a squint across keyframes. */}
      <div
        aria-hidden="true"
        className="lf-room-ambient"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'var(--light-ambient)',
          mixBlendMode: 'multiply',
          transition: 'background 900ms ease',
        }}
      />

      {/* Lantern overlay — an indigo mask that lands ONLY in the lantern
          register (dusk / night). Blend-multiply so the drawn walls read
          cooler. Zero opacity in day register (values in lighting.ts). */}
      <div
        aria-hidden="true"
        className="lf-room-lantern-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'var(--lantern-overlay)',
          mixBlendMode: 'multiply',
          transition: 'background 900ms ease',
        }}
      />

      {/* Warm-gold lantern pools — three pools on the rug, under the shelf,
          and near the writing desk. Opacity is 0 in daytime, rising to
          full in dusk/night. `screen` blend puts light INTO the scene. */}
      <div
        aria-hidden="true"
        className="lf-room-pool"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 22% 14% at 38% 78%, rgba(243, 199, 122, 0.9), transparent 65%),' +
            'radial-gradient(ellipse 18% 12% at 82% 62%, rgba(243, 199, 122, 0.7), transparent 65%),' +
            'radial-gradient(ellipse 14% 10% at 60% 74%, rgba(243, 199, 122, 0.75), transparent 65%)',
          opacity: 'var(--pool-opacity, 0)',
          mixBlendMode: 'screen',
          transition: 'opacity 900ms ease',
        }}
      />

      {/* Legacy soft light pool — kept as a subtle base warm on the rug. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 40% 30% at 32% 46%, var(--light-pool), transparent 60%)',
          transition: 'background 900ms ease',
        }}
      />

      {/* overlay layer — every tap target lives here */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------

interface ZonedOverlayProps {
  zone: RoomZone
  children: ReactNode
  style?: CSSProperties
  className?: string
}

/** Absolutely-positions its children in stage coordinates. */
export function ZonedOverlay({ zone, children, style, className }: ZonedOverlayProps) {
  const c = ROOM_ZONES[zone]
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        left: `${(c.x / STAGE.w) * 100}%`,
        top: `${(c.y / STAGE.h) * 100}%`,
        width: `${(c.w / STAGE.w) * 100}%`,
        height: `${(c.h / STAGE.h) * 100}%`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ------------------------------------------------------------------

interface ZoneButtonProps {
  zone: RoomZone
  onClick?: MouseEventHandler<HTMLButtonElement>
  ariaLabel: string
  children?: ReactNode
  /** When true, the button gets a subtle coral outline. Home has exactly one. */
  coral?: boolean
  className?: string
  style?: CSSProperties
}

/** A stage-positioned tap-button that overlays the drawn scene. */
export function ZoneButton({
  zone,
  onClick,
  ariaLabel,
  children,
  coral = false,
  className,
  style,
}: ZoneButtonProps) {
  const c = ROOM_ZONES[zone]
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`lf-press ${className ?? ''}`}
      style={{
        position: 'absolute',
        left: `${(c.x / STAGE.w) * 100}%`,
        top: `${(c.y / STAGE.h) * 100}%`,
        width: `${(c.w / STAGE.w) * 100}%`,
        height: `${(c.h / STAGE.h) * 100}%`,
        background: 'transparent',
        border: coral
          ? '2.5px solid var(--pigment-terracotta, #D95B43)'
          : '2px solid transparent',
        borderRadius: 16,
        padding: 0,
        cursor: 'pointer',
        color: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'manipulation',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        boxShadow: coral
          ? '0 0 0 4px color-mix(in oklab, var(--pigment-terracotta) 20%, transparent)'
          : 'none',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
