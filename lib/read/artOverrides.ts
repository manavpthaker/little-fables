// Client helper: fetch approved art overrides so the reader + shelf light up
// with approved illustrations without a redeploy. Non-blocking and best-effort
// — any failure (offline, art env not configured) resolves to empty, and the
// UI just shows the drawn placeholders. Reading never waits on this.

export interface BookOverrides {
  cover?: string
  /** keyed "chapterIdx-pageIdx" → public image url */
  pages: Record<string, string>
}

const bookCache = new Map<string, BookOverrides>()
let coversCache: Record<string, string> | null = null

export async function fetchBookOverrides(bookId: string): Promise<BookOverrides> {
  if (bookCache.has(bookId)) return bookCache.get(bookId)!
  const empty: BookOverrides = { pages: {} }
  try {
    const r = await fetch(`/api/art/live?book=${encodeURIComponent(bookId)}`)
    if (!r.ok) return empty
    const j = (await r.json()) as { cover?: string; pages?: Record<string, string> }
    const out: BookOverrides = { cover: j.cover, pages: j.pages ?? {} }
    bookCache.set(bookId, out)
    return out
  } catch {
    return empty
  }
}

export async function fetchCoverOverrides(): Promise<Record<string, string>> {
  if (coversCache) return coversCache
  try {
    const r = await fetch('/api/art/live?covers=1')
    if (!r.ok) return {}
    const j = (await r.json()) as { covers?: Record<string, string> }
    coversCache = j.covers ?? {}
    return coversCache
  } catch {
    return {}
  }
}
