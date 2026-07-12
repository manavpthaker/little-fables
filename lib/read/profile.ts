// Little Fables v2.2 — child profile.
// Per docs/reference/azi-verse/azi-verse-app-architecture.md §3.4.
// Referenced from docs/aziverse-adoption.md item #4.

// PRIVACY INVARIANTS (v2.2)
// - No last names ever collected.
// - No photos, no cloud upload of profile data.
// - Profile stays local (localStorage). Sync happens only via the parent's
//   Supabase account and only if signed in — never a third party.

import { DEFAULT_UNIVERSE } from '@/lib/universe/azad-verse'
import { BUDDIES } from '@/lib/read/buddies'

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

// ---------- Creative guardrails (PRD R21) ----------
// Shapes what a kid can request when the story kitchen agent asks him for a
// story idea. Anything outside the sandbox is redirected in-fiction — never
// refused — so the flow stays warm.

export interface CreativeGuardrails {
  /** Parent-identified themes the kid can request (seeded from profile.interests + emotional themes). */
  themes: string[]
  allowedCast: {
    /** Universe canon character ids the kid can request (default: all Azi-Verse canon + buddies). */
    canonIds: string[]
    /** Free slots for novel characters ("wildcards" — e.g. Ollie the otter). Number of slots per creation. */
    wildcardSlots: number
  }
  allowedSettings: {
    canon: string[]        // universe settings (default: all Azi-Verse settings)
    anywhereImaginary: boolean  // toggle — if true, the kid can invent any place
  }
  maxCreationsPerDay: number    // default 2
  formats: {
    quick: boolean         // default true
    chapter: boolean       // default false
  }
}

/**
 * Seed default guardrails. Blended from the universe + kid's interests so the
 * kid can always request the things he's already interested in, plus the
 * emotional themes the content pipeline expects to explore.
 */
export const EMOTIONAL_THEMES: string[] = [
  'brave together',
  'trying again',
  'sharing',
  'sleep and wind-down',
  'big feelings',
  'kindness',
  'gratefulness',
  'flexible thinking',
]

export function defaultCreativeGuardrails(
  interests: string[] = DEFAULT_UNIVERSE.interests,
): CreativeGuardrails {
  // Blend the child's interests + the universe teachingGoals + emotional themes.
  const themeSet = new Set<string>()
  for (const it of interests) themeSet.add(it)
  for (const g of DEFAULT_UNIVERSE.teachingGoals) themeSet.add(g)
  for (const t of EMOTIONAL_THEMES) themeSet.add(t)

  // Canon cast = universe characters + buddy ids (as 'char_<id>' — matches the
  // ids used by the universe file for those buddies).
  const canonIds = new Set<string>()
  for (const c of DEFAULT_UNIVERSE.characters) canonIds.add(c.id)
  for (const b of BUDDIES) canonIds.add(`char_${b.id}`)

  return {
    themes: Array.from(themeSet),
    allowedCast: {
      canonIds: Array.from(canonIds),
      wildcardSlots: 1,
    },
    allowedSettings: {
      canon: DEFAULT_UNIVERSE.settings.map((s) => s.name),
      anywhereImaginary: false,
    },
    maxCreationsPerDay: 2,
    formats: { quick: true, chapter: false },
  }
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
  /**
   * PRD R21 — creative guardrails that shape what Azad can request in the
   * story kitchen. Optional so pre-v3 profiles remain valid; loadProfile()
   * hydrates a sensible default from interests + universe.
   */
  creativeGuardrails?: CreativeGuardrails
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
  creativeGuardrails: defaultCreativeGuardrails(),
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
    const merged: ChildProfile = {
      ...DEFAULT_PROFILE,
      ...parsed,
      languages: { ...DEFAULT_PROFILE.languages, ...(parsed.languages ?? {}) },
      contentPreferences: {
        ...DEFAULT_PROFILE.contentPreferences,
        ...(parsed.contentPreferences ?? {}),
      },
    }
    // Seed guardrails on first-encounter if absent — derived from the child's
    // current interests so it always reflects the actual profile shape.
    if (!parsed.creativeGuardrails) {
      merged.creativeGuardrails = defaultCreativeGuardrails(merged.interests)
    } else {
      // Deep-merge nested subfields so partial persisted shapes upgrade cleanly.
      const seeded = defaultCreativeGuardrails(merged.interests)
      merged.creativeGuardrails = {
        ...seeded,
        ...parsed.creativeGuardrails,
        allowedCast: {
          ...seeded.allowedCast,
          ...(parsed.creativeGuardrails.allowedCast ?? {}),
        },
        allowedSettings: {
          ...seeded.allowedSettings,
          ...(parsed.creativeGuardrails.allowedSettings ?? {}),
        },
        formats: {
          ...seeded.formats,
          ...(parsed.creativeGuardrails.formats ?? {}),
        },
      }
    }
    return merged
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
