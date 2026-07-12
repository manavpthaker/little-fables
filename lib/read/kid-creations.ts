// Little Fables v3 — kid-creation daily counter.
// Tracks how many stories the child has driven through the story kitchen today
// so we can honor the parent-configured `maxCreationsPerDay` guardrail without
// pinging the server. Persists in localStorage; resets when the ISO date rolls
// over.
//
// Cap comes from the parent-side profile guardrails (Agent B). The store here
// deliberately doesn't know the cap — the caller passes it in via
// `remaining(cap)` so the source of truth stays with the profile.

const KEY = 'lf-kid-creations-v1'

interface Counter {
  /** Today's count. */
  count: number
  /** ISO date (YYYY-MM-DD) the count belongs to. */
  date: string
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function read(): Counter {
  if (typeof window === 'undefined') return { count: 0, date: todayISO() }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { count: 0, date: todayISO() }
    const parsed = JSON.parse(raw) as Partial<Counter>
    const date = typeof parsed.date === 'string' ? parsed.date : todayISO()
    const count = typeof parsed.count === 'number' && parsed.count >= 0 ? parsed.count : 0
    // Roll over on a new day.
    if (date !== todayISO()) return { count: 0, date: todayISO() }
    return { count, date }
  } catch {
    return { count: 0, date: todayISO() }
  }
}

function write(c: Counter): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(c))
  } catch {
    /* quota / private-mode — ignore */
  }
}

/** How many stories the child has finished creating today. */
export function todaysCount(): number {
  return read().count
}

/** Bump the counter by 1. Idempotent per day-roll. */
export function recordCreation(): void {
  const c = read()
  write({ count: c.count + 1, date: c.date })
}

/**
 * How many more creations the child is allowed today given the parent-set cap.
 * Never returns a negative number.
 */
export function remaining(cap: number): number {
  if (!Number.isFinite(cap) || cap <= 0) return 0
  const c = read()
  return Math.max(0, cap - c.count)
}
