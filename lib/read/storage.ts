// Little Fables v2 — local-first storage.
// Books/progress/worldstate/buddy/reading-days/badges/wordbook live in
// localStorage (small JSON). Retell audio blobs live in IndexedDB.

import type {
  Book,
  BookProgress,
  BuddyState,
  EarnedBadges,
  ReadingDays,
  Retell,
  VocabWord,
  WildcardCharacter,
  WordBook,
  WorldState,
} from '@/types/story'

// Re-export `Retell` for callers that used to import it from this module.
export type { Retell }

// ---------- keys ----------
const BOOKS_KEY = 'lf-books-v2'
const PROGRESS_KEY = 'lf-progress-v2'
const WORLDSTATE_KEY = 'lf-worldstate-v2'
const BUDDY_KEY = 'lf-buddy-v2'
const READING_DAYS_KEY = 'lf-reading-days-v2'
const BADGES_KEY = 'lf-badges-v2'
const WORDBOOK_KEY = 'lf-wordbook-v2'
const LANGWALL_KEY = 'lf-langwall-v2'
const WILDCARDS_KEY = 'lf-wildcards-v1'
const ARCHIVED_BOOKS_KEY = 'lf-archived-books-v3'

// ---------- helpers ----------
function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / privacy mode — silently swallow */
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

/** ISO date at day precision (used by ReadingDays and daily-quest logic). */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// ---------- Books ----------
// v1 store used `azad-stories-v1` with a flat Story shape. We keep reading it
// as a fallback and migrate on the fly (see lib/read/migrate.ts).

export function loadBooks(): Book[] {
  return readJSON<Book[]>(BOOKS_KEY, [])
}

export function saveBook(book: Book) {
  const b: Book = { ...book, updatedAt: Date.now() }
  const rest = loadBooks().filter((x) => x.id !== b.id)
  rest.unshift(b)
  writeJSON(BOOKS_KEY, rest.slice(0, 120))
}

export function deleteBook(id: string) {
  writeJSON(
    BOOKS_KEY,
    loadBooks().filter((b) => b.id !== id)
  )
}

export function getBook(id: string): Book | undefined {
  return loadBooks().find((b) => b.id === id)
}

// ---------- Progress (per book) ----------
export function loadProgress(): Record<string, BookProgress> {
  return readJSON<Record<string, BookProgress>>(PROGRESS_KEY, {})
}

export function getProgress(bookId: string): BookProgress | undefined {
  return loadProgress()[bookId]
}

export function saveProgress(p: BookProgress) {
  const all = loadProgress()
  all[p.bookId] = { ...p, updatedAt: Date.now() }
  writeJSON(PROGRESS_KEY, all)
}

/** Called when a chapter is finished — lights today's sun. */
export function markChapterFinished(bookId: string, chapter: number) {
  const p = getProgress(bookId) ?? { bookId, chapter, page: 0, updatedAt: 0 }
  saveProgress({ ...p, chapter: chapter + 1, page: 0 })
  addReadingDay(todayISO())
}

// ---------- WorldState (choice log + rolling memory) ----------
const MAX_LOG = 20

export function loadWorldState(): WorldState {
  return readJSON<WorldState>(WORLDSTATE_KEY, { choiceLog: [] })
}

export function saveWorldState(w: WorldState) {
  writeJSON(WORLDSTATE_KEY, w)
}

export function recordChoice(bookId: string, chapter: number, label: string, summary: string) {
  const w = loadWorldState()
  w.choiceLog.unshift({ bookId, chapter, label, summary, at: Date.now() })
  w.choiceLog = w.choiceLog.slice(0, MAX_LOG)
  w.latestCallback = summary
  saveWorldState(w)
}

// ---------- Buddy state ----------
const DEFAULT_BUDDY: BuddyState = {
  activeId: null,
  energy: 'bouncy',
  growth: {},
  unlocked: [],
}

export function loadBuddy(): BuddyState {
  return { ...DEFAULT_BUDDY, ...readJSON<BuddyState>(BUDDY_KEY, DEFAULT_BUDDY) }
}

export function saveBuddy(b: BuddyState) {
  writeJSON(BUDDY_KEY, b)
}

export function pickBuddy(id: string) {
  const b = loadBuddy()
  const next: BuddyState = { ...b, activeId: id }
  if (!next.unlocked.includes(id)) next.unlocked.push(id)
  if (typeof next.growth[id] !== 'number') next.growth[id] = 1
  saveBuddy(next)
}

// ---------- Reading days ----------
export function loadReadingDays(): ReadingDays {
  return readJSON<ReadingDays>(READING_DAYS_KEY, { daysLit: [] })
}

export function addReadingDay(iso: string) {
  const r = loadReadingDays()
  if (!r.daysLit.includes(iso)) {
    r.daysLit.push(iso)
    writeJSON(READING_DAYS_KEY, r)
  }
}

/** Ordered Mon–Sun for this week (for the sun row). */
export function currentWeekSuns(now = new Date()): Array<{ iso: string; letter: string; lit: boolean; today: boolean }> {
  const day = (now.getDay() + 6) % 7 // Mon = 0
  const monday = new Date(now)
  monday.setDate(now.getDate() - day)
  const lit = new Set(loadReadingDays().daysLit)
  const todayISO_ = todayISO()
  const letters = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  return letters.map((letter, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    return { iso, letter, lit: lit.has(iso), today: iso === todayISO_ }
  })
}

// ---------- Badges ----------
const DEFAULT_BADGES: EarnedBadges = { ids: [] }

export function loadBadges(): EarnedBadges {
  return readJSON<EarnedBadges>(BADGES_KEY, DEFAULT_BADGES)
}

export function grantBadge(id: string) {
  const b = loadBadges()
  if (b.ids.includes(id)) return
  b.ids.push(id)
  b.pendingEarn = id
  writeJSON(BADGES_KEY, b)
}

export function clearPendingBadge() {
  const b = loadBadges()
  if (!b.pendingEarn) return
  delete b.pendingEarn
  writeJSON(BADGES_KEY, b)
}

// ---------- WordBook (star words the child has collected) ----------
export function loadWordBook(): WordBook {
  return readJSON<WordBook>(WORDBOOK_KEY, { words: [] })
}

export function collectWord(w: VocabWord, from?: string) {
  const wb = loadWordBook()
  if (wb.words.some((x) => x.word === w.word)) return
  wb.words.push({ ...w, from: from ?? w.from, learnedAt: Date.now() })
  writeJSON(WORDBOOK_KEY, wb)
}

// ---------- Language Wall (found mystery words per book — v2.2 item 6) ----------
// The Wall is a case-insensitive-deduped list of heritage words the child has
// tapped in the reader when they matched the book's `mysteryWord`. Grouped by
// language on /read/words. Sync layer serializes the state blob as-is; no
// schema change needed on Supabase.

export interface LanguageWallEntry {
  word: string
  language: string
  meaning?: string
  bookId: string
  foundAt: number
}

export interface LanguageWall {
  found: LanguageWallEntry[]
}

export function loadLanguageWall(): LanguageWall {
  return readJSON<LanguageWall>(LANGWALL_KEY, { found: [] })
}

/**
 * Record a discovered mystery word. Idempotent: dedupes by lowercased `word`.
 * Returns true iff the word was NEW (so callers can trigger a celebration).
 */
export function foundMysteryWord(
  bookId: string,
  mw: { word: string; language: string; meaning?: string },
): boolean {
  const wall = loadLanguageWall()
  const key = mw.word.toLowerCase()
  if (wall.found.some((e) => e.word.toLowerCase() === key)) return false
  wall.found.push({
    word: mw.word,
    language: mw.language,
    meaning: mw.meaning,
    bookId,
    foundAt: Date.now(),
  })
  writeJSON(LANGWALL_KEY, wall)
  return true
}

// ---------- Wildcards (v3) ----------
// Novel characters the child invented in the story kitchen (R23). They join
// the universe cast once the story that introduced them ships, so future
// generations can reference "Ollie the otter" naturally.

export function loadWildcards(): WildcardCharacter[] {
  return readJSON<WildcardCharacter[]>(WILDCARDS_KEY, [])
}

/**
 * Append new wildcards, deduping by id. Idempotent — safe to call more than
 * once per book.
 */
export function addWildcards(next: WildcardCharacter[]): void {
  if (!next || next.length === 0) return
  const existing = loadWildcards()
  const byId = new Map(existing.map((w) => [w.id, w]))
  for (const w of next) {
    if (!w || !w.id || !w.name) continue
    if (byId.has(w.id)) continue
    byId.set(w.id, w)
  }
  writeJSON(WILDCARDS_KEY, Array.from(byId.values()))
}

// ---------- Archived books (v3 — Made by Azad tab) ----------
// A soft archive — the book stays in loadStories() but is filtered out of the
// shelf and marked archived in the Parent Corner listing. Parents can
// unarchive at any time. No destructive delete.

export function loadArchived(): string[] {
  return readJSON<string[]>(ARCHIVED_BOOKS_KEY, [])
}

export function isArchived(id: string): boolean {
  return loadArchived().includes(id)
}

export function archiveBook(id: string): void {
  const set = new Set(loadArchived())
  set.add(id)
  writeJSON(ARCHIVED_BOOKS_KEY, Array.from(set))
}

export function unarchiveBook(id: string): void {
  const arr = loadArchived().filter((x) => x !== id)
  writeJSON(ARCHIVED_BOOKS_KEY, arr)
}

// ---------- Retells (IndexedDB) ----------
const DB_NAME = 'azad-read'
const RETELLS_STORE = 'retells'
const PAGE_AUDIO_STORE = 'page-audio'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // v3 adds the page-audio store used by lib/read/speech.ts for cached TTS
    // audio + timestamps. Bumped from v2 so both modules can share the DB
    // without VersionError.
    const req = indexedDB.open(DB_NAME, 3)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(RETELLS_STORE)) {
        req.result.createObjectStore(RETELLS_STORE, { keyPath: 'id' })
      }
      if (!req.result.objectStoreNames.contains(PAGE_AUDIO_STORE)) {
        req.result.createObjectStore(PAGE_AUDIO_STORE, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveRetell(r: Retell): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RETELLS_STORE, 'readwrite')
    tx.objectStore(RETELLS_STORE).put(r)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function listRetells(): Promise<Retell[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RETELLS_STORE, 'readonly')
    const req = tx.objectStore(RETELLS_STORE).getAll()
    req.onsuccess = () =>
      resolve((req.result as Retell[]).sort((a, b) => b.createdAt - a.createdAt))
    req.onerror = () => reject(req.error)
  })
}

export async function deleteRetell(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RETELLS_STORE, 'readwrite')
    tx.objectStore(RETELLS_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ---------- Legacy v1 story compatibility ----------
// The v1 sync layer and Parent Corner still call `loadStories`, `saveStory`,
// `getStory`, `deleteStory`. Bridge those to the Book store via migration.

// Import migrator lazily to avoid a circular type import in some environments.
import { legacyToBook, bookToLegacy } from './migrate'

export function loadStories(): Book[] {
  // Read the v1 store first, migrate anything not already present in the v2 store.
  if (typeof window === 'undefined') return loadBooks()
  try {
    const raw = window.localStorage.getItem('azad-stories-v1')
    if (raw) {
      const legacy = JSON.parse(raw) as unknown[]
      const migrated = legacy
        .map((s) => {
          try {
            return legacyToBook(s)
          } catch {
            return null
          }
        })
        .filter((b): b is Book => b !== null)
      if (migrated.length) {
        const known = new Set(loadBooks().map((b) => b.id))
        for (const b of migrated) if (!known.has(b.id)) saveBook(b)
        // Wipe v1 store — migration is one-way. Idempotent because saveBook dedupes.
        window.localStorage.removeItem('azad-stories-v1')
      }
    }
  } catch {
    /* fresh start or non-parseable v1 data — ignore */
  }
  return loadBooks()
}

export function saveStory(book: Book) {
  saveBook(book)
}

export function getStory(id: string): Book | undefined {
  return getBook(id)
}

export function deleteStory(id: string) {
  deleteBook(id)
}

// Re-export the legacy shape helper for sync-layer round trips.
export { bookToLegacy }
