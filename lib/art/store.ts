// art_artifacts CRUD + publish, on top of the service-role admin client.
// Server-only.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  ARTIFACTS_TABLE,
  publishToLive,
  signedCandidateUrl,
  type ArtArtifact,
  type ArtKind,
} from './supabase-admin'

function extOf(path: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(path)
  return m ? m[1].toLowerCase() : 'jpg'
}
function contentTypeOf(path: string): string {
  const e = extOf(path)
  return e === 'png' ? 'image/png' : e === 'webp' ? 'image/webp' : 'image/jpeg'
}

export interface NewArtifact {
  kind: ArtKind
  characterId?: string
  bookId?: string
  chapterIdx?: number
  pageIdx?: number
  candidatePath: string
  model?: string
  prompt?: string
}

export async function insertPending(db: SupabaseClient, a: NewArtifact): Promise<string> {
  const { data, error } = await db
    .from(ARTIFACTS_TABLE)
    .insert({
      kind: a.kind,
      character_id: a.characterId ?? null,
      book_id: a.bookId ?? null,
      chapter_idx: a.chapterIdx ?? null,
      page_idx: a.pageIdx ?? null,
      candidate_path: a.candidatePath,
      model: a.model ?? null,
      prompt: a.prompt ?? null,
      status: 'pending',
    })
    .select('id')
    .single()
  if (error) throw new Error(`insert artifact failed: ${error.message}`)
  return data.id as string
}

async function fetchById(db: SupabaseClient, id: string): Promise<ArtArtifact> {
  const { data, error } = await db.from(ARTIFACTS_TABLE).select('*').eq('id', id).single()
  if (error || !data) throw new Error(`artifact ${id} not found`)
  return data as ArtArtifact
}

/** Approve: copy candidate → public live bucket, flip status, store live_url. */
export async function approveArtifact(db: SupabaseClient, id: string): Promise<string> {
  const row = await fetchById(db, id)
  if (row.status === 'approved' && row.live_url) return row.live_url
  const ext = extOf(row.candidate_path)
  const livePath =
    row.kind === 'sheet'
      ? `sheets/${row.character_id}.${ext}`
      : row.kind === 'cover'
        ? `books/${row.book_id}/cover.${ext}`
        : `books/${row.book_id}/${row.chapter_idx}-${row.page_idx}.${ext}`
  const liveUrl = await publishToLive(db, row.candidate_path, livePath, contentTypeOf(row.candidate_path))

  // Supersede any previously-approved artifact for the same slot.
  const match = db.from(ARTIFACTS_TABLE).update({ status: 'rejected' }).eq('status', 'approved')
  if (row.kind === 'sheet') await match.eq('kind', 'sheet').eq('character_id', row.character_id).neq('id', id)
  else if (row.kind === 'cover') await match.eq('kind', 'cover').eq('book_id', row.book_id).neq('id', id)
  else
    await match
      .eq('kind', 'scene')
      .eq('book_id', row.book_id)
      .eq('chapter_idx', row.chapter_idx)
      .eq('page_idx', row.page_idx)
      .neq('id', id)

  const { error } = await db
    .from(ARTIFACTS_TABLE)
    .update({ status: 'approved', live_url: liveUrl, approved_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(`approve update failed: ${error.message}`)
  return liveUrl
}

export async function rejectArtifact(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from(ARTIFACTS_TABLE).update({ status: 'rejected' }).eq('id', id)
  if (error) throw new Error(`reject failed: ${error.message}`)
}

// ---------- listings for the Art tab ----------

export interface SheetGroup {
  characterId: string
  pending: Array<{ id: string; url: string }>
  approvedUrl: string | null
}

export async function listSheetArtifacts(db: SupabaseClient): Promise<SheetGroup[]> {
  const { data, error } = await db
    .from(ARTIFACTS_TABLE)
    .select('*')
    .eq('kind', 'sheet')
    .in('status', ['pending', 'approved'])
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  const byChar = new Map<string, SheetGroup>()
  for (const r of (data ?? []) as ArtArtifact[]) {
    const cid = r.character_id ?? 'unknown'
    if (!byChar.has(cid)) byChar.set(cid, { characterId: cid, pending: [], approvedUrl: null })
    const g = byChar.get(cid)!
    if (r.status === 'approved') g.approvedUrl = g.approvedUrl ?? r.live_url
    else {
      const url = await signedCandidateUrl(db, r.candidate_path)
      if (url) g.pending.push({ id: r.id, url })
    }
  }
  return [...byChar.values()]
}

export interface ScenePending {
  id: string
  chapterIdx: number | null
  pageIdx: number | null
  kind: ArtKind
  url: string
}

export async function listSceneArtifacts(
  db: SupabaseClient,
  bookId: string,
): Promise<{ pending: ScenePending[]; approved: ScenePending[] }> {
  const { data, error } = await db
    .from(ARTIFACTS_TABLE)
    .select('*')
    .eq('book_id', bookId)
    .in('kind', ['scene', 'cover'])
    .in('status', ['pending', 'approved'])
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  const pending: ScenePending[] = []
  const approved: ScenePending[] = []
  for (const r of (data ?? []) as ArtArtifact[]) {
    if (r.status === 'approved' && r.live_url) {
      approved.push({ id: r.id, chapterIdx: r.chapter_idx, pageIdx: r.page_idx, kind: r.kind, url: r.live_url })
    } else if (r.status === 'pending') {
      const url = await signedCandidateUrl(db, r.candidate_path)
      if (url) pending.push({ id: r.id, chapterIdx: r.chapter_idx, pageIdx: r.page_idx, kind: r.kind, url })
    }
  }
  return { pending, approved }
}

// ---------- live overrides for the reader/shelf ----------

export interface BookOverrides {
  cover?: string
  /** keyed "chapterIdx-pageIdx" → url */
  pages: Record<string, string>
}

export async function approvedOverridesForBook(
  db: SupabaseClient,
  bookId: string,
): Promise<BookOverrides> {
  const { data, error } = await db
    .from(ARTIFACTS_TABLE)
    .select('kind, chapter_idx, page_idx, live_url')
    .eq('book_id', bookId)
    .eq('status', 'approved')
  if (error) throw new Error(error.message)
  const out: BookOverrides = { pages: {} }
  for (const r of (data ?? []) as Partial<ArtArtifact>[]) {
    if (!r.live_url) continue
    if (r.kind === 'cover') out.cover = r.live_url
    else if (r.kind === 'scene') out.pages[`${r.chapter_idx}-${r.page_idx}`] = r.live_url
  }
  return out
}

/** All approved covers, for lighting up the shelf. bookId → cover url. */
export async function approvedCovers(db: SupabaseClient): Promise<Record<string, string>> {
  const { data, error } = await db
    .from(ARTIFACTS_TABLE)
    .select('book_id, live_url')
    .eq('kind', 'cover')
    .eq('status', 'approved')
  if (error) throw new Error(error.message)
  const out: Record<string, string> = {}
  for (const r of (data ?? []) as Partial<ArtArtifact>[]) {
    if (r.book_id && r.live_url) out[r.book_id] = r.live_url
  }
  return out
}
