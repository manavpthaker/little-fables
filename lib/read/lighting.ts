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
 *  art doesn't swap, the light on it does.
 *
 *  Vars produced:
 *  - `--light-pool`     : color for the warm floor pool on the rug
 *  - `--shadow-color`   : cool/warm shadow tint
 *  - `--light-sky`      : gradient painted into the window rect
 *  - `--light-ambient`  : full-room wash blended `multiply` — set boldly
 *                        enough that morning/midday/golden/dusk/night are
 *                        obviously different at a squint
 *  - `--sun-x/y`, `--moon-x/y` : positions inside the window frame (percent)
 *  - `--sun-opacity`, `--moon-opacity` : whether the disc is drawn
 *  - `--lantern-overlay` : indigo tint the lantern register lays over the
 *                          drawn art via mix-blend `multiply`
 *  - `--pool-opacity`    : intensity of the warm-gold lantern pools */
export function varsFor(k: LightingKeyframe): Record<string, string> {
  switch (k) {
    case 'dawn':
      return {
        '--light-pool': 'rgba(240, 190, 195, 0.22)',
        '--shadow-color': 'rgba(93, 106, 138, 0.34)',
        '--light-sky': 'linear-gradient(180deg, #F0BEC3 0%, #EFCCA0 60%, #F4EBD8 100%)',
        '--light-ambient': 'rgba(240, 190, 195, 0.24)',
        '--sun-x': '18%',
        '--sun-y': '78%',
        '--sun-opacity': '0.85',
        '--sun-color': '#F1A69A',
        '--moon-x': '80%',
        '--moon-y': '20%',
        '--moon-opacity': '0.15',
        '--lantern-overlay': 'rgba(34, 48, 74, 0)',
        '--pool-opacity': '0',
      }
    case 'morning':
      return {
        '--light-pool': 'rgba(239, 200, 92, 0.20)',
        '--shadow-color': 'rgba(93, 106, 138, 0.28)',
        '--light-sky': 'linear-gradient(180deg, #EFCCA0 0%, #F5DFB0 55%, #F4EBD8 100%)',
        '--light-ambient': 'rgba(250, 226, 165, 0.22)',
        '--sun-x': '32%',
        '--sun-y': '50%',
        '--sun-opacity': '0.95',
        '--sun-color': '#F3C453',
        '--moon-x': '90%',
        '--moon-y': '8%',
        '--moon-opacity': '0',
        '--lantern-overlay': 'rgba(34, 48, 74, 0)',
        '--pool-opacity': '0',
      }
    case 'midday':
      return {
        '--light-pool': 'rgba(255, 240, 200, 0.18)',
        '--shadow-color': 'rgba(93, 106, 138, 0.22)',
        '--light-sky': 'linear-gradient(180deg, #F6E4B5 0%, #F9F0D6 60%, #F4EBD8 100%)',
        '--light-ambient': 'rgba(255, 250, 230, 0.32)',
        '--sun-x': '50%',
        '--sun-y': '18%',
        '--sun-opacity': '1',
        '--sun-color': '#F8DE7F',
        '--moon-x': '10%',
        '--moon-y': '10%',
        '--moon-opacity': '0',
        '--lantern-overlay': 'rgba(34, 48, 74, 0)',
        '--pool-opacity': '0',
      }
    case 'golden':
      return {
        '--light-pool': 'rgba(226, 169, 59, 0.38)',
        '--shadow-color': 'rgba(91, 70, 55, 0.32)',
        '--light-sky': 'linear-gradient(180deg, #EBAB57 0%, #EDCA82 55%, #F4EBD8 100%)',
        '--light-ambient': 'rgba(226, 148, 60, 0.28)',
        '--sun-x': '72%',
        '--sun-y': '52%',
        '--sun-opacity': '0.95',
        '--sun-color': '#E29433',
        '--moon-x': '15%',
        '--moon-y': '15%',
        '--moon-opacity': '0',
        '--lantern-overlay': 'rgba(34, 48, 74, 0)',
        '--pool-opacity': '0.35',
      }
    case 'dusk':
      // v3.2 P2-2g — sun setting on the right, moon rising on the left, both
      // clearly visible so dusk reads as the moment they trade shifts. Sun
      // opacity bumped to 0.6 and moon to 0.85 so neither reads as a wash
      // artifact. Positions kept inside the window rect so `overflow: hidden`
      // never clips them.
      return {
        '--light-pool': 'rgba(243, 199, 122, 0.40)',
        '--shadow-color': 'rgba(34, 48, 74, 0.42)',
        '--light-sky': 'linear-gradient(180deg, #4E5D7E 0%, #A46F5F 55%, #E8B87A 100%)',
        '--light-ambient': 'linear-gradient(180deg, rgba(78, 93, 126, 0.35), rgba(164, 111, 95, 0.22) 60%, rgba(232, 184, 122, 0.16))',
        '--sun-x': '78%',
        '--sun-y': '74%',
        '--sun-opacity': '0.6',
        '--sun-color': '#D97757',
        '--moon-x': '28%',
        '--moon-y': '32%',
        '--moon-opacity': '0.85',
        '--moon-color': '#EFE6C2',
        '--lantern-overlay': 'rgba(34, 48, 74, 0.28)',
        '--pool-opacity': '0.6',
      }
    case 'night':
    default:
      return {
        '--light-pool': 'rgba(243, 199, 122, 0.55)',
        '--shadow-color': 'rgba(11, 18, 34, 0.55)',
        '--light-sky': 'linear-gradient(180deg, #16223A 0%, #22304A 60%, #2A3856 100%)',
        '--light-ambient': 'rgba(22, 34, 58, 0.55)',
        '--sun-x': '95%',
        '--sun-y': '95%',
        '--sun-opacity': '0',
        '--sun-color': '#E29433',
        '--moon-x': '58%',
        '--moon-y': '30%',
        '--moon-opacity': '0.95',
        '--moon-color': '#EFE6C2',
        '--lantern-overlay': 'rgba(22, 34, 58, 0.48)',
        '--pool-opacity': '0.85',
      }
  }
}
