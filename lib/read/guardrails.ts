// Little Fables v3 — creative guardrails runtime.
// Helpers consumed by the story kitchen agent and the voice-agency intent
// layer. Pure functions where possible so both the client and any downstream
// review pipeline can share behavior.
//
// The guardrails themselves live on the ChildProfile (PRD R21) and are edited
// in Parent Corner → Profile tab. This module reads them at call time and
// exposes:
//   loadGuardrails()          — the current guardrail bundle
//   isCastAllowed(name)       — kid-facing name OR canon id → boolean
//   isSettingAllowed(name)    — is this setting in-bounds?
//   isThemeAllowed(theme)     — is this theme in-bounds?
//   nearestInBoundsCast(want) — best in-bounds substitute for an ask like
//                               "zombie" or "monster"
//   remainingCreations(cap?)  — { remaining, cap, usedToday } for the day
//   evaluateSeed(seed)        — { ok, redirects, reasons } — one-shot pass
//                               used by the story kitchen to decide whether
//                               to accept the child's seed as-is or to nudge.
//
// Design intent: nothing here refuses. Redirects are what the buddy speaks
// aloud in-fiction — "Zombies aren't in our world — but Peter is the sneakiest
// trickster." The kitchen composes the actual line.

import { loadProfile, defaultCreativeGuardrails, type CreativeGuardrails } from '@/lib/read/profile'
import { loadUniverse } from '@/lib/universe/azad-verse'

export type { CreativeGuardrails }

export interface RemainingCreationsResult {
  remaining: number
  cap: number
  usedToday: number
}

/**
 * Return the currently-configured guardrail bundle. Falls back to sensible
 * defaults if the profile hasn't been hydrated with one yet (older stored
 * profiles from before R21 landed).
 */
export function loadGuardrails(): CreativeGuardrails {
  const p = loadProfile()
  return p.creativeGuardrails ?? defaultCreativeGuardrails(p.interests)
}

// ---------- normalization helpers ----------

function norm(v: string): string {
  return v.trim().toLowerCase()
}

/** Universe character index — id, name, species (as flat map of {token → id}). */
function characterIndex(): Map<string, { id: string; name: string }> {
  const map = new Map<string, { id: string; name: string }>()
  const universe = loadUniverse()
  for (const c of universe.characters) {
    const entry = { id: c.id, name: c.name }
    map.set(norm(c.id), entry)
    map.set(norm(c.name), entry)
    if (c.species) map.set(norm(c.species), entry)
  }
  return map
}

// ---------- allowed checks ----------

export function isCastAllowed(nameOrId: string): boolean {
  if (!nameOrId) return false
  const g = loadGuardrails()
  const idx = characterIndex()
  const key = norm(nameOrId)
  const hit = idx.get(key)
  const canonId = hit?.id ?? nameOrId
  return g.allowedCast.canonIds.includes(canonId)
}

export function isSettingAllowed(name: string): boolean {
  if (!name) return false
  const g = loadGuardrails()
  if (g.allowedSettings.anywhereImaginary) return true
  const key = norm(name)
  return g.allowedSettings.canon.some((s) => norm(s) === key)
}

export function isThemeAllowed(theme: string): boolean {
  if (!theme) return false
  const g = loadGuardrails()
  const key = norm(theme)
  return g.themes.some((t) => norm(t) === key || norm(t).includes(key) || key.includes(norm(t)))
}

// ---------- nearest in-bounds cast ----------

/**
 * Best-effort keyword → canon character map. Used when the child asks for
 * something out-of-world (zombie / dragon / monster). The buddy will then
 * speak the redirect in-fiction — "Zombies aren't in our world — but Peter is
 * the sneakiest trickster."
 *
 * Keys are lowercased search tokens; values point at a canon character id.
 * We pick characters that are almost always in the default guardrails.
 */
const REDIRECT_KEYWORDS: Array<{ tokens: string[]; targetId: string }> = [
  { tokens: ['zombie', 'monster', 'ghost', 'ghoul', 'goblin', 'witch', 'vampire'], targetId: 'char_peter' },
  { tokens: ['dragon', 'giant', 't-rex', 'trex', 'godzilla', 'kaiju'], targetId: 'char_boulder' },
  { tokens: ['slow', 'sleepy', 'gentle', 'calm', 'quiet'], targetId: 'char_slothie' },
  { tokens: ['fast', 'zoom', 'speedy', 'racer', 'race', 'zoomy'], targetId: 'char_miko' },
  { tokens: ['builder', 'strong', 'big', 'tough'], targetId: 'char_boulder' },
  { tokens: ['fox', 'trickster', 'sly', 'sneaky', 'prankster'], targetId: 'char_peter' },
  { tokens: ['spider', 'web', 'planner', 'inventor'], targetId: 'char_tara' },
  { tokens: ['bear', 'cozy', 'reading', 'story-time', 'brave'], targetId: 'char_bramble' },
  { tokens: ['musician', 'music', 'drum', 'song', 'sing', 'guitar', 'noisy', 'loud'], targetId: 'char_clappy' },
  { tokens: ['fisher', 'fisherman', 'fish', 'boat', 'dock', 'worry', 'worried', 'planner'], targetId: 'char_monkie' },
  { tokens: ['cat', 'kitten', 'kitty', 'leader', 'roll call'], targetId: 'char_jujy' },
  { tokens: ['dreamy', 'scout', 'forgetful'], targetId: 'char_dory' },
  { tokens: ['bus', 'driver', 'panda', 'guide'], targetId: 'char_pandies' },
  { tokens: ['farmer', 'bee', 'bees', 'honey', 'garden'], targetId: 'char_pooh' },
  { tokens: ['otter', 'water', 'river', 'splash', 'puddle'], targetId: 'char_otter' },
  { tokens: ['dinosaur', 'dino', 'shy', 'sturdy'], targetId: 'char_anky' },
  { tokens: ['motorcycle', 'moto', 'bike', 'vroom', 'nonliving'], targetId: 'char_moto' },
  { tokens: ['rock', 'stone', 'still', 'listener'], targetId: 'char_rocky' },
  { tokens: ['rocket', 'space', 'countdown', 'launch'], targetId: 'char_rusty' },
]

export function nearestInBoundsCast(query: string): { id: string; name: string } | null {
  if (!query) return null
  const g = loadGuardrails()
  const idx = characterIndex()
  const key = norm(query)

  // 1. Direct hit — the query already resolves to a canon character.
  const direct = idx.get(key)
  if (direct && g.allowedCast.canonIds.includes(direct.id)) {
    return direct
  }

  // 2. Keyword redirect map.
  for (const rule of REDIRECT_KEYWORDS) {
    if (rule.tokens.some((tok) => key.includes(tok))) {
      const universe = loadUniverse()
      const target = universe.characters.find((c) => c.id === rule.targetId)
      if (target && g.allowedCast.canonIds.includes(target.id)) {
        return { id: target.id, name: target.name }
      }
    }
  }

  // 3. Loose substring against character names as a last resort.
  const universe = loadUniverse()
  for (const c of universe.characters) {
    if (!g.allowedCast.canonIds.includes(c.id)) continue
    const n = norm(c.name)
    if (n.includes(key) || key.includes(n)) {
      return { id: c.id, name: c.name }
    }
  }

  return null
}

// ---------- remaining creations for the day ----------

/**
 * Read today's creation count from the kid-creations store. Dynamic import so
 * this module compiles even if the store hasn't been generated yet (Agent A
 * owns the file). Degrades gracefully — if the store is unreachable we return
 * `remaining: cap` so the flow is never blocked by an infra hiccup.
 */
function readUsedToday(): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/lib/read/kid-creations') as {
      todaysCount?: () => number
    }
    if (typeof mod.todaysCount === 'function') return mod.todaysCount()
  } catch {
    /* fall through — degrade gracefully */
  }
  return 0
}

export function remainingCreations(cap?: number): RemainingCreationsResult {
  const g = loadGuardrails()
  const effectiveCap = typeof cap === 'number' && cap > 0 ? cap : g.maxCreationsPerDay
  const usedToday = readUsedToday()
  const remaining = Math.max(0, effectiveCap - usedToday)
  return { remaining, cap: effectiveCap, usedToday }
}

// ---------- evaluateSeed — one-shot pass ----------

export interface EvaluateSeedResult {
  ok: boolean
  redirects?: {
    cast?: { requested: string; suggested: { id: string; name: string } | null }
    setting?: { requested: string }
    theme?: { requested: string }
  }
  reasons?: string[]
}

/**
 * Best-effort keyword pass over the child's seed text. This does NOT parse
 * intent — the voice-agency layer owns real intent — but it flags obvious
 * out-of-bounds asks so the buddy can offer a warm redirect without a round
 * trip to the model.
 */
export function evaluateSeed(seedText: string): EvaluateSeedResult {
  if (!seedText) return { ok: true }
  const raw = seedText.trim()
  if (!raw) return { ok: true }
  const text = norm(raw)

  const reasons: string[] = []
  const redirects: EvaluateSeedResult['redirects'] = {}

  // 1. Flag out-of-bounds cast asks by scanning the redirect keyword table.
  for (const rule of REDIRECT_KEYWORDS) {
    for (const tok of rule.tokens) {
      if (text.includes(tok)) {
        // Only flag if the token itself isn't already an in-bounds character.
        const hit = characterIndex().get(tok)
        if (!hit || !isCastAllowed(hit.id)) {
          // But redirect keywords also cover in-bounds trait words — only add a
          // reason for the ones that read as clearly out-of-world.
          const OUT_OF_WORLD = new Set([
            'zombie', 'monster', 'ghost', 'ghoul', 'goblin', 'witch', 'vampire',
            'godzilla', 'kaiju', 'trex', 't-rex',
          ])
          if (OUT_OF_WORLD.has(tok)) {
            const suggested = nearestInBoundsCast(tok)
            redirects.cast = { requested: tok, suggested }
            reasons.push(`"${tok}" isn't in our world`)
          }
        }
        break
      }
    }
    if (redirects.cast) break
  }

  // 2. Flag settings the parent has excluded.
  const g = loadGuardrails()
  if (!g.allowedSettings.anywhereImaginary) {
    // We can only judge negatively when the seed names an explicit place. Do
    // not raise a reason if there's no place at all — that's fine.
    // (Left to the voice-agency layer for finer intent parsing.)
  }

  const ok = reasons.length === 0
  return ok ? { ok } : { ok, redirects, reasons }
}
