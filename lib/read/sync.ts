// Cross-device sync for the kid app.
// Local stores stay the read source — sync is write-through, silently no-op
// when Supabase isn't configured or the user isn't signed in. v2 stores the
// full Book as a jsonb blob so schema changes on the app side don't require
// a migration on the Supabase side.

import { createClient } from '@/lib/supabase/client'
import type {
  Book,
  BuddyState,
  EarnedBadges,
  ReadingDays,
  Retell,
  WordBook,
  WorldState,
} from '@/types/story'
import type { Universe } from '@/lib/universe/azad-verse'
import { saveUniverse as saveLocalUniverse } from '@/lib/universe/azad-verse'
import {
  listRetells,
  loadBadges,
  loadBuddy,
  loadReadingDays,
  loadStories,
  loadWorldState,
  loadWordBook,
  saveBuddy as saveLocalBuddy,
  saveRetell as saveLocalRetell,
  saveStory as saveLocalBook,
  saveWorldState as saveLocalWorldState,
} from './storage'

const BUCKET = 'reader-retells'

async function session() {
  const supabase = createClient()
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  const userId = data.user?.id
  if (!userId) return null
  return { supabase, userId }
}

// ---------- Books ----------

export async function pushStory(book: Book): Promise<void> {
  const s = await session()
  if (!s) return
  const { error } = await s.supabase.from('reader_stories').upsert(
    {
      id: book.id,
      user_id: s.userId,
      title: book.title,
      by: book.by ?? null,
      cover_image: book.coverImage ?? null,
      cover_emoji: book.coverEmoji,
      cover_bg: book.coverBg ?? null,
      status: book.status,
      source: book.source,
      book,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )
  if (error) console.warn('[sync] pushStory failed:', error.message)
}

export async function pullStories(): Promise<void> {
  const s = await session()
  if (!s) return
  const { data, error } = await s.supabase
    .from('reader_stories')
    .select('book')
    .eq('user_id', s.userId)
  if (error) {
    console.warn('[sync] pullStories failed:', error.message)
    return
  }
  if (!data) return
  for (const row of data) {
    const book = (row as { book: Book | null }).book
    if (book && book.id) saveLocalBook(book)
  }
}

export async function deleteStoryRemote(id: string): Promise<void> {
  const s = await session()
  if (!s) return
  await s.supabase.from('reader_stories').delete().eq('id', id).eq('user_id', s.userId)
}

// ---------- Universe ----------

export async function pushUniverse(u: Universe): Promise<void> {
  const s = await session()
  if (!s) return
  const { error } = await s.supabase.from('reader_universe').upsert(
    {
      user_id: s.userId,
      data: u,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
  if (error) console.warn('[sync] pushUniverse failed:', error.message)
}

export async function pullUniverse(): Promise<void> {
  const s = await session()
  if (!s) return
  const { data, error } = await s.supabase
    .from('reader_universe')
    .select('data')
    .eq('user_id', s.userId)
    .maybeSingle()
  if (error) {
    console.warn('[sync] pullUniverse failed:', error.message)
    return
  }
  if (data?.data) saveLocalUniverse(data.data as Universe)
}

// ---------- Retells ----------

export async function pushRetell(r: Retell, blob: Blob): Promise<void> {
  const s = await session()
  if (!s) return
  const path = `${s.userId}/${r.id}`
  const up = await s.supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: r.mimeType,
    upsert: true,
  })
  if (up.error) {
    console.warn('[sync] pushRetell upload failed:', up.error.message)
    return
  }
  const { error } = await s.supabase.from('reader_retells').upsert(
    {
      id: r.id,
      user_id: s.userId,
      story_id: r.bookId,
      story_title: r.bookTitle,
      mime_type: r.mimeType,
      audio_path: path,
      transcript: r.transcript ?? null,
      created_at: new Date(r.createdAt).toISOString(),
    },
    { onConflict: 'id' }
  )
  if (error) console.warn('[sync] pushRetell metadata failed:', error.message)
}

export async function deleteRetellRemote(id: string): Promise<void> {
  const s = await session()
  if (!s) return
  const path = `${s.userId}/${id}`
  await s.supabase.storage.from(BUCKET).remove([path])
  await s.supabase.from('reader_retells').delete().eq('id', id).eq('user_id', s.userId)
}

export async function pullRetells(): Promise<void> {
  const s = await session()
  if (!s) return
  const { data, error } = await s.supabase
    .from('reader_retells')
    .select('*')
    .eq('user_id', s.userId)
  if (error) {
    console.warn('[sync] pullRetells failed:', error.message)
    return
  }
  if (!data) return
  const localIds = new Set((await listRetells()).map((r) => r.id))
  for (const row of data) {
    if (localIds.has(row.id)) continue
    const dl = await s.supabase.storage.from(BUCKET).download(row.audio_path)
    if (dl.error || !dl.data) continue
    await saveLocalRetell({
      id: row.id,
      bookId: row.story_id,
      bookTitle: row.story_title,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      mimeType: row.mime_type ?? dl.data.type,
      blob: dl.data,
      transcript: row.transcript ?? undefined,
    })
  }
}

// ---------- v2 state blob (buddy / badges / reading days / wordbook / worldstate) ----------
//
// The reader_state table stores a single per-user jsonb blob. Sync is dumb:
// on push we send the whole thing, on pull we merge the whole thing back into
// local. Localhost stays authoritative for last-write-wins because we compare
// updated_at.

interface StateBlob {
  buddy?: BuddyState
  badges?: EarnedBadges
  readingDays?: ReadingDays
  wordBook?: WordBook
  worldState?: WorldState
}

export async function pushState(): Promise<void> {
  const s = await session()
  if (!s) return
  const blob: StateBlob = {
    buddy: loadBuddy(),
    badges: loadBadges(),
    readingDays: loadReadingDays(),
    wordBook: loadWordBook(),
    worldState: loadWorldState(),
  }
  const { error } = await s.supabase.from('reader_state').upsert(
    {
      user_id: s.userId,
      data: blob,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
  if (error) console.warn('[sync] pushState failed:', error.message)
}

export async function pullState(): Promise<void> {
  const s = await session()
  if (!s) return
  const { data, error } = await s.supabase
    .from('reader_state')
    .select('data')
    .eq('user_id', s.userId)
    .maybeSingle()
  if (error) {
    console.warn('[sync] pullState failed:', error.message)
    return
  }
  const blob = data?.data as StateBlob | undefined
  if (!blob) return
  if (blob.buddy) saveLocalBuddy(blob.buddy)
  if (blob.worldState) saveLocalWorldState(blob.worldState)
  // Badges / reading days / wordbook: merge locally by union. Writing them all
  // through the storage module keeps the shape valid.
  if (blob.badges) {
    const local = loadBadges()
    const ids = Array.from(new Set([...local.ids, ...blob.badges.ids]))
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lf-badges-v2', JSON.stringify({ ids, pendingEarn: local.pendingEarn }))
    }
  }
  if (blob.readingDays) {
    const local = loadReadingDays()
    const daysLit = Array.from(new Set([...local.daysLit, ...blob.readingDays.daysLit]))
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lf-reading-days-v2', JSON.stringify({ daysLit }))
    }
  }
  if (blob.wordBook) {
    const local = loadWordBook()
    const byWord = new Map(local.words.map((w) => [w.word, w]))
    for (const w of blob.wordBook.words) if (!byWord.has(w.word)) byWord.set(w.word, w)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lf-wordbook-v2', JSON.stringify({ words: Array.from(byWord.values()) }))
    }
  }
}

// ---------- Startup pull ----------

export async function pullAll(): Promise<void> {
  const s = await session()
  if (!s) return
  await Promise.all([pullStories(), pullUniverse(), pullRetells(), pullState()])
}

// ---------- Sign-in helpers surfaced to Parent Corner ----------

export async function isSignedIn(): Promise<boolean> {
  const supabase = createClient()
  if (!supabase) return false
  const { data } = await supabase.auth.getUser()
  return !!data.user
}

export async function sendMagicLink(email: string, redirectTo: string): Promise<void> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  const supabase = createClient()
  if (!supabase) return
  await supabase.auth.signOut()
}

// Silence unused vars until callers of loadStories are wired.
void loadStories
