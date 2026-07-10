// Cross-device sync for the kid app.
// The local stores (localStorage for stories/universe, IndexedDB for retell
// audio) stay the read source — sync is write-through. Every mutation calls
// push*; startup calls pullAll(). When Supabase isn't configured or the user
// isn't signed in, every function silently no-ops (kid app works offline /
// unpaired exactly as it did before).

import { createClient } from '@/lib/supabase/client'
import type { Story } from '@/types/story'
import type { Universe } from '@/lib/universe/azad-verse'
import { saveUniverse as saveLocalUniverse } from '@/lib/universe/azad-verse'
import { listRetells, loadStories, saveStory as saveLocalStory, saveRetell as saveLocalRetell, type Retell } from './storage'

const BUCKET = 'reader-retells'

// Return { supabase, userId } if we can reach the DB with an authenticated
// session, otherwise null. Every sync helper starts with this guard.
async function session() {
  const supabase = createClient()
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  const userId = data.user?.id
  if (!userId) return null
  return { supabase, userId }
}

// ---------- Stories ----------

export async function pushStory(story: Story): Promise<void> {
  const s = await session()
  if (!s) return
  const { error } = await s.supabase.from('reader_stories').upsert(
    {
      id: story.id,
      user_id: s.userId,
      title: story.title,
      by: story.by ?? null,
      cover_image: story.coverImage ?? null,
      cover_emoji: story.coverEmoji,
      cover_bg: story.coverBg,
      status: story.status,
      source: story.source,
      teaching_goals: story.teachingGoals,
      vocab: story.vocab,
      pages: story.pages,
      retell_prompts: story.retellPrompts,
      idea: story.idea ?? null,
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
    .select('*')
    .eq('user_id', s.userId)
  if (error) {
    console.warn('[sync] pullStories failed:', error.message)
    return
  }
  if (!data) return
  const localIds = new Set(loadStories().map((s) => s.id))
  for (const row of data) {
    const story: Story = {
      id: row.id,
      title: row.title,
      by: row.by ?? undefined,
      coverImage: row.cover_image ?? undefined,
      coverEmoji: row.cover_emoji,
      coverBg: row.cover_bg,
      status: row.status,
      source: row.source,
      teachingGoals: row.teaching_goals ?? [],
      vocab: row.vocab ?? [],
      pages: row.pages,
      retellPrompts: row.retell_prompts ?? [],
      idea: row.idea ?? undefined,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    }
    // Always write the remote row into local — remote is the source of truth
    // for cross-device merges. Fine because saveLocalStory already dedupes by id.
    saveLocalStory(story)
    localIds.add(story.id)
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

// ---------- Retells (metadata + audio) ----------

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
      story_id: r.storyId,
      story_title: r.storyTitle,
      mime_type: r.mimeType,
      audio_path: path,
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
      storyId: row.story_id,
      storyTitle: row.story_title,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      mimeType: row.mime_type ?? dl.data.type,
      blob: dl.data,
    })
  }
}

// ---------- Startup pull ----------

export async function pullAll(): Promise<void> {
  const s = await session()
  if (!s) return
  await Promise.all([pullStories(), pullUniverse(), pullRetells()])
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
