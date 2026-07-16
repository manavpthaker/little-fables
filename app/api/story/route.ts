// Little Fables v2.2 story engine.
//
// Modes:
//   - "start"    → generate a quick 1-chapter Book OR the first chapter of a chapter book.
//   - "chapter"  → generate the next chapter given bookContext + worldState.
//   - "continue" → resolve a within-chapter branch given the child's choice
//                  (and optional freeform childIdea for co-authorship).
//
// v2.2 QA pipeline (docs/aziverse-adoption.md#1 + arch doc §2.5):
//   Stage 0 — DETERMINISTIC pre-checks (no LLM):
//     • band word count · heritage-word density · excludeTerms
//     • fails feed straight back into a regenerate (max 2 attempts)
//   Stage 1 — HARD GATES (single Haiku call):
//     • character consistency vs canon · cultural sensitivity
//     • age-developmental match · cultural element accuracy
//     • any fail → concatenated notes → regenerate (max 2 total attempts)
//   Stage 2 — SOFT SCORING (single Haiku call):
//     • weighted 0-10 per criterion using universe.scoringWeights
//     • score < SHIP_GATE_MIN → ONE revision pass
//
// The full qaRecord is attached to every response. Judge unavailability
// degrades softly: qaRecord.notes = 'judge unavailable', status routed to
// 'needs-review' via the response body, story still returned.
//
// v2.2 prompt (item 2): 7-step embodiment assembly in the doc's exact order.
// Each step gets an explicit [STEP N: …] label so the judge (and future
// debugging) can point at which step was violated.
//
// SKIP_RUBRIC=1 → dev bypass: skip Stage 1 + Stage 2 (deterministic checks
// still run because they're free).

import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type {
  Chapter,
  ChoiceBlock,
  ChoiceOption,
  GenerateRequest,
  GenerateResponse,
  KidInterview,
  Page,
  QaHardGateResult,
  QaRecord,
  QaSoftBreakdown,
  SkillTag,
  VocabWord,
  WashKey,
  WildcardCharacter,
} from '@/types/story'
import {
  SKILL_TAXONOMY,
  isValidSkillId,
  mapLegacyGoal,
  skillsForBand,
  type Band,
  type SkillNode,
} from '@/lib/read/skills'

export const runtime = 'nodejs'
// Worst case is two full generation attempts (deterministic-precheck or
// hard-gate retry) plus a judge call per attempt — 90s produced real 504s in
// production. The art routes already run at 300 on this plan.
export const maxDuration = 300

const STORY_MODEL = process.env.STORY_MODEL || 'claude-sonnet-4-6'
const JUDGE_MODEL = process.env.JUDGE_MODEL || 'claude-haiku-4-5-20251001'
const SHIP_GATE_MIN = Number(process.env.SHIP_GATE_MIN ?? '90')
const SKIP_RUBRIC = process.env.SKIP_RUBRIC === '1'

const API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

// ---------- Reference doc loader ------------------------------------------
// Read the canon docs once per process. Used as fallbacks when the universe
// config doesn't carry an explicit narratorIdentity or skill-observability
// snippet. The 7-step prompt assembly is now the primary carrier of intent;
// these are backup context, not the payload itself.

const REFERENCE_ROOT = join(process.cwd(), 'docs', 'reference', 'azi-verse')

interface ReferenceBundle {
  universeGuide: string
  storyInstructions: string
  futureSkills: string
  rubric: string
}

let CACHED_REFERENCE: ReferenceBundle | null = null

function readRef(name: string, maxChars: number): string {
  try {
    const path = join(REFERENCE_ROOT, name)
    if (!existsSync(path)) return ''
    const txt = readFileSync(path, 'utf8')
    if (txt.length <= maxChars) return txt
    return txt.slice(0, maxChars) + '\n\n[…truncated for prompt budget…]'
  } catch (e) {
    console.warn(`[story] failed to read reference ${name}:`, e)
    return ''
  }
}

function loadReference(): ReferenceBundle {
  if (CACHED_REFERENCE) return CACHED_REFERENCE
  CACHED_REFERENCE = {
    universeGuide: readRef('universe-guide.md', 12000),
    storyInstructions: readRef('story-creation-instructions.md', 6000),
    futureSkills: readRef('future-ready-skills.md', 5000),
    rubric: readRef('evaluation-rubric.md', 6000),
  }
  return CACHED_REFERENCE
}

// ---------- Wash + illustration helpers -----------------------------------
const VALID_WASHES: WashKey[] = [
  'canyon',
  'sunset',
  'meadow',
  'lilac',
  'blush',
  'river',
  'snow',
  'honey',
]

function coerceWash(v: unknown): WashKey | undefined {
  if (typeof v !== 'string') return undefined
  const low = v.toLowerCase() as WashKey
  return (VALID_WASHES as string[]).includes(low) ? low : undefined
}

// ---------- Universe & profile helpers ------------------------------------
// The universe object is passed loosely-typed on the request. We read only
// the fields we need and tolerate them being absent — Agent B is landing
// character schema upgrades and profile module separately.

interface UniverseView {
  raw: Record<string, unknown>
  narratorIdentity?: string
  hardRules?: string[]
  scoringWeights?: Partial<QaSoftBreakdown> & { [k: string]: number }
  culturalConfig?: {
    languages?: string[]
    densityCap?: number
    cultures?: string[]
    codeSwitchingRules?: string
  }
  characters: CharacterSpec[]
  settings: unknown[]
  heritageWords: string[]
}

interface CharacterSpec {
  id?: string
  name: string
  role?: string
  traits?: string[]
  speechPatterns?: string[]
  canonRules?: string[]
  relationships?: unknown[]
  roleByBand?: Record<string, string>
  visualAnchors?: string[]
  /** Fallback fields from the legacy Companion shape. */
  emoji?: string
  personality?: string
  loves?: string
  catchphrase?: string
}

function readUniverse(raw: unknown): UniverseView {
  const u = (raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}) as Record<string, unknown>

  const chars: CharacterSpec[] = []
  const charArr = Array.isArray(u.characters) ? (u.characters as unknown[]) : Array.isArray(u.companions) ? (u.companions as unknown[]) : []
  for (const c of charArr) {
    if (!c || typeof c !== 'object') continue
    const co = c as Record<string, unknown>
    if (typeof co.name !== 'string') continue
    chars.push({
      id: typeof co.id === 'string' ? co.id : undefined,
      name: co.name,
      role: typeof co.role === 'string' ? co.role : undefined,
      traits: Array.isArray(co.traits) ? (co.traits as unknown[]).filter((x): x is string => typeof x === 'string') : undefined,
      speechPatterns: Array.isArray(co.speechPatterns) ? (co.speechPatterns as unknown[]).filter((x): x is string => typeof x === 'string') : undefined,
      canonRules: Array.isArray(co.canonRules) ? (co.canonRules as unknown[]).filter((x): x is string => typeof x === 'string') : undefined,
      relationships: Array.isArray(co.relationships) ? (co.relationships as unknown[]) : undefined,
      roleByBand: co.roleByBand && typeof co.roleByBand === 'object' ? (co.roleByBand as Record<string, string>) : undefined,
      visualAnchors: Array.isArray(co.visualAnchors) ? (co.visualAnchors as unknown[]).filter((x): x is string => typeof x === 'string') : undefined,
      emoji: typeof co.emoji === 'string' ? co.emoji : undefined,
      personality: typeof co.personality === 'string' ? co.personality : undefined,
      loves: typeof co.loves === 'string' ? co.loves : undefined,
      catchphrase: typeof co.catchphrase === 'string' ? co.catchphrase : undefined,
    })
  }

  const heritageWords: string[] = []
  const culture = u.culture as Record<string, unknown> | undefined
  if (culture && Array.isArray(culture.words)) {
    for (const w of culture.words as unknown[]) {
      if (w && typeof w === 'object' && typeof (w as Record<string, unknown>).term === 'string') {
        heritageWords.push((w as { term: string }).term)
      }
    }
  }

  const cc = u.culturalConfig as Record<string, unknown> | undefined
  const culturalConfig = cc
    ? {
        languages: Array.isArray(cc.languages) ? (cc.languages as unknown[]).filter((x): x is string => typeof x === 'string') : undefined,
        densityCap: typeof cc.densityCap === 'number' ? cc.densityCap : undefined,
        cultures: Array.isArray(cc.cultures) ? (cc.cultures as unknown[]).filter((x): x is string => typeof x === 'string') : undefined,
        codeSwitchingRules: typeof cc.codeSwitchingRules === 'string' ? cc.codeSwitchingRules : undefined,
      }
    : culture
    ? {
        languages: Array.isArray(culture.languages)
          ? (culture.languages as unknown[]).filter((x): x is string => typeof x === 'string')
          : undefined,
        densityCap: undefined,
        cultures: undefined,
        codeSwitchingRules: typeof culture.notes === 'string' ? (culture.notes as string) : undefined,
      }
    : undefined

  return {
    raw: u,
    narratorIdentity: typeof u.narratorIdentity === 'string' ? u.narratorIdentity : undefined,
    hardRules: Array.isArray(u.hardRules)
      ? (u.hardRules as unknown[]).filter((x): x is string => typeof x === 'string')
      : undefined,
    scoringWeights: u.scoringWeights && typeof u.scoringWeights === 'object'
      ? (u.scoringWeights as Record<string, number>)
      : undefined,
    culturalConfig,
    characters: chars,
    settings: Array.isArray(u.settings) ? (u.settings as unknown[]) : [],
    heritageWords,
  }
}

// Optional per-profile preferences. lib/read/profile isn't in the repo yet
// (Agent B owns it) so we dynamic-import defensively and treat any failure
// as "no profile — empty preferences."
interface ChildProfileView {
  currentBand?: Band | '4-8-early'
  languages?: { home?: string[]; heritage?: string[]; exposureGoals?: string[] }
  interests?: string[]
  currentChallenges?: string[]
  comfortObjects?: string[]
  contentPreferences?: {
    excludeTerms?: string[]
    toneCalibration?: string
    framingDevices?: boolean
  }
}

async function tryLoadProfile(): Promise<ChildProfileView | null> {
  try {
    // Dynamic import so the build tolerates the module being absent while
    // Agent B is still landing it. The specifier is built at runtime so the
    // TS resolver doesn't try to check the module path at compile time.
    const specifier = ['@', 'lib', 'read', 'profile'].join('/').replace('@/', '@/')
    const mod: unknown = await import(/* webpackIgnore: true */ specifier).catch(() => null)
    if (!mod || typeof mod !== 'object') return null
    const m = mod as { loadProfile?: () => ChildProfileView | Promise<ChildProfileView> }
    if (typeof m.loadProfile !== 'function') return null
    const p = await m.loadProfile()
    return p && typeof p === 'object' ? p : null
  } catch (e) {
    console.warn('[story] profile module unavailable, defaulting to empty prefs:', e)
    return null
  }
}

// Normalize child band → deterministic band key we use everywhere.
function normalizeBand(b: string | undefined): Band {
  if (!b) return '4-8'
  if (b === '0-3') return '0-3'
  if (b === '7-10') return '7-10'
  // '4-8', '4-8-early', 'early-reader', etc. all bucket into '4-8'.
  return '4-8'
}

// ---------- 7-step embodiment prompt --------------------------------------
// The doc's mandated order (arch §2.4 + adoption item 2):
//   1 narrator identity → 2 child context → 3 universe payload →
//   4 cultural config → 5 band spec → 6 skill target → 7 optional seed
//
// Each step is prefixed with an explicit [STEP N: …] marker so the judge and
// downstream tooling can attribute violations to the step that was skipped.

interface PromptBundle {
  system: string
  band: Band
  targetSkill: SkillNode | null
  extraSkills: SkillNode[]
}

function stepOneNarrator(u: UniverseView, body: GenerateRequest): string {
  const ref = loadReference()
  const identity =
    u.narratorIdentity?.trim() ||
    // Fallback: first ~1200 chars of the universe-guide tone block.
    (ref.universeGuide
      ? ref.universeGuide.slice(0, 1400).replace(/\s+$/g, '')
      : 'You are the storyteller for the Azi-Verse — gentle, elevated, lyrical without being lofty, multicultural, deeply respectful of a small child\'s inner world.')
  // v3 R19: when the child helped write the story, the narrator's stance
  // shifts — they're rendering the child's authorial ideas faithfully, not
  // authoring alone.
  const isKidStory = ((body as unknown as { mode?: string }).mode) === 'kid-story'
  const kidNote = isKidStory
    ? `\n\nCO-AUTHORSHIP NOTE (v3 R19): The child helped write THIS specific story via the buddy interview. Their want / reason / obstacle from Step 7 are the load-bearing beats — you MUST render each one traceably in the finished text (this is R20's traceability AC). The child will re-read the story and needs to hear themselves in it. Do not sanitize away or paraphrase their idea into something safer; use their words and specifics.`
    : ''
  return `[STEP 1: NARRATOR IDENTITY]
${identity}${kidNote}
`
}

function stepTwoChild(profile: ChildProfileView | null, body: GenerateRequest, u: UniverseView, band: Band): string {
  // Pull best-effort child context. Falls back to universe.childName / universe.interests.
  const universeChild = {
    name: typeof u.raw.childName === 'string' ? u.raw.childName : undefined,
    interests: Array.isArray(u.raw.interests)
      ? (u.raw.interests as unknown[]).filter((x): x is string => typeof x === 'string')
      : [],
  }
  const ctx = {
    band,
    interests: profile?.interests ?? universeChild.interests,
    currentChallenges: profile?.currentChallenges ?? [],
    comfortObjects: profile?.comfortObjects ?? [],
    languages: profile?.languages ?? {
      home: u.culturalConfig?.languages ?? [],
      heritage: [],
      exposureGoals: [],
    },
    toneCalibration: profile?.contentPreferences?.toneCalibration ?? 'lighter-playful',
    excludeTerms: profile?.contentPreferences?.excludeTerms ?? [],
    framingDevices: profile?.contentPreferences?.framingDevices ?? false,
    childName: universeChild.name,
    seededHero: body.hero,
    seededPlace: body.place,
  }
  return `[STEP 2: CHILD PROFILE CONTEXT]
${JSON.stringify(ctx, null, 2)}
`
}

function stepThreeUniverse(u: UniverseView, focus: CharacterSpec[]): string {
  // Include only the characters selected for this story. Every field from
  // the v2.2 character schema that's present gets serialized. Settings are
  // trimmed to name+description if available.
  const characters = focus.map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    traits: c.traits,
    speechPatterns: c.speechPatterns,
    canonRules: c.canonRules,
    relationships: c.relationships,
    roleByBand: c.roleByBand,
    visualAnchors: c.visualAnchors,
    // Legacy fields — still useful signal for the model.
    emoji: c.emoji,
    personality: c.personality,
    loves: c.loves,
    catchphrase: c.catchphrase,
  }))
  const settings = u.settings.slice(0, 6) // don't blow the budget
  const rituals = Array.isArray(u.raw.rituals) ? u.raw.rituals : []
  const values = Array.isArray(u.raw.values) ? u.raw.values : []
  return `[STEP 3: UNIVERSE PAYLOAD]
Characters (canon-rule enforcement is a hard gate — write each character within its canonRules and speechPatterns):
${JSON.stringify(characters, null, 2)}

Settings:
${JSON.stringify(settings, null, 2)}

Rituals: ${JSON.stringify(rituals)}
Values:   ${JSON.stringify(values)}
`
}

function stepFourCultural(u: UniverseView, profile: ChildProfileView | null): string {
  const excludeTerms = profile?.contentPreferences?.excludeTerms ?? []
  const cfg = {
    languages: u.culturalConfig?.languages ?? [],
    cultures: u.culturalConfig?.cultures ?? [],
    densityCap: u.culturalConfig?.densityCap ?? 2, // per page — this is a hard gate
    codeSwitchingRules:
      u.culturalConfig?.codeSwitchingRules ??
      'Weave 0–2 heritage words per page. Context makes meaning clear — never dictionary translations, never italicized as "exotic". Never use a heritage word without narrative purpose.',
    heritageWordCatalog: u.heritageWords,
    excludeTerms,
    excludeGuidance:
      excludeTerms.length > 0
        ? `The child's profile REMOVES these terms — do not use any of them in any form: ${excludeTerms.join(', ')}`
        : 'No excluded terms for this profile.',
  }
  return `[STEP 4: CULTURAL CONFIG]
${JSON.stringify(cfg, null, 2)}
`
}

interface BandSpec {
  band: Band
  wordCountRange: [number, number]
  structure: string
  sentenceComplexity: string
  pausePointDensity: string
}

function bandSpec(band: Band): BandSpec {
  if (band === '0-3') {
    return {
      band,
      wordCountRange: [0, 100],
      structure: '3-part (setup · turn · comfort). Board-book cadence. One idea per page.',
      sentenceComplexity: 'Very short sentences, 3–6 words. Repetition welcomed. Sensory verbs.',
      pausePointDensity: '1 pause point per story is plenty.',
    }
  }
  if (band === '7-10') {
    return {
      band,
      wordCountRange: [4000, 10000],
      structure: '8-part (setup · inciting · rising · midpoint · setback · realization · climax · resolution).',
      sentenceComplexity: 'Chapter-book prose. Compound sentences fine. One-two star words per chapter.',
      pausePointDensity: '3–5 pause points across chapters.',
    }
  }
  return {
    band: '4-8',
    wordCountRange: [200, 2500],
    structure: '5-part (setup · rising · turn · resolution · comfort). Chapter books 3–5 chapters, 4–7 pages each.',
    sentenceComplexity: 'Short rhythmic sentences. Read-aloud friendly. 1–2 star words per chapter.',
    pausePointDensity: '1–3 pause points per chapter (asks and one choice).',
  }
}

function stepFiveBandSpec(band: Band): string {
  const spec = bandSpec(band)
  return `[STEP 5: BAND SPEC]
Band: ${spec.band}
Word-count target: ${spec.wordCountRange[0]}–${spec.wordCountRange[1]} words (across all chapters, cumulative).
Structure: ${spec.structure}
Sentence complexity: ${spec.sentenceComplexity}
Pause-point density: ${spec.pausePointDensity}
`
}

function stepSixSkill(band: Band, body: GenerateRequest): { block: string; target: SkillNode | null; extras: SkillNode[] } {
  // Prefer a legacy-goal mapped tag if the request seeded one; else pick a
  // rotating skill for the band. The model may return up to 3 tags total.
  const available = skillsForBand(band)
  if (available.length === 0) return { block: '[STEP 6: SKILL TARGET]\n(no skills catalog available)\n', target: null, extras: [] }

  let target: SkillNode | null = null

  // Seeded via body.idea keywords → mapLegacyGoal.
  const ideaBag = [body.idea, body.hero, body.place].filter(Boolean).join(' ').toLowerCase()
  if (ideaBag) {
    for (const goal of ideaBag.split(/[,.\s]+/)) {
      const mapped = mapLegacyGoal(goal)
      if (mapped && SKILL_TAXONOMY[mapped]) {
        target = SKILL_TAXONOMY[mapped]
        break
      }
    }
  }

  // Fallback: deterministic pick — hash bookContext id or the current minute
  // for variety across calls. This is a soft heuristic; parents can steer via
  // the child's currentChallenges over time.
  if (!target) {
    const seed = body.bookContext?.id ?? String(Date.now())
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
    target = available[h % available.length]
  }

  const related = target.relatedSkills?.map((id) => SKILL_TAXONOMY[id]).filter((x): x is SkillNode => !!x) ?? []
  const extras = related.slice(0, 2)

  const block = `[STEP 6: SKILL TARGET]
Primary SS id: ${target.id}
Cluster: ${target.cluster}
Label: ${target.label}
Age-band target (${band}): ${target.ageTargets[band]}
Teaching archetypes: ${target.teachingArchetypes.join(', ')}
Observable indicators (this is what "embedded, not preached" looks like — do these, don't lecture them):
${target.observableIndicators.map((i) => `  • ${i}`).join('\n')}

Related skills you MAY also touch (return 1–3 ids total in \`skillTags\`, primary first):
${extras.length ? extras.map((s) => `  ~ ${s.id} — ${s.label}`).join('\n') : '  (none)'}

Return your chosen skill tags on the story as: "skillTags": string[]  — SS-taxonomy ids only.
`
  return { block, target, extras }
}

function stepSevenSeed(body: GenerateRequest): string {
  const seeds: string[] = []
  if (body.idea) seeds.push(`Story idea from the family: "${body.idea}"`)
  if (body.childIdea) seeds.push(`Freeform child idea to weave in: "${body.childIdea}"`)
  if (body.hero) seeds.push(`Companion / hero focus: ${body.hero}`)
  if (body.place) seeds.push(`Setting focus: ${body.place}`)

  // v3: kid-story mode threads the KidInterview recipe as the primary seed.
  const kidExtra = (body as GenerateRequest & { interview?: KidInterview; originalSeed?: string }).interview
  const originalSeed = (body as GenerateRequest & { originalSeed?: string }).originalSeed
  if (kidExtra) {
    const recipe = kidExtra.recipe
    const lines: string[] = []
    lines.push(
      `THE CHILD (Azad, ~4 y/o) WROTE THIS STORY WITH THEIR BUDDY. Treat their want / reason / obstacle as sacred — every one of the three MUST be traceable in the finished story text. This is R20's core acceptance criterion.`,
    )
    if (originalSeed) lines.push(`Child's opening idea (verbatim): "${originalSeed}"`)
    if (recipe.want) lines.push(`WANT (traceable — the hero must clearly want this): ${recipe.want}`)
    if (recipe.reason) lines.push(`REASON (traceable — the story must reveal WHY they want it): ${recipe.reason}`)
    if (recipe.obstacle) lines.push(`OBSTACLE (traceable — this must be the "uh oh" moment): ${recipe.obstacle}`)
    if (recipe.extras && recipe.extras.length > 0) {
      lines.push(
        `Extras the child added — weave in where natural:\n${recipe.extras.map((e) => `  - ${e.slot}: ${e.value}`).join('\n')}`,
      )
    }
    if (kidExtra.readBack) lines.push(`How the buddy read the recipe back to the child: "${kidExtra.readBack}"`)
    seeds.push(lines.join('\n'))
  }

  if (seeds.length === 0) return `[STEP 7: OPTIONAL SEED]
(none — pick from the child's interests and delight us)
`
  return `[STEP 7: OPTIONAL SEED]
${seeds.join('\n')}
`
}

function outputShape(): string {
  return `======================================================================
OUTPUT SHAPE — STRUCTURED JSON, NO PROSE, NO FENCES
======================================================================
Return ONLY a JSON object matching this TypeScript shape:

{
  "title"?:        string,
  "coverEmoji"?:   string,
  "coverBg"?:      string,
  "by"?:           string,
  "wash"?:         WashKey,
  "chapters"?:     Chapter[],
  "pages"?:        Page[],            // quick-story only
  "vocab"?:        VocabWord[],       // 2-4 star words with kid meanings
  "teachingGoals"?:string[],
  "skillTags"?:    string[],          // SS-taxonomy ids, primary first (1-3)
  "charactersUsed"?:string[],         // universe character ids used in this story
  "mysteryWord"?:  { "word": string, "language": string, "meaning"?: string },
  "retellPrompts"?:string[],
  "hook"?:         { b: string, c: string } | string,
  "recapQuestion"?:string,
  "done":          boolean
}

WashKey ∈ ${VALID_WASHES.map((w) => `'${w}'`).join(' | ')}

Page = {
  "text": string, "wash"?: WashKey, "emojis"?: string[], "star"?: string,
  "fullBleed"?: boolean, "breathe"?: true,
  "ask"?: { "skill": string, "question": string, "praise": string, "hint": string, "kind"?: "wonder" },
  "choice"?: { "prompt": string, "options": [{ "label": string, "emoji": string }] }  // ≤1 per chapter
}

FORMAT RULES:
- One choice per chapter maximum. ≤2 choices total per book.
- done:true → last page MUST NOT contain a choice.
- Every page needs emojis (2-5) or img.
- Quick stories: return \`pages\` at the top level.
- Chapter books: return \`chapters\`. Chapter length: 4-7 pages. Chapter-end hook required.
- Star words on a page MUST appear in \`vocab\`.
- Do NOT include markdown fences. Do NOT prefix with prose. Output ONLY the JSON object.
`
}

function assemblePrompt(
  body: GenerateRequest,
  universe: UniverseView,
  profile: ChildProfileView | null,
  band: Band
): PromptBundle {
  // Choose focus characters. For v2.2, focus = all universe characters (small
  // cast). When Agent B ships explicit selection, we'll pass an id array here.
  const focus = universe.characters
  const skill = stepSixSkill(band, body)

  const hardRulesBlock = universe.hardRules && universe.hardRules.length > 0
    ? `======================================================================
UNIVERSE HARD RULES (enforced by the hard-gate judge)
======================================================================
${universe.hardRules.map((r) => `- ${r}`).join('\n')}
`
    : ''

  const system = [
    stepOneNarrator(universe, body),
    stepTwoChild(profile, body, universe, band),
    stepThreeUniverse(universe, focus),
    stepFourCultural(universe, profile),
    stepFiveBandSpec(band),
    skill.block,
    stepSevenSeed(body),
    hardRulesBlock,
    outputShape(),
  ]
    .filter((s) => s.trim().length > 0)
    .join('\n')

  return { system, band, targetSkill: skill.target, extraSkills: skill.extras }
}

// ---------- User prompts (mode-specific brief) ----------------------------
function briefLines(body: GenerateRequest): string[] {
  const parts: string[] = []
  if (body.hero) parts.push(`Companion / hero focus: ${body.hero}`)
  if (body.place) parts.push(`Setting: ${body.place}`)
  if (body.idea) parts.push(`The child's story idea, in their own words: "${body.idea}"`)
  if (body.by) parts.push(`Attribution on the cover: "${body.by}"`)
  return parts
}

function startPrompt(body: GenerateRequest): string {
  const parts = [
    `MODE: start`,
    `Task: Write a brand new story for this child.`,
    ``,
    `Decide format based on the child's idea and band:`,
    `- QUICK story = 1 chapter (5-7 pages). Return \`pages\` at the top level.`,
    `- CHAPTER book = 3-5 chapters. In "start" mode write ONLY chapter 1 (4-7 pages) and set done:false. Return \`chapters: [ chapter1 ]\`.`,
    ``,
    `If the child's idea is small ("a bee finds a friend") → quick.`,
    `If the idea is expansive or explicitly asks for a big adventure → chapter book.`,
    `When in doubt: quick.`,
    ``,
    `Brief:`,
    ...briefLines(body),
    !body.idea && !body.hero ? '- No specific idea from the child — pick an interest from the profile/universe and delight us.' : '',
  ].filter(Boolean)
  return parts.join('\n')
}

function chapterPrompt(body: GenerateRequest): string {
  const ctx = body.bookContext
  const priorSummary = ctx?.priorChapters
    ?.map((c, i) => `Chapter ${i + 1} — "${c.title}": ${c.summary}`)
    .join('\n') ?? ''
  const worldChoices = ctx?.worldState?.choiceLog
    ?.slice(-10)
    .map((c) => `- ${c.summary} ("${c.label}" in book ${c.bookId} ch.${c.chapter})`)
    .join('\n') ?? ''

  return [
    `MODE: chapter`,
    `Book: "${ctx?.title ?? '(unknown)'}" (${ctx?.kind ?? 'chapter'})`,
    `Task: Write the NEXT chapter. Return { chapters: [oneChapter], done: <true if final> }.`,
    ``,
    `Chapters so far:`,
    priorSummary || '(none — this is chapter 1)',
    ``,
    worldChoices ? `Recent world callbacks the buddy might reference:\n${worldChoices}` : '',
    ``,
    `Chapter should be 4-7 pages, ≤1 choice, end with a hook line and a recap question, star words drawn from the vocab pool. If final chapter, set done:true, drop the choice, include retellPrompts.`,
  ].filter(Boolean).join('\n')
}

function continuePrompt(body: GenerateRequest): string {
  const ctx = body.bookContext
  const priorSummary = ctx?.priorChapters
    ?.map((c, i) => `Chapter ${i + 1} — "${c.title}": ${c.summary}`)
    .join('\n') ?? ''

  const echo = body.childIdea
    ? `\nCO-AUTHORSHIP: The child spoke a freeform "your idea" continuation:\n  "${body.childIdea}"\n\nThe buddy MUST echo this idea back in their first line of dialogue after the choice — literally quote a phrase or paraphrase warmly so the child hears themselves in the story. Then weave the idea into what actually happens next. Do NOT ignore, sanitize away, or override the child's idea.`
    : ''

  return [
    `MODE: continue`,
    `Book: "${ctx?.title ?? '(unknown)'}"`,
    `Task: Resolve the branch the child just chose. Return the next 3-5 pages as chapters[0].pages. Include done:true if this resolves the whole story (≤2 choices per book), otherwise done:false.`,
    ``,
    `Chapters so far:`,
    priorSummary || '(none)',
    ``,
    `The child chose: "${body.choice ?? '(unknown)'}"`,
    echo,
    ``,
    `Rules: honor the choice meaningfully — it must change what happens, not just decorate the same outcome. Same chapter's wash. ≤1 choice per chapter (usually zero here). If done:true → retellPrompts included, no choice on the last page.`,
  ].filter(Boolean).join('\n')
}

function kidStoryPrompt(body: GenerateRequest): string {
  // The interview recipe is threaded through stepSevenSeed in the system
  // prompt. Here we tell the model the structural shape we want and reinforce
  // the traceability requirement.
  const kidExtra = body as GenerateRequest & {
    interview?: KidInterview
    originalSeed?: string
  }
  const recipe = kidExtra.interview?.recipe
  return [
    `MODE: kid-story`,
    `Task: The child (Azad, ~4 y/o) drove this story from the STORY KITCHEN interview. Write ONE quick story that faithfully renders their recipe.`,
    ``,
    `Format: QUICK story — 1 chapter of 5-7 pages. Return \`pages\` at the top level. \`done: true\`. No mid-story choice (the child already made the choices in the interview).`,
    ``,
    `Traceability (PRD R20 — MANDATORY):`,
    recipe?.want ? `  • WANT must be clearly visible: "${recipe.want}"` : '  • WANT must be clearly visible in the hero\'s motivation.',
    recipe?.reason ? `  • REASON must be shown (not just told) on at least one page: "${recipe.reason}"` : '  • REASON must be shown on at least one page.',
    recipe?.obstacle ? `  • OBSTACLE must be the "uh-oh" beat: "${recipe.obstacle}"` : '  • OBSTACLE must be the "uh-oh" beat.',
    ``,
    `Attribution: set the \`by\` field to "${body.by ?? 'Made by Azad'}".`,
    ``,
    `Voice: same warm Fable voice as always. Don't add a "this is a story about…" framing. Just tell the story the child dreamt up.`,
  ].filter(Boolean).join('\n')
}

function userPrompt(body: GenerateRequest): string {
  const mode = (body as unknown as { mode?: string }).mode
  if (mode === 'kid-story') return kidStoryPrompt(body)
  switch (body.mode) {
    case 'start':
      return startPrompt(body)
    case 'chapter':
      return chapterPrompt(body)
    case 'continue':
      return continuePrompt(body)
    default:
      return startPrompt(body)
  }
}

// ---------- Anthropic wire helpers ----------------------------------------
interface AnthropicMessagesResponse {
  content: { type: string; text?: string }[]
  stop_reason?: string
}

// System block optionally accepts an array of blocks so we can attach a
// cache_control marker to the big embodiment block. Anthropic's ephemeral
// cache pays off on regenerations.
async function callAnthropic(opts: {
  apiKey: string
  model: string
  system: string
  user: string
  maxTokens: number
  cacheSystem?: boolean
}): Promise<string> {
  const systemPayload = opts.cacheSystem
    ? [{ type: 'text', text: opts.system, cache_control: { type: 'ephemeral' } }]
    : opts.system

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': opts.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens,
      system: systemPayload,
      messages: [{ role: 'user', content: opts.user }],
    }),
  })

  if (!resp.ok) {
    const errText = await resp.text()
    console.error('[story] Anthropic error', opts.model, resp.status, errText)
    throw new Error(`Anthropic ${resp.status}: ${errText.slice(0, 400)}`)
  }
  const data = (await resp.json()) as AnthropicMessagesResponse
  return data.content?.find((c) => c.type === 'text')?.text ?? ''
}

// ---------- JSON extraction + validation ----------------------------------
function extractJSON(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in model output')
  }
  return JSON.parse(cleaned.slice(start, end + 1))
}

function coerceVocab(raw: unknown): VocabWord[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out: VocabWord[] = []
  for (const v of raw) {
    if (typeof v === 'string') {
      out.push({ word: v, meaning: '' })
    } else if (v && typeof v === 'object' && typeof (v as { word?: unknown }).word === 'string') {
      const o = v as { word: string; meaning?: unknown; say?: unknown; from?: unknown }
      out.push({
        word: o.word,
        meaning: typeof o.meaning === 'string' ? o.meaning : '',
        say: typeof o.say === 'string' ? o.say : undefined,
        from: typeof o.from === 'string' ? o.from : undefined,
      })
    }
  }
  return out
}

function coerceChoice(raw: unknown): ChoiceBlock | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const c = raw as { prompt?: unknown; options?: unknown }
  if (typeof c.prompt !== 'string' || !Array.isArray(c.options)) return undefined
  const options: ChoiceOption[] = []
  for (const o of c.options) {
    if (!o || typeof o !== 'object') continue
    const opt = o as { label?: unknown; emoji?: unknown; keywords?: unknown }
    if (typeof opt.label !== 'string' || typeof opt.emoji !== 'string') continue
    options.push({
      label: opt.label,
      emoji: opt.emoji,
      keywords: Array.isArray(opt.keywords)
        ? (opt.keywords as unknown[]).filter((k): k is string => typeof k === 'string')
        : undefined,
    })
  }
  if (options.length < 2) return undefined
  return { prompt: c.prompt, options: options.slice(0, 3) }
}

function coercePage(raw: unknown): Page | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>
  if (typeof p.text !== 'string' || !p.text.trim()) return null
  const page: Page = { text: p.text }
  const wash = coerceWash(p.wash)
  if (wash) page.wash = wash
  if (Array.isArray(p.emojis)) {
    page.emojis = (p.emojis as unknown[])
      .filter((e): e is string => typeof e === 'string')
      .slice(0, 5)
  }
  if (typeof p.img === 'string') page.img = p.img
  if (typeof p.slot === 'string') page.slot = p.slot
  if (typeof p.slotLabel === 'string') page.slotLabel = p.slotLabel
  if (p.fullBleed === true) page.fullBleed = true
  if (p.breathe === true) page.breathe = true
  if (typeof p.star === 'string') page.star = p.star

  const askRaw = p.ask
  if (askRaw && typeof askRaw === 'object') {
    const a = askRaw as Record<string, unknown>
    if (
      typeof a.skill === 'string' &&
      typeof a.question === 'string' &&
      typeof a.praise === 'string' &&
      typeof a.hint === 'string'
    ) {
      page.ask = {
        skill: a.skill,
        question: a.question,
        praise: a.praise,
        hint: a.hint,
        kind: a.kind === 'wonder' ? 'wonder' : undefined,
        answers: Array.isArray(a.answers)
          ? (a.answers as unknown[]).filter((x): x is string => typeof x === 'string')
          : undefined,
      }
    }
  }

  const choice = coerceChoice(p.choice)
  if (choice) page.choice = choice
  return page
}

function coerceChapter(raw: unknown): Chapter | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as Record<string, unknown>
  const pagesRaw = Array.isArray(c.pages) ? c.pages : []
  const pages = pagesRaw
    .map(coercePage)
    .filter((p): p is Page => p !== null)
  if (pages.length === 0) return null

  const chapter: Chapter = {
    title: typeof c.title === 'string' ? c.title : '',
    pages,
  }
  const wash = coerceWash(c.wash)
  if (wash) chapter.wash = wash
  if (typeof c.slot === 'string') chapter.slot = c.slot
  if (Array.isArray(c.emojis)) {
    chapter.emojis = (c.emojis as unknown[])
      .filter((e): e is string => typeof e === 'string')
      .slice(0, 5)
  }
  if (typeof c.recapQuestion === 'string') chapter.recapQuestion = c.recapQuestion
  const hook = c.hook
  if (typeof hook === 'string') {
    chapter.hook = hook
  } else if (hook && typeof hook === 'object') {
    const h = hook as { b?: unknown; c?: unknown }
    if (typeof h.b === 'string' && typeof h.c === 'string') {
      chapter.hook = { b: h.b, c: h.c }
    }
  }
  return chapter
}

class GenerationError extends Error {}

// v2.2 GenerateResponse — extends the base shape with qaRecord/skillTags/etc.
// We attach these fields on top of validate()'s baseline.
interface ResponseExtras {
  qaRecord?: QaRecord
  skillTags?: SkillTag[]
  charactersUsed?: string[]
  mysteryWord?: { word: string; language: string; meaning?: string }
  status?: 'complete' | 'needs-review'
  // v3 kid-story extras
  interview?: KidInterview
  wildcards?: WildcardCharacter[]
  author?: 'azad' | 'family'
}
type GenerateResponseV22 = GenerateResponse & ResponseExtras

function validate(rawRes: unknown, mode: GenerateRequest['mode']): GenerateResponseV22 {
  if (!rawRes || typeof rawRes !== 'object') {
    throw new GenerationError('Model output was not a JSON object')
  }
  const r = rawRes as Record<string, unknown>
  const out: GenerateResponseV22 = { done: r.done === true }

  if (typeof r.title === 'string') out.title = r.title
  if (typeof r.coverEmoji === 'string') out.coverEmoji = r.coverEmoji
  if (typeof r.coverBg === 'string') out.coverBg = r.coverBg
  if (typeof r.by === 'string') out.by = r.by
  const wash = coerceWash(r.wash)
  if (wash) out.wash = wash

  if (Array.isArray(r.chapters)) {
    const chapters = (r.chapters as unknown[])
      .map(coerceChapter)
      .filter((c): c is Chapter => c !== null)
    if (chapters.length > 0) out.chapters = chapters
  }

  if (Array.isArray(r.pages)) {
    const pages = (r.pages as unknown[])
      .map(coercePage)
      .filter((p): p is Page => p !== null)
    if (pages.length > 0) out.pages = pages
  }

  const vocab = coerceVocab(r.vocab)
  if (vocab) out.vocab = vocab
  if (Array.isArray(r.teachingGoals)) {
    out.teachingGoals = (r.teachingGoals as unknown[]).filter((g): g is string => typeof g === 'string')
  }
  if (Array.isArray(r.retellPrompts)) {
    out.retellPrompts = (r.retellPrompts as unknown[]).filter((g): g is string => typeof g === 'string')
  }
  if (typeof r.recapQuestion === 'string') out.recapQuestion = r.recapQuestion
  const hook = r.hook
  if (typeof hook === 'string') out.hook = hook
  else if (hook && typeof hook === 'object') {
    const h = hook as { b?: unknown; c?: unknown }
    if (typeof h.b === 'string' && typeof h.c === 'string') out.hook = { b: h.b, c: h.c }
  }

  // v2.2 extras — skill tags, characters used, mystery word.
  if (Array.isArray(r.skillTags)) {
    const raw = (r.skillTags as unknown[]).filter((s): s is string => typeof s === 'string')
    const valid = raw.filter((s) => isValidSkillId(s))
    const dropped = raw.filter((s) => !isValidSkillId(s))
    if (dropped.length > 0) console.warn('[story] dropped unknown skill tags:', dropped)
    out.skillTags = valid
    if (valid.length === 0) {
      console.warn('[story] model returned no valid skill tags — leaving skillTags = []')
    }
  }
  if (Array.isArray(r.charactersUsed)) {
    out.charactersUsed = (r.charactersUsed as unknown[]).filter((s): s is string => typeof s === 'string')
  }
  if (r.mysteryWord && typeof r.mysteryWord === 'object') {
    const mw = r.mysteryWord as Record<string, unknown>
    if (typeof mw.word === 'string' && typeof mw.language === 'string') {
      out.mysteryWord = {
        word: mw.word,
        language: mw.language,
        meaning: typeof mw.meaning === 'string' ? mw.meaning : undefined,
      }
    }
  }

  // Must have SOME content.
  const hasChapters = !!out.chapters?.length
  const hasPages = !!out.pages?.length
  if (!hasChapters && !hasPages) {
    throw new GenerationError('Model returned neither chapters nor pages')
  }

  // Prefer chapters when both are present.
  if (hasChapters && hasPages) {
    delete out.pages
  }

  // done=true must NOT end on a choice.
  if (out.done) {
    if (out.chapters?.length) {
      const lastCh = out.chapters[out.chapters.length - 1]
      const lastPg = lastCh.pages[lastCh.pages.length - 1]
      if (lastPg?.choice) delete lastPg.choice
    }
    if (out.pages?.length) {
      const last = out.pages[out.pages.length - 1]
      if (last?.choice) delete last.choice
    }
  }

  // Enforce at most one choice per chapter (last page only).
  const stripExtraChoices = (pages: Page[]) => {
    let choiceIdx = -1
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].choice) choiceIdx = i
    }
    if (choiceIdx >= 0) {
      for (let i = 0; i < pages.length; i++) {
        if (i !== choiceIdx && pages[i].choice) delete pages[i].choice
      }
    }
  }
  out.chapters?.forEach((c) => stripExtraChoices(c.pages))
  if (out.pages) stripExtraChoices(out.pages)

  void mode
  return out
}

// ---------- Story flattening (used by all QA passes) ----------------------
function allPages(s: GenerateResponseV22): Page[] {
  const out: Page[] = []
  if (s.chapters) for (const c of s.chapters) out.push(...c.pages)
  if (s.pages) out.push(...s.pages)
  return out
}

function totalWordCount(s: GenerateResponseV22): number {
  const text = allPages(s).map((p) => p.text).join(' ')
  return text.split(/\s+/).filter(Boolean).length
}

// ---------- Stage 0: deterministic pre-checks ------------------------------
interface DeterministicResult {
  wordCount: number
  heritageDensityPerPage: number
  excludeHits: string[]
  passed: boolean
  violations: string[]
}

function bandWordRange(band: Band): [number, number] {
  if (band === '0-3') return [0, 100]
  if (band === '7-10') return [4000, 10000]
  return [200, 2500]
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function runDeterministic(
  story: GenerateResponseV22,
  band: Band,
  universe: UniverseView,
  profile: ChildProfileView | null
): DeterministicResult {
  const violations: string[] = []
  const pages = allPages(story)
  const wc = totalWordCount(story)
  const [min, max] = bandWordRange(band)
  if (pages.length > 0 && (wc < min || wc > max)) {
    violations.push(
      `Word count ${wc} is outside band ${band} range (${min}–${max}). Rewrite to fit — extend if too short, compress if too long.`
    )
  }

  // Heritage word density per page — cap from culturalConfig.densityCap or 2.
  const cap = universe.culturalConfig?.densityCap ?? 2
  const terms = universe.heritageWords
  let worstDensity = 0
  if (terms.length > 0 && pages.length > 0) {
    for (const p of pages) {
      let count = 0
      for (const t of terms) {
        const re = new RegExp(`\\b${escapeRegex(t)}\\b`, 'gi')
        const m = p.text.match(re)
        if (m) count += m.length
      }
      if (count > worstDensity) worstDensity = count
      if (count > cap) {
        violations.push(
          `Page over heritage-word density cap (${count} > ${cap}). Rebalance: keep the meaning but let context carry weight, not repetition.`
        )
      }
    }
  }

  // excludeTerms — from profile prefs. Case-insensitive whole-word match.
  const exclude = profile?.contentPreferences?.excludeTerms ?? []
  const hits: string[] = []
  if (exclude.length > 0) {
    const joined = pages.map((p) => p.text).join(' ')
    for (const term of exclude) {
      const re = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i')
      if (re.test(joined)) hits.push(term)
    }
    for (const h of hits) {
      violations.push(
        `You used "${h}" — this profile has "${h}" excluded. Regenerate without it. Replace with an English equivalent.`
      )
    }
  }

  return {
    wordCount: wc,
    heritageDensityPerPage: worstDensity,
    excludeHits: hits,
    violations,
    passed: violations.length === 0,
  }
}

// ---------- Stage 1: hard-gate LLM judge ----------------------------------
function hardGateSystemPrompt(universe: UniverseView): string {
  const ref = loadReference()
  const chars = universe.characters.map((c) => ({
    name: c.name,
    role: c.role,
    canonRules: c.canonRules,
    speechPatterns: c.speechPatterns,
    personality: c.personality,
  }))
  const hardRules = universe.hardRules ?? []
  return `You are a hard-gate judge for the Azi-Verse story pipeline. You return PASS/FAIL on four independent gates. Any FAIL forces a regeneration.

Return ONLY a JSON object of shape:

{
  "characterConsistency": { "passed": boolean, "note"?: string },
  "culturalSensitivity":  { "passed": boolean, "note"?: string },
  "ageMatch":             { "passed": boolean, "note"?: string },
  "culturalAccuracy":     { "passed": boolean, "note"?: string }
}

Be strict but fair. When a gate fails, the note MUST be a single sentence that names the page or line and the rule violated — the note goes back into the next regeneration.

======================================================================
GATE 1 — CHARACTER CONSISTENCY vs. UNIVERSE BIBLE
======================================================================
Each character must act within its canonRules and speechPatterns.
Universe characters:
${JSON.stringify(chars, null, 2)}

Universe hard rules:
${hardRules.length ? hardRules.map((r) => `- ${r}`).join('\n') : '(none)'}

Example fail: "Jujy behaved cruelly at page 3 — canon rule 'never cruel' violated."

======================================================================
GATE 2 — CULTURAL SENSITIVITY
======================================================================
Fail if any: stereotype, tokenism, exoticizing heritage words, dictionary-style translations, cultural elements used as decoration without context.

======================================================================
GATE 3 — AGE-DEVELOPMENTAL MATCH
======================================================================
Fail if: sentence complexity too high or too low for band; concepts too abstract or too concrete; emotional weight inappropriate for age.

======================================================================
GATE 4 — CULTURAL ELEMENT ACCURACY
======================================================================
Fail if: Spanish/Gujarati/Hindi/Creole words used incorrectly, with wrong grammar, or in the wrong cultural context.

CANON REMINDER (short):
${(ref.universeGuide || '').slice(0, 3000)}
`
}

async function runHardGates(
  apiKey: string,
  story: GenerateResponseV22,
  universe: UniverseView,
  band: Band
): Promise<QaHardGateResult> {
  const compact = {
    band,
    title: story.title,
    chapters: story.chapters?.map((c) => ({
      title: c.title,
      pages: c.pages.map((p, i) => ({ i, text: p.text, ask: p.ask?.skill, star: p.star })),
    })),
    pages: story.pages?.map((p, i) => ({ i, text: p.text, ask: p.ask?.skill, star: p.star })),
    vocab: story.vocab,
    skillTags: story.skillTags,
  }
  const raw = await callAnthropic({
    apiKey,
    model: JUDGE_MODEL,
    system: hardGateSystemPrompt(universe),
    user: `Judge this story against all four gates. Story:\n\n${JSON.stringify(compact)}`,
    maxTokens: 800,
    cacheSystem: true,
  })
  const cleaned = raw.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('hard-gate judge returned no JSON')
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>

  const gate = (k: string) => {
    const g = parsed[k] as Record<string, unknown> | undefined
    if (!g || typeof g !== 'object') return { passed: false, note: 'gate missing from judge output' }
    return {
      passed: g.passed === true,
      note: typeof g.note === 'string' ? g.note : undefined,
    }
  }

  const cc = gate('characterConsistency')
  const cs = gate('culturalSensitivity')
  const am = gate('ageMatch')
  const ca = gate('culturalAccuracy')
  const violations: string[] = []
  if (!cc.passed && cc.note) violations.push(`[character] ${cc.note}`)
  if (!cs.passed && cs.note) violations.push(`[cultural-sensitivity] ${cs.note}`)
  if (!am.passed && am.note) violations.push(`[age] ${am.note}`)
  if (!ca.passed && ca.note) violations.push(`[cultural-accuracy] ${ca.note}`)

  return {
    passed: cc.passed && cs.passed && am.passed && ca.passed,
    characterConsistency: cc,
    culturalSensitivity: cs,
    ageMatch: am,
    culturalAccuracy: ca,
    violations: violations.length > 0 ? violations : undefined,
  }
}

// ---------- Stage 2: soft scoring ------------------------------------------
const DEFAULT_WEIGHTS: Record<keyof QaSoftBreakdown, number> = {
  structure: 0.2,
  skills: 0.2,
  cultural: 0.15,
  language: 0.15,
  age: 0.2,
  universe: 0.1,
}

function resolveWeights(universe: UniverseView): Record<keyof QaSoftBreakdown, number> {
  const raw = universe.scoringWeights
  if (!raw) return DEFAULT_WEIGHTS
  const out = { ...DEFAULT_WEIGHTS }
  for (const k of Object.keys(DEFAULT_WEIGHTS) as (keyof QaSoftBreakdown)[]) {
    const v = raw[k]
    if (typeof v === 'number' && v >= 0) out[k] = v
  }
  return out
}

function softScoreSystemPrompt(): string {
  const ref = loadReference()
  return `You are a soft-scoring judge for the Azi-Verse story pipeline. Return a per-criterion 0-10 breakdown. The pipeline computes the weighted score itself.

Return ONLY a JSON object:

{
  "breakdown": {
    "structure": number (0-10),
    "skills":    number (0-10),
    "cultural":  number (0-10),
    "language":  number (0-10),
    "age":       number (0-10),
    "universe":  number (0-10)
  },
  "notes": string
}

Notes: 2-4 sentences of concrete revision guidance if any criterion is below 8/10. Be honest — do not inflate.

Criteria:
- structure — arc, pacing, three-moment moral distribution
- skills — SS-taxonomy skill(s) embedded through action, not preached
- cultural — heritage integration is authentic and functional
- language — sentence rhythm, vocabulary stretch, read-aloud quality
- age — developmental fit for the stated band
- universe — companion voice, ritual usage, canon consistency

======================================================================
RUBRIC REFERENCE
======================================================================
${ref.rubric || '(rubric unavailable — score conservatively)'}
`
}

interface SoftScoreOutput {
  breakdown: QaSoftBreakdown
  notes: string
}

async function runSoftScore(apiKey: string, story: GenerateResponseV22, band: Band): Promise<SoftScoreOutput> {
  const compact = {
    band,
    title: story.title,
    chapters: story.chapters?.map((c) => ({
      title: c.title,
      hook: c.hook,
      recapQuestion: c.recapQuestion,
      pages: c.pages.map((p) => ({ text: p.text, ask: p.ask, choice: p.choice, star: p.star })),
    })),
    pages: story.pages?.map((p) => ({ text: p.text, ask: p.ask, choice: p.choice, star: p.star })),
    vocab: story.vocab,
    skillTags: story.skillTags,
    teachingGoals: story.teachingGoals,
  }
  const raw = await callAnthropic({
    apiKey,
    model: JUDGE_MODEL,
    system: softScoreSystemPrompt(),
    user: `Score this story:\n\n${JSON.stringify(compact)}`,
    maxTokens: 900,
    cacheSystem: true,
  })
  const cleaned = raw.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('soft-score judge returned no JSON')
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>
  const b = parsed.breakdown as Record<string, unknown> | undefined
  const clamp = (n: unknown) => (typeof n === 'number' ? Math.max(0, Math.min(10, n)) : 0)
  const breakdown: QaSoftBreakdown = {
    structure: clamp(b?.structure),
    skills: clamp(b?.skills),
    cultural: clamp(b?.cultural),
    language: clamp(b?.language),
    age: clamp(b?.age),
    universe: clamp(b?.universe),
  }
  const notes = typeof parsed.notes === 'string' ? parsed.notes : ''
  return { breakdown, notes }
}

function computeSoftScore(breakdown: QaSoftBreakdown, weights: Record<keyof QaSoftBreakdown, number>): number {
  const sum =
    (breakdown.structure / 10) * weights.structure +
    (breakdown.skills / 10) * weights.skills +
    (breakdown.cultural / 10) * weights.cultural +
    (breakdown.language / 10) * weights.language +
    (breakdown.age / 10) * weights.age +
    (breakdown.universe / 10) * weights.universe
  const weightTotal =
    weights.structure + weights.skills + weights.cultural + weights.language + weights.age + weights.universe
  const normalized = weightTotal > 0 ? sum / weightTotal : sum
  return Math.round(100 * normalized)
}

// ---------- v3 guardrail bridge (Agent B owns lib/read/guardrails) --------
// Defensive dynamic import so tsc/build works if the helper hasn't landed
// yet. Returns null if unavailable — the caller is responsible for degrading.
async function safeCheckGuardrails(
  storyText: string,
): Promise<{ excludeHits?: string[] } | null> {
  try {
    const specifier = ['@', 'lib', 'read', 'guardrails'].join('/').replace('@/', '@/')
    const mod: unknown = await import(/* webpackIgnore: true */ specifier).catch(() => null)
    if (!mod || typeof mod !== 'object') return null
    const m = mod as { checkGuardrails?: (t: string) => { excludeHits?: string[] } | Promise<{ excludeHits?: string[] }> }
    if (typeof m.checkGuardrails !== 'function') return null
    const r = await m.checkGuardrails(storyText)
    return r && typeof r === 'object' ? r : null
  } catch (e) {
    console.warn('[story] guardrails module unavailable, skipping cross-check:', e)
    return null
  }
}

// ---------- v3 wildcard detection -----------------------------------------
// If the interview named a novel character (e.g. "Ollie the otter") who isn't
// in the universe cast, flag them as a wildcard so persistence + future
// generation can reference them. Heuristic: look for the interview's want
// text patterns like "<Capitalized> the <lowercase>" that don't match any
// existing character name.
function detectWildcards(
  interview: KidInterview | undefined,
  originBookId: string,
  universe: UniverseView,
): WildcardCharacter[] {
  if (!interview) return []
  const existingNames = new Set(universe.characters.map((c) => c.name.toLowerCase()))
  const candidates: WildcardCharacter[] = []
  const seen = new Set<string>()

  const scanText = (text: string) => {
    if (!text) return
    // "<Name> the <species>" — the canonical shape the interview surfaces.
    const re = /\b([A-Z][a-zA-Z]{1,15})\s+the\s+([a-z][a-z]{1,20})\b/g
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      const name = m[1]
      const species = m[2]
      if (existingNames.has(name.toLowerCase())) continue
      const id = `wild_${name.toLowerCase()}_${species.toLowerCase()}`
      if (seen.has(id)) continue
      seen.add(id)
      candidates.push({
        id,
        name,
        species,
        originBookId,
        createdAt: Date.now(),
      })
    }
  }

  const recipe = interview.recipe
  if (recipe.want) scanText(recipe.want)
  if (recipe.reason) scanText(recipe.reason)
  if (recipe.obstacle) scanText(recipe.obstacle)
  if (recipe.extras) {
    for (const e of recipe.extras) scanText(e.value)
  }
  for (const a of interview.answers) scanText(a.answer)

  return candidates.slice(0, 4) // hard cap; the child rarely invents more than one
}

// ---------- Post-generation enrichment ------------------------------------
// If the model omitted skillTags, seed from the prompt's chosen target.
function ensureSkillTags(story: GenerateResponseV22, target: SkillNode | null): void {
  if (!story.skillTags || story.skillTags.length === 0) {
    if (target && isValidSkillId(target.id)) {
      story.skillTags = [target.id]
    } else {
      story.skillTags = []
    }
  }
}

// ---------- Route handler --------------------------------------------------
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'ANTHROPIC_API_KEY is not set. Add it in Vercel project settings (or .env.local) to enable story magic.',
      },
      { status: 500 }
    )
  }

  let body: GenerateRequest
  try {
    body = (await req.json()) as GenerateRequest
  } catch {
    return NextResponse.json({ error: 'Bad request body' }, { status: 400 })
  }

  const universe = readUniverse(body.universe)
  const profile = await tryLoadProfile()
  const band = normalizeBand(profile?.currentBand as string | undefined)

  const bundle = assemblePrompt(body, universe, profile, band)
  const usr = userPrompt(body)

  try {
    // ---- Generation loop with deterministic + hard-gate feedback ----
    const MAX_GEN_ATTEMPTS = 2
    let story: GenerateResponseV22 | null = null
    let det: DeterministicResult | null = null
    let hardGates: QaHardGateResult | null = null
    let attempts = 0
    let judgeUnavailable = false
    let currentUser = usr

    while (attempts < MAX_GEN_ATTEMPTS) {
      attempts++
      const rawText = await callAnthropic({
        apiKey,
        model: STORY_MODEL,
        system: bundle.system,
        user: currentUser,
        maxTokens: 6000,
        cacheSystem: true,
      })
      let candidate: GenerateResponseV22
      try {
        candidate = validate(extractJSON(rawText), body.mode)
      } catch (e) {
        console.error('[story] validation failed on attempt', attempts, e)
        if (attempts >= MAX_GEN_ATTEMPTS) {
          return NextResponse.json(
            { error: 'The story machine hiccuped. Try again!' },
            { status: 502 }
          )
        }
        currentUser = `${usr}\n\nYour previous output failed to parse as JSON. Return ONLY a valid JSON object — no fences, no prose, no trailing commas.`
        continue
      }
      ensureSkillTags(candidate, bundle.targetSkill)

      // Stage 0 — deterministic.
      const detResult = runDeterministic(candidate, band, universe, profile)
      det = detResult
      if (!detResult.passed && attempts < MAX_GEN_ATTEMPTS) {
        currentUser = `${usr}

======================================================================
DETERMINISTIC PRE-CHECK VIOLATIONS
======================================================================
${detResult.violations.map((v) => `- ${v}`).join('\n')}

Regenerate the FULL story with these specific violations fixed. Keep what worked.`
        continue
      }

      // Stage 1 — hard-gate judge (skippable in dev).
      if (SKIP_RUBRIC) {
        story = candidate
        break
      }

      try {
        const hg = await runHardGates(apiKey, candidate, universe, band)
        hardGates = hg
        if (!hg.passed && attempts < MAX_GEN_ATTEMPTS) {
          const notes = (hg.violations ?? []).join('\n- ')
          currentUser = `${usr}

======================================================================
HARD-GATE VIOLATIONS — REGENERATE
======================================================================
- ${notes}

Regenerate the FULL story fixing every violation above. Keep what worked.`
          continue
        }
        // Passed OR out of attempts.
        story = candidate
        break
      } catch (e) {
        console.warn('[story] hard-gate judge unavailable, degrading:', e)
        judgeUnavailable = true
        story = candidate
        break
      }
    }

    if (!story) {
      return NextResponse.json(
        { error: 'The story machine hiccuped. Try again!' },
        { status: 502 }
      )
    }

    // ---- Stage 2 — DEFERRED (v3.2 P2-2a Option B) --------------------------
    // Soft scoring used to run inline here. That made the whole request 60s+
    // on kid-authored stories and triggered 504s on Vercel's Fluid Compute.
    // The kid then saw the "story machine hiccuped" line, but the story had
    // already been written — it just missed the shelf.
    //
    // Now: we return the Book AS SOON AS hard gates pass. The client saves
    // the Book locally + navigates to the reader immediately, then fires a
    // background POST to /api/story-score to fill in the soft score. If the
    // background call fails, `status: 'needs-review'` sticks and parents can
    // retry from the Corner. The kid never watches a spinner tick down.
    //
    // Consequence: the inline soft-score revision loop (regenerate on <90) is
    // gone from the hot path. That was already a rare pass; when it matters
    // parents can request a re-generate from the Corner. Trade-off worth it
    // to guarantee under-30s response for the child.
    void resolveWeights
    void runSoftScore
    void computeSoftScore
    void SHIP_GATE_MIN
    void SKIP_RUBRIC

    const revisions = attempts - 1 // regenerations spent in Stage 0/1
    const notesLog: string[] = []
    if (judgeUnavailable) notesLog.push('judge unavailable')

    // ---- Assemble the qaRecord (partial — soft score arrives later) --------
    const finalHardGates: QaHardGateResult = judgeUnavailable
      ? { passed: true }
      : hardGates ?? { passed: true }

    const qaRecord: QaRecord = {
      hardGates: finalHardGates,
      softScore: 0, // filled in by /api/story-score
      breakdown: undefined,
      revisions,
      deterministic: det
        ? {
            wordCount: det.wordCount,
            heritageDensityPerPage: det.heritageDensityPerPage,
            excludeHits: det.excludeHits,
            passed: det.passed,
          }
        : { passed: true },
      notes: notesLog.length > 0 ? notesLog.join(' | ') : undefined,
    }
    story.qaRecord = qaRecord

    // Determine status. Without the soft-score signal we can only route to
    // needs-review on the hard gates. The deferred /api/story-score may bump
    // us back to needs-review if the soft score comes back low.
    const needsReview =
      judgeUnavailable ||
      !finalHardGates.passed ||
      !qaRecord.deterministic?.passed
    story.status = needsReview ? 'needs-review' : 'complete'

    // Signal to the client that the soft score is coming later.
    ;(story as GenerateResponseV22 & { scoreDeferred?: boolean }).scoreDeferred = true

    // ---- v3 kid-story extras: interview, wildcards, author, guardrails cross-check ----
    const mode = (body as unknown as { mode?: string }).mode
    if (mode === 'kid-story') {
      const kidBody = body as GenerateRequest & { interview?: KidInterview }
      const interview = kidBody.interview
      if (interview) {
        story.interview = interview
        // Wildcards: derived from the interview, not from the story text —
        // that way the child's invented character is captured even if the
        // generator paraphrases their name.
        const wildcards = detectWildcards(interview, story.title ? story.title : 'kid-story', universe)
        if (wildcards.length > 0) story.wildcards = wildcards
      }
      story.author = 'azad'
      if (!story.by) story.by = body.by ?? 'Made by Azad'

      // Guardrails cross-check on the full story text. If any excludeTerms
      // slipped through the deterministic gate (e.g. because they weren't in
      // the profile at that time but the parent added them via the Corner),
      // route to needs-review so parents can look before it lands.
      try {
        const fullText = allPages(story).map((p) => p.text).join(' ')
        const gr = await safeCheckGuardrails(fullText)
        if (gr?.excludeHits && gr.excludeHits.length > 0) {
          story.status = 'needs-review'
          if (story.qaRecord) {
            const priorNotes = story.qaRecord.notes ?? ''
            story.qaRecord.notes = [priorNotes, `guardrails excludeHits: ${gr.excludeHits.join(', ')}`]
              .filter(Boolean)
              .join(' | ')
          }
        }
      } catch {
        // safeCheckGuardrails already swallows internal errors; nothing to do.
      }
    }

    return NextResponse.json(story)
  } catch (e) {
    console.error('[story] generation failed', e)
    return NextResponse.json(
      { error: 'The story machine hiccuped. Try again!' },
      { status: 502 }
    )
  }
}
