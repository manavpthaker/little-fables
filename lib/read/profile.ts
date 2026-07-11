// Little Fables v2.2 — child profile.
// Per docs/reference/azi-verse/azi-verse-app-architecture.md §3.4.
// Referenced from docs/aziverse-adoption.md item #4.

// PRIVACY INVARIANTS (v2.2)
// - No last names ever collected.
// - No photos, no cloud upload of profile data.
// - Profile stays local (localStorage). Sync happens only via the parent's
//   Supabase account and only if signed in — never a third party.

import { DEFAULT_UNIVERSE } from '@/lib/universe/azad-verse'

export type CurrentBand = '0-3' | '4-8-early' | '4-8-late' | '7-10'

export interface ContentPreferences {
  /**
   * Words the story engine will avoid. The Spanish-endearment / heritage-word
   * removal toggle lives here as a per-profile preference, NOT a universe rule.
   */
  excludeTerms: string[]
  toneCalibration?: 'lighter-playful' | 'gentle-serious' | 'balanced'
  /** Whether "this is a story about…" framing devices are allowed. Default false. */
  framingDevices?: boolean
}

export interface ChildProfile {
  id: string
  /** First name only. NEVER a last name — privacy invariant. */
  firstNameOnly: string
  /** 'YYYY-MM' — month-precision birth date, no exact day. */
  birthMonth: string
  currentBand: CurrentBand
  languages: {
    /** Spoken at home. */
    home: string[]
    /** Family heritage languages (not necessarily spoken daily). */
    heritage: string[]
    /** Languages the family wants more of this season. */
    exposureGoals: string[]
  }
  interests: string[]
  currentChallenges: string[]
  /** Physical comfort objects (plush names). Stories may reference them. */
  comfortObjects: string[]
  contentPreferences: ContentPreferences
}

const STORAGE_KEY = 'lf-profile-v2'

export const DEFAULT_PROFILE: ChildProfile = {
  id: 'child_azi',
  firstNameOnly: 'Azad',
  birthMonth: '2022-04',
  currentBand: '4-8-early',
  languages: {
    home: ['en', 'es'],
    heritage: ['hi', 'gu'],
    exposureGoals: ['hi'],
  },
  interests: DEFAULT_UNIVERSE.interests.slice(),
  currentChallenges: [
    'sleep transitions',
    'physical impulse control',
  ],
  comfortObjects: ['Slothie', 'Jujy'],
  contentPreferences: {
    excludeTerms: [],
    toneCalibration: 'balanced',
    framingDevices: false,
  },
}

/**
 * Load the profile from localStorage. First-read seeds `interests` from
 * DEFAULT_UNIVERSE.interests (no persist — persist happens on the next save).
 */
export function loadProfile(): ChildProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // First read — seed interests from the universe, keep everything else default.
      return {
        ...DEFAULT_PROFILE,
        interests: DEFAULT_UNIVERSE.interests.length
          ? DEFAULT_UNIVERSE.interests.slice()
          : DEFAULT_PROFILE.interests,
      }
    }
    const parsed = JSON.parse(raw) as Partial<ChildProfile>
    // Shallow merge with deep fallbacks for nested objects.
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      languages: { ...DEFAULT_PROFILE.languages, ...(parsed.languages ?? {}) },
      contentPreferences: {
        ...DEFAULT_PROFILE.contentPreferences,
        ...(parsed.contentPreferences ?? {}),
      },
    }
  } catch {
    return DEFAULT_PROFILE
  }
}

export function saveProfile(p: ChildProfile): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    /* ignore quota / private-mode failures */
  }
}

export function resetProfile(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}
