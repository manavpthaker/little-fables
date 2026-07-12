// Little Fables v2 — types.
// Book/Chapter/Page is the canonical shape. Every unit of content is a Book;
// a "quick story" is a 1-chapter Book. Legacy v1 stories are migrated on read.
// Where possible we accept both the design/handoff-v2 shape (`wash` + emojis
// + slot/img) and the pack-schema shape (`scene: { bg, emojis }` + top-level
// vocab[]). Loaders normalize into this canonical form.

// ---------- Watercolor washes (handoff-v2 palette) ----------
export type WashKey =
  | 'canyon' | 'sunset' | 'meadow' | 'lilac' | 'blush' | 'river' | 'snow' | 'honey'

// ---------- Interactive blocks on a page ----------
export interface AskBlock {
  /** Skill being exercised, e.g. 'counting', 'feelings', 'word detective' */
  skill: string
  /** Question spoken + shown to the child */
  question: string
  /** Optional keyword matches (legacy pack format; the conversational judge
   *  is the source of truth in v2, keywords are used only as a fast fallback) */
  answers?: string[]
  /** Said when the child answers well */
  praise: string
  /** Gentle hint if the answer isn't recognized (also shown after 2 misses) */
  hint: string
  /** 'wonder' asks are open-ended — no right answer, buddy responds specifically
   *  but never evaluates. */
  kind?: 'ask' | 'wonder'
}

export interface ChoiceOption {
  label: string
  emoji: string
  /** Optional pre-baked branch pages (starter stories only). Generated stories
   *  and pack-000 stories omit this; the API continuation resolves the branch. */
  pages?: Page[]
  /** Legacy v1 field, tolerated on load. */
  keywords?: string[]
}

export interface ChoiceBlock {
  prompt: string
  options: ChoiceOption[]
}

// ---------- Vocab / star words ----------
export interface VocabWord {
  word: string
  /** Kid-friendly meaning (5–8 words, no dictionary tone) */
  meaning: string
  /** Optional phonetic pronunciation ("WOB-blee") */
  say?: string
  /** Optional story-of-origin id for the WordBook screen */
  from?: string
}

// ---------- Page ----------
export interface Page {
  /** Prose (verbatim from pack-000 stories; ~65 words / page targeted) */
  text: string
  /** Watercolor wash key. Optional — falls back to chapter wash then book wash. */
  wash?: WashKey
  /** Emojis composing the fallback illustration on wash. */
  emojis?: string[]
  /** Real illustration (path under /public), used instead of emojis when present. */
  img?: string
  /** Handoff `slot`/`slotLabel` — used as placeholder art metadata pre-generation. */
  slot?: string
  slotLabel?: string
  /** Full-bleed art page (art fills the left page edge-to-edge). */
  fullBleed?: boolean
  /** Star word learned on this page (added to the child's WordBook on read). */
  star?: string
  /** Teaching moment. */
  ask?: AskBlock
  /** Story choice — one per chapter max. */
  choice?: ChoiceBlock
  /** Breathe-along page (renders BreatheAlong instead of a mic ask). */
  breathe?: boolean
  /** v3.2: semantic scene key (e.g. 'bus', 'bear-hollow', 'moon-window'). The
   *  reader maps this to a drawn scene component; missing/null → drawn endpaper
   *  placeholder. Replaces the v2 `{ bg, emojis }` presentation blob. */
  scene?: string | null
}

// ---------- Chapter ----------
export interface ChapterHook {
  /** Bouncy variant (for the buddy speaking with `energy: 'bouncy'`). */
  b: string
  /** Calm variant. */
  c: string
}

export interface Chapter {
  title: string
  /** Reader state per book progress. 'painting' = art still generating; not
   *  playable (per PRD "Not yet… Mom is still painting this one ✦"). */
  status?: 'done' | 'current' | 'painting'
  wash?: WashKey
  slot?: string
  emojis?: string[]
  pages: Page[]
  /** Chapter-end hook line ("Next time: the cave door creaks open…"). */
  hook?: ChapterHook | string
  /** Chapter-end recap question ("What did Miko find?") */
  recapQuestion?: string
}

// ---------- QA record (v2.2 two-stage QA — see docs/aziverse-adoption.md#1) ----------
// Written on every generated Book by the story engine; surfaced in Parent
// Corner story detail. Pack-000 and starter books have qaRecord: undefined
// (they predate the pipeline).
export interface QaHardGateResult {
  passed: boolean
  characterConsistency?: { passed: boolean; note?: string }
  culturalSensitivity?: { passed: boolean; note?: string }
  ageMatch?: { passed: boolean; note?: string }
  culturalAccuracy?: { passed: boolean; note?: string }
  /** Concatenated violation notes fed back to the next regeneration. */
  violations?: string[]
}
export interface QaSoftBreakdown {
  structure: number
  skills: number
  cultural: number
  language: number
  age: number
  universe: number
}
export interface QaRecord {
  hardGates: QaHardGateResult
  softScore: number
  breakdown?: QaSoftBreakdown
  revisions: number
  /** Deterministic checks (band word count, heritage density, excludeTerms). */
  deterministic?: {
    wordCount?: number
    heritageDensityPerPage?: number
    excludeHits?: string[]
    passed: boolean
  }
  notes?: string
}

// ---------- Mystery Word (heritage word per book — v2.2 item 6) ----------
export interface MysteryWord {
  word: string
  /** ISO-ish language code ('gu', 'hi', 'es', 'ht', 'en'). */
  language: string
  /** Optional english meaning if it isn't already in vocab. */
  meaning?: string
}

// ---------- Comfort ritual beat (v2.2 item 7) ----------
export interface ComfortRitual {
  /** Motif key drawn from universe rituals: 'moon' | 'snack' | 'song' | 'lullaby'. */
  motif: 'moon' | 'snack' | 'song' | 'lullaby'
  /** One-line spoken text — the closing register ("Goodnight, mi cielo. The moon is watching."). */
  line: string
  /** If true, book already ends on its own ritual page — SKIP the interstitial. */
  alreadyClosed?: boolean
}

// ---------- Skill tags (v2.2 item 5 — SS-taxonomy per future-ready-skills.md) ----------
// Ids look like 'SS003.emotional-regulation'. Validated against SKILL_TAXONOMY
// in lib/read/skills.ts.
export type SkillTag = string

// ---------- v3: kid-authored story metadata ----------
// The interview transcript that produced a kid-created book. Stored on the
// Book itself (`Book.interview`) so parents can review it in Made by Azad
// and worldState can echo the child's authorial ideas back later.

export interface KidInterviewAnswer {
  /** The buddy's spoken question. */
  question: string
  /** What the child said (Whisper transcript). */
  answer: string
  /** Which recipe slot this answered — 'want' | 'reason' | 'obstacle' | 'character' | 'setting' | 'freeform'. */
  slot: string
  /** Optional pointer to the audio blob in IndexedDB for later playback. */
  audioRef?: string
}

export interface KidInterview {
  /** Every Q/A pair in order, ≤3 questions per PRD R20. */
  answers: KidInterviewAnswer[]
  /** Distilled recipe used to seed generation (want, reason, obstacle). */
  recipe: {
    want?: string
    reason?: string
    obstacle?: string
    /** Free-slot list — includes anything the buddy captured that isn't want/reason/obstacle. */
    extras?: Array<{ slot: string; value: string }>
  }
  /** Buddy's read-back line (before generation). */
  readBack?: string
  /** ISO timestamp when the interview finished. */
  finishedAt: number
}

// v3 R23: novel characters the child invented via wildcard slots (Ollie the
// otter, Rusty the toaster…). These join the universe cast permanently once
// the story that introduced them passes QA — the buddy can reference them in
// future stories subject to guardrails.
export interface WildcardCharacter {
  id: string             // 'wild_ollie_otter'
  name: string           // 'Ollie'
  species?: string       // 'otter'
  trait?: string         // 'flies rockets'
  originBookId: string
  createdAt: number
}

// ---------- Book ----------
export type BookKind = 'chapter' | 'quick'
export type BookStatus = 'complete' | 'awaiting-choice' | 'draft' | 'needs-review'
export type BookSource = 'starter' | 'family' | 'generated'

export interface Book {
  id: string
  title: string
  by?: string
  kind: BookKind
  status: BookStatus
  source: BookSource

  /** Cover art. Prefer `coverImage`; falls back to emoji-on-wash. */
  coverImage?: string
  coverEmoji: string
  coverBg?: string
  /** Book-level wash key (fallback if a chapter/page doesn't specify). */
  wash?: WashKey

  /** Short meta line under the cover title ("3 chapters · counting"). */
  meta?: string

  chapters: Chapter[]

  /** Star words, meanings, and (optionally) pronunciation for MyWords. */
  vocab: VocabWord[]
  teachingGoals: string[]
  retellPrompts: string[]

  /** Markdown parent guide (shown only in Grown-ups). */
  parentGuide?: string
  /** Parent-facing metadata (e.g. "bedtime pacing"). */
  originNote?: string
  /** True → shelved under "Quiet time" (bedtime tag from pack-000). */
  quiet?: boolean
  /** Seasonal shelf tag ("christmas", "diwali", ...). */
  seasonal?: string

  /** v2.2: two-stage QA record (undefined for pre-pipeline books). */
  qaRecord?: QaRecord
  /** v2.2: SS-taxonomy ids embedded in this book. */
  skillTags?: SkillTag[]
  /** v2.2: universe character ids used in this book. */
  charactersUsed?: string[]
  /** v2.2: Mystery Word (heritage word) hidden in the story. Tap to find; adds
   *  to the Language Wall on MyWords. */
  mysteryWord?: MysteryWord
  /** v2.2: Optional comfort-ritual closing beat (shown before BookComplete). */
  comfortRitual?: ComfortRitual

  /** v3: kid-authored — populated when Azad drove the story kitchen. When
   *  present the shelf shows an author mark, "Made by Azad" attribution, and
   *  the interview is surfaced in Parent Corner's Made by Azad section. */
  interview?: KidInterview
  /** v3: novel characters the child invented in this book — joined to the
   *  universe cast permanently. */
  wildcards?: WildcardCharacter[]
  /** v3: 'azad' if kid-created (Book.by set to 'Made by Azad'), 'family' if
   *  parent-generated or from the pack. Redundant with source but explicit
   *  for the shelf spine treatment (author mark). */
  author?: 'azad' | 'family'

  createdAt: number
  updatedAt?: number
  /** Optional idea used to generate (for continuations). */
  idea?: string
}

// ---------- Progress ----------
export interface BookProgress {
  bookId: string
  chapter: number
  page: number
  updatedAt: number
}

// ---------- World state (choice log + rolling memory) ----------
export interface ChoiceEvent {
  bookId: string
  chapter: number
  label: string
  /** Short summary the buddy can echo back ("The web bridge you built"). */
  summary: string
  at: number
}

export interface WorldState {
  /** Rolling last ~20 choices for prompt injection + Home callback. */
  choiceLog: ChoiceEvent[]
  /** The Home speech-bubble line ("The web bridge you built is still standing!") */
  latestCallback?: string
}

// ---------- Buddy ----------
export type BuddyNature = 'living' | 'nonliving'
export interface BuddyDef {
  id: string
  name: string
  emoji: string
  nature: BuddyNature
  trait: string
  wash: WashKey
  intro: { b: string; c: string }
  greet: { b: string; c: string }
}

export interface BuddyState {
  /** Selected buddy id (null until the carousel has been used). */
  activeId: string | null
  /** Buddy energy — 'bouncy' by default; toggle to 'calm' for a quieter kid. */
  energy: 'bouncy' | 'calm'
  /** Growth stage per buddy — story-world things (scarf, goggles, sidecar…), never currency. */
  growth: Record<string, number>
  /** Buddies unlocked by reading-day milestones (arriving via BuddyArrival). */
  unlocked: string[]
}

// ---------- Reading days ----------
export interface ReadingDays {
  /** ISO date strings for days with ≥1 finished chapter or quick story. */
  daysLit: string[]
}

// ---------- Badges ----------
export interface BadgeDef {
  id: string
  name: string
  emoji: string
  wash: WashKey
  /** One-line explanation heard on tap ("You finished all 3 Miko books!"). */
  earnLine: { b: string; c: string }
  /** Silhouette hint shown before earning. */
  how: string
}

export interface EarnedBadges {
  ids: string[]
  /** For BadgeEarn celebration handoff — cleared after shown. */
  pendingEarn?: string
}

// ---------- Word book (collected star words) ----------
export interface WordBook {
  words: (VocabWord & { learnedAt: number })[]
}

// ---------- Retells ----------
export interface Retell {
  id: string
  bookId: string
  chapter?: number
  bookTitle: string
  createdAt: number
  mimeType: string
  blob: Blob
  /** Filled by /api/listen after upload. */
  transcript?: string
  /** Buddy-response line stored alongside for parent visibility. */
  buddyResponse?: string
}

// ---------- Generation (API contract) ----------
export interface GenerateRequest {
  mode: 'start' | 'chapter' | 'continue'
  /** Story premise / child's spoken idea. */
  idea?: string
  hero?: string
  place?: string
  by?: string
  /** Present in chapter/continue mode. */
  bookContext?: {
    id: string
    title: string
    kind: BookKind
    priorChapters: Array<{ title: string; summary: string }>
    /** Rolling worldstate snapshot the model can reference. */
    worldState?: WorldState
  }
  /** For continue: the option the child chose. */
  choice?: string
  /** For continue: freeform "your idea" path (childIdea → co-authorship). */
  childIdea?: string
  universe: unknown
}

export interface GenerateResponse {
  title?: string
  coverEmoji?: string
  coverBg?: string
  by?: string
  wash?: WashKey
  chapters?: Chapter[]
  /** Legacy flat pages returned in `mode: 'start'` for quick stories. */
  pages?: Page[]
  vocab?: VocabWord[]
  teachingGoals?: string[]
  retellPrompts?: string[]
  hook?: ChapterHook | string
  recapQuestion?: string
  /** Rubric gate output — filled by the second-pass judge call. */
  rubricScore?: number
  rubricNotes?: string
  done: boolean
  error?: string
}

// ---------- Legacy v1 shim ----------
// The v1 storage format used a flatter `Story` with `pages: StoryPage[]` at the
// top level, `vocab: string[]`, `scene: { bg, emojis }`, no chapters. The
// migration in `lib/read/migrate.ts` maps a v1 story to a 1-chapter Book so
// existing saved libraries keep working.

// Kept as loose aliases so legacy imports don't break the compile — but treat
// these as "read-only for migration only".
export type StoryPage = Page
export type ChoiceBlockLegacy = ChoiceBlock
export type Scene = { bg?: string; emojis?: string[]; image?: string }
export type Story = Book
