// Little Fables v3.2 — Semantic scene key → drawn scene dispatcher.
//
// Reader pages now carry a semantic scene key (page.scene) like 'bus',
// 'bear-hollow', 'moon-window', 'bridge'. This module maps each key to a
// drawn scene component. Keys that don't yet have a real drawn scene fall
// through to <DrawnEndpaperArt /> — a paper placeholder with a wash tint,
// NOT emoji or a raw wash rectangle. The art-generation pipeline will
// backfill the missing scenes over time.
//
// Every scene is:
//   - drawn with the same hand as the rest of Little Fables
//     (paper + wash + wobble ink filter)
//   - reduced-motion safe (no motion)
//   - `pointer-events: none` at the SVG level so tap targets pass through

import type { CSSProperties } from 'react'
import type { WashKey } from '@/types/story'
import { DrawnEndpaperArt } from './DrawnEndpaperArt'

const INK = 'var(--ink, #46362A)'

interface SceneShellProps {
  children: React.ReactNode
  style?: CSSProperties
}

/** Shared paper-frame with a viewBox that matches DrawnEndpaperArt so scenes
 *  slot into the same reader spread neatly. */
function SceneShell({ children, style }: SceneShellProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        width: 'min(560px, 100%)',
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: '4 / 3',
        borderRadius: 22,
        background: 'var(--paper-bright, #F9F2E3)',
        backgroundImage: 'var(--texture-paper)',
        boxShadow: '0 8px 26px rgba(94,62,26,.18)',
        overflow: 'hidden',
        ...style,
      }}
    >
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        {children}
      </svg>
    </div>
  )
}

// ---------- Individual drawn scenes ----------
// These are intentionally simple — enough tone and shape to read the beat
// without pretending to be full illustration. The pipeline replaces them.

function BridgeScene() {
  return (
    <SceneShell>
      {/* river below */}
      <path
        d="M 0 220 Q 100 210 200 218 T 400 220 L 400 300 L 0 300 Z"
        fill="rgba(78,127,163,.35)"
        filter="url(#lf-wash-edge)"
      />
      <path d="M 0 218 Q 100 208 200 216 T 400 218" stroke={INK} strokeWidth="1.6" fill="none" filter="url(#lf-wobble)" />
      {/* rope bridge */}
      <path d="M 40 180 Q 200 156 360 180" stroke={INK} strokeWidth="2.2" fill="none" filter="url(#lf-wobble)" />
      <path d="M 40 200 Q 200 178 360 200" stroke={INK} strokeWidth="2" fill="none" filter="url(#lf-wobble)" />
      {[70, 110, 150, 190, 230, 270, 310, 350].map((x) => (
        <path key={x} d={`M ${x} 180 L ${x} 200`} stroke={INK} strokeWidth="1.4" filter="url(#lf-wobble)" />
      ))}
      {/* trees */}
      <ellipse cx="46" cy="150" rx="30" ry="34" fill="rgba(124,154,98,.55)" filter="url(#lf-wash-edge)" />
      <ellipse cx="358" cy="150" rx="30" ry="34" fill="rgba(124,154,98,.55)" filter="url(#lf-wash-edge)" />
      <path d="M 46 184 L 46 214" stroke={INK} strokeWidth="2" filter="url(#lf-wobble)" />
      <path d="M 358 184 L 358 214" stroke={INK} strokeWidth="2" filter="url(#lf-wobble)" />
    </SceneShell>
  )
}

function WebScene() {
  return (
    <SceneShell>
      {/* soft dawn wash */}
      <rect x="0" y="0" width="400" height="300" fill="rgba(241,166,154,.18)" filter="url(#lf-wash-edge)" />
      {/* the web — radial + spiral */}
      <g stroke={INK} strokeWidth="1.4" fill="none" filter="url(#lf-wobble)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path
            key={a}
            d={`M 200 150 L ${200 + 130 * Math.cos((a * Math.PI) / 180)} ${150 + 130 * Math.sin((a * Math.PI) / 180)}`}
          />
        ))}
        {[30, 60, 90, 120].map((r) => (
          <circle key={r} cx="200" cy="150" r={r} opacity="0.7" />
        ))}
      </g>
      {/* dew drop */}
      <circle cx="264" cy="90" r="4" fill="rgba(78,127,163,.7)" filter="url(#lf-wash-edge)" />
    </SceneShell>
  )
}

function BearHollowScene() {
  return (
    <SceneShell>
      {/* ground wash */}
      <path
        d="M 0 220 Q 200 210 400 220 L 400 300 L 0 300 Z"
        fill="rgba(124,154,98,.4)"
        filter="url(#lf-wash-edge)"
      />
      {/* tree trunk */}
      <path d="M 140 60 Q 130 160 150 240 L 250 240 Q 270 160 260 60 Z" fill="rgba(140,102,68,.55)" filter="url(#lf-wash-edge)" />
      {/* hollow opening */}
      <ellipse cx="200" cy="180" rx="42" ry="52" fill="rgba(70,54,42,.7)" filter="url(#lf-wash-edge)" />
      <ellipse cx="200" cy="180" rx="42" ry="52" fill="none" stroke={INK} strokeWidth="2.2" filter="url(#lf-wobble)" />
      {/* canopy */}
      <ellipse cx="200" cy="60" rx="120" ry="52" fill="rgba(124,154,98,.6)" filter="url(#lf-wash-edge)" />
      <path d="M 140 60 Q 130 160 150 240" stroke={INK} strokeWidth="2" fill="none" filter="url(#lf-wobble)" />
      <path d="M 260 60 Q 270 160 250 240" stroke={INK} strokeWidth="2" fill="none" filter="url(#lf-wobble)" />
    </SceneShell>
  )
}

function MoonScene() {
  return (
    <SceneShell>
      {/* night sky */}
      <rect x="0" y="0" width="400" height="300" fill="rgba(22,34,58,.35)" filter="url(#lf-wash-edge)" />
      {/* moon */}
      <circle cx="260" cy="110" r="52" fill="rgba(239,230,194,.9)" filter="url(#lf-wash-edge)" />
      <circle cx="260" cy="110" r="52" fill="none" stroke={INK} strokeWidth="2" filter="url(#lf-wobble)" />
      {/* stars */}
      {[
        [80, 60],
        [120, 100],
        [60, 140],
        [340, 200],
        [180, 60],
        [50, 220],
      ].map(([x, y], i) => (
        <path
          key={i}
          d={`M ${x} ${y - 6} L ${x + 2} ${y - 2} L ${x + 6} ${y} L ${x + 2} ${y + 2} L ${x} ${y + 6} L ${x - 2} ${y + 2} L ${x - 6} ${y} L ${x - 2} ${y - 2} Z`}
          fill="rgba(239,200,92,.9)"
          filter="url(#lf-wobble)"
        />
      ))}
      {/* horizon */}
      <path
        d="M 0 240 Q 200 234 400 240 L 400 300 L 0 300 Z"
        fill="rgba(45,58,90,.4)"
        filter="url(#lf-wash-edge)"
      />
    </SceneShell>
  )
}

function BusScene() {
  return (
    <SceneShell>
      {/* road */}
      <rect x="0" y="220" width="400" height="80" fill="rgba(140,120,90,.3)" filter="url(#lf-wash-edge)" />
      {/* bus body */}
      <rect x="60" y="130" width="280" height="100" rx="14" fill="rgba(239,200,92,.7)" filter="url(#lf-wash-edge)" />
      <rect x="60" y="130" width="280" height="100" rx="14" fill="none" stroke={INK} strokeWidth="2.2" filter="url(#lf-wobble)" />
      {/* windows */}
      {[80, 150, 220, 290].map((x) => (
        <rect
          key={x}
          x={x}
          y="146"
          width="46"
          height="34"
          rx="4"
          fill="rgba(78,127,163,.35)"
          stroke={INK}
          strokeWidth="1.6"
          filter="url(#lf-wobble)"
        />
      ))}
      {/* wheels */}
      <circle cx="120" cy="240" r="20" fill="rgba(70,54,42,.85)" filter="url(#lf-wash-edge)" />
      <circle cx="120" cy="240" r="20" fill="none" stroke={INK} strokeWidth="2" filter="url(#lf-wobble)" />
      <circle cx="290" cy="240" r="20" fill="rgba(70,54,42,.85)" filter="url(#lf-wash-edge)" />
      <circle cx="290" cy="240" r="20" fill="none" stroke={INK} strokeWidth="2" filter="url(#lf-wobble)" />
    </SceneShell>
  )
}

function BoatScene() {
  return (
    <SceneShell>
      <rect x="0" y="0" width="400" height="300" fill="rgba(232,184,122,.15)" filter="url(#lf-wash-edge)" />
      {/* water */}
      <path
        d="M 0 210 Q 100 198 200 208 T 400 210 L 400 300 L 0 300 Z"
        fill="rgba(78,127,163,.5)"
        filter="url(#lf-wash-edge)"
      />
      {/* boat hull */}
      <path d="M 120 200 Q 200 244 280 200 L 260 224 Q 200 236 140 224 Z" fill="rgba(140,102,68,.75)" filter="url(#lf-wash-edge)" />
      <path d="M 120 200 Q 200 244 280 200 L 260 224 Q 200 236 140 224 Z" fill="none" stroke={INK} strokeWidth="2.2" filter="url(#lf-wobble)" />
      {/* sail */}
      <path d="M 200 100 L 200 200 L 260 200 Q 244 150 200 100 Z" fill="rgba(249,242,227,.85)" filter="url(#lf-wash-edge)" />
      <path d="M 200 100 L 200 200 L 260 200 Q 244 150 200 100 Z" fill="none" stroke={INK} strokeWidth="2" filter="url(#lf-wobble)" />
    </SceneShell>
  )
}

function MeadowScene() {
  return (
    <SceneShell>
      <rect x="0" y="0" width="400" height="180" fill="rgba(232,220,180,.3)" filter="url(#lf-wash-edge)" />
      <path
        d="M 0 180 Q 200 168 400 180 L 400 300 L 0 300 Z"
        fill="rgba(124,154,98,.55)"
        filter="url(#lf-wash-edge)"
      />
      {/* flowers */}
      {[
        [80, 240],
        [140, 260],
        [220, 240],
        [300, 260],
        [340, 240],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="6" fill="rgba(239,200,92,.9)" stroke={INK} strokeWidth="1.4" filter="url(#lf-wobble)" />
          <path d={`M ${x} ${y + 6} L ${x} ${y + 24}`} stroke={INK} strokeWidth="1.4" filter="url(#lf-wobble)" />
        </g>
      ))}
      {/* sun */}
      <circle cx="340" cy="60" r="30" fill="rgba(243,196,83,.85)" filter="url(#lf-wash-edge)" />
    </SceneShell>
  )
}

// ---------- Registry ----------
// Multiple aliases can map to the same drawn scene — this catches the
// slight naming variance the pipeline emits ('bear-hollow', 'bearhollow',
// 'the-hollow', etc.). Everything else falls through to DrawnEndpaperArt.
type SceneComponent = () => React.ReactElement

const SCENE_REGISTRY: Record<string, SceneComponent> = {
  bridge: BridgeScene,
  'wobbly-bridge': BridgeScene,
  'rope-bridge': BridgeScene,

  web: WebScene,
  'web-bridge': WebScene,
  spider: WebScene,

  'bear-hollow': BearHollowScene,
  hollow: BearHollowScene,
  'tree-hollow': BearHollowScene,

  moon: MoonScene,
  'moon-window': MoonScene,
  night: MoonScene,
  stars: MoonScene,

  bus: BusScene,

  boat: BoatScene,
  'boat-of-leaves': BoatScene,
  'leaf-boat': BoatScene,

  meadow: MeadowScene,
  field: MeadowScene,
}

interface DrawnSceneProps {
  sceneKey?: string | null
  washKey?: WashKey
}

/** Dispatch on the page's semantic scene key. Unknown / null → drawn endpaper
 *  placeholder tinted with the story's wash. */
export function DrawnScene({ sceneKey, washKey }: DrawnSceneProps) {
  if (!sceneKey) return <DrawnEndpaperArt washKey={washKey} />
  const normalized = sceneKey.toLowerCase().trim()
  const Scene = SCENE_REGISTRY[normalized]
  if (!Scene) return <DrawnEndpaperArt washKey={washKey} />
  return <Scene />
}
