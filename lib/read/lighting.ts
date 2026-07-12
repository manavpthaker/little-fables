// v3 Drawn Room — A2 clock lighting.
// The room is lit by the device's actual time of day. Six keyframe states
// interpolated smoothly over CSS custom properties driving the drawn scene:
//
//   dawn (5:00-6:30)      pale rose, long cool shadows
//   morning (6:30-11:00)  clear butter light
//   midday (11:00-14:30)  high white-warm, short shadows
//   golden (14:30-18:00)  deep marigold pools (the north-star state)
//   dusk (18:00-19:30)    indigo rises, lamp warms on (lantern register begins)
//   night (19:30-5:00)    full lantern: moon in window, gold pools
//
// Interpolation runs at most once per minute (battery-friendly). Reduced-motion
// snaps between keyframes on scene entry only.
//
// Dev override: `?clock=19:30` in the URL OR localStorage `lf-clock-override`.

export type LightingKeyframe = 'dawn' | 'morning' | 'midday' | 'golden' | 'dusk' | 'night'

interface LightingState {
  keyframe: LightingKeyframe
  /** Data-register value to apply on the root — 'lantern' from dusk onward, else nothing. */
  register: 'day' | 'lantern'
  /** CSS custom property values for `--light-pool`, `--shadow-color`, `--light-sky`,
   *  `--light-ambient` — the drawn art doesn't swap, the light on it does. */
  vars: Record<string, string>
}

// Seasonal (northern-hemisphere-tilted) sunrise/sunset by month, in decimal
// hours. Close-enough for a preschool app; no location permission needed.
const SUNRISE_BY_MONTH = [7.5, 7.0, 6.5, 6.0, 5.5, 5.3, 5.5, 6.0, 6.5, 7.0, 7.3, 7.5]
const SUNSET_BY_MONTH  = [16.7, 17.3, 18.0, 18.7, 19.3, 19.8, 19.7, 19.2, 18.4, 17.5, 16.7, 16.4]

function monthOf(now: Date): number {
  return now.getMonth() // 0-11
}

function decimalHour(now: Date): number {
  return now.getHours() + now.getMinutes() / 60
}

function clockOverride(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const url = new URL(window.location.href)
    const q = url.searchParams.get('clock')
    const ls = window.localStorage.getItem('lf-clock-override')
    const raw = q ?? ls
    if (!raw) return null
    const [h, m] = raw.split(':').map((s) => parseInt(s, 10))
    if (Number.isNaN(h)) return null
    return h + (Number.isFinite(m) ? m : 0) / 60
  } catch {
    return null
  }
}

/** Compute the current lighting state from the clock. */
export function currentLighting(now: Date = new Date()): LightingState {
  const override = clockOverride()
  const h = override ?? decimalHour(now)
  const m = monthOf(now)
  const sunrise = SUNRISE_BY_MONTH[m]
  const sunset = SUNSET_BY_MONTH[m]

  // Keyframe windows relative to sunrise/sunset — the app "knows" what dawn
  // and dusk feel like on the given month.
  const dawnEnd    = sunrise + 1.0
  const morningEnd = 11.0
  const middayEnd  = 14.5
  const goldenEnd  = sunset - 0.5
  const duskEnd    = sunset + 1.5

  let keyframe: LightingKeyframe
  if (h < sunrise) keyframe = 'night'
  else if (h < dawnEnd) keyframe = 'dawn'
  else if (h < morningEnd) keyframe = 'morning'
  else if (h < middayEnd) keyframe = 'midday'
  else if (h < goldenEnd) keyframe = 'golden'
  else if (h < duskEnd) keyframe = 'dusk'
  else keyframe = 'night'

  return {
    keyframe,
    register: keyframe === 'dusk' || keyframe === 'night' ? 'lantern' : 'day',
    vars: varsFor(keyframe),
  }
}

/** CSS variables for a given keyframe. Applied to the room root; the drawn
 *  art doesn't swap, the light on it does. */
export function varsFor(k: LightingKeyframe): Record<string, string> {
  switch (k) {
    case 'dawn':
      return {
        '--light-pool': 'rgba(240, 190, 195, 0.20)',
        '--shadow-color': 'rgba(93, 106, 138, 0.34)',
        '--light-sky': 'linear-gradient(180deg, #F0BEC3 0%, #EFCCA0 60%, #F4EBD8 100%)',
        '--light-ambient': 'linear-gradient(180deg, rgba(240,190,195,0.10), transparent 40%)',
      }
    case 'morning':
      return {
        '--light-pool': 'rgba(239, 200, 92, 0.16)',
        '--shadow-color': 'rgba(93, 106, 138, 0.28)',
        '--light-sky': 'linear-gradient(180deg, #EFCCA0 0%, #F5DFB0 55%, #F4EBD8 100%)',
        '--light-ambient': 'transparent',
      }
    case 'midday':
      return {
        '--light-pool': 'rgba(239, 218, 168, 0.14)',
        '--shadow-color': 'rgba(93, 106, 138, 0.22)',
        '--light-sky': 'linear-gradient(180deg, #F6E4B5 0%, #F9F0D6 60%, #F4EBD8 100%)',
        '--light-ambient': 'transparent',
      }
    case 'golden':
      return {
        '--light-pool': 'rgba(226, 169, 59, 0.32)',
        '--shadow-color': 'rgba(91, 70, 55, 0.32)',
        '--light-sky': 'linear-gradient(180deg, #EBAB57 0%, #EDCA82 55%, #F4EBD8 100%)',
        '--light-ambient': 'linear-gradient(180deg, rgba(226,169,59,0.10), transparent 55%)',
      }
    case 'dusk':
      return {
        '--light-pool': 'rgba(243, 199, 122, 0.34)',
        '--shadow-color': 'rgba(34, 48, 74, 0.42)',
        '--light-sky': 'linear-gradient(180deg, #4E5D7E 0%, #A46F5F 55%, #E8B87A 100%)',
        '--light-ambient': 'linear-gradient(180deg, rgba(34,48,74,0.12), transparent 50%)',
      }
    case 'night':
    default:
      return {
        '--light-pool': 'rgba(243, 199, 122, 0.44)',
        '--shadow-color': 'rgba(11, 18, 34, 0.55)',
        '--light-sky': 'linear-gradient(180deg, #16223A 0%, #22304A 60%, #2A3856 100%)',
        '--light-ambient': 'linear-gradient(180deg, rgba(11,18,34,0.30), transparent 55%)',
      }
  }
}
