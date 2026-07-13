// Server-only Supabase admin client + storage/table helpers for the
// production art pipeline.
//
// Uses the SERVICE ROLE key (never exposed to the client) so the art routes can
// write to Storage and the art_artifacts table regardless of RLS. If the art
// env isn't configured yet, `admin()` returns null and every route degrades to
// a clear 503 instead of crashing — so this can ship before Supabase is set up.
//
// Buckets (see docs/art-production-setup.md):
//   art-candidates  PRIVATE — every generated candidate; viewed via signed URLs
//   art-live        PUBLIC  — only approved images; the reader reads these
//
// Env required in production (Vercel):
//   NEXT_PUBLIC_SUPABASE_URL   (already set)
//   SUPABASE_SERVICE_ROLE_KEY  (NEW — server only, never NEXT_PUBLIC_*)

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const CANDIDATES_BUCKET = 'art-candidates'
export const LIVE_BUCKET = 'art-live'
export const ARTIFACTS_TABLE = 'art_artifacts'

let cached: SupabaseClient | null | undefined

/** The service-role client, or null when the art env isn't configured. */
export function admin(): SupabaseClient | null {
  if (cached !== undefined) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    cached = null
    return null
  }
  cached = createClient(url, key, { auth: { persistSession: false } })
  return cached
}

/** True when the production art pipeline is provisioned. */
export function artConfigured(): boolean {
  return admin() !== null
}

// ---------- artifact row ----------

export type ArtKind = 'sheet' | 'scene' | 'cover'
export type ArtStatus = 'pending' | 'approved' | 'rejected'

export interface ArtArtifact {
  id: string
  kind: ArtKind
  character_id: string | null
  book_id: string | null
  chapter_idx: number | null
  page_idx: number | null
  candidate_path: string // path in CANDIDATES_BUCKET
  live_url: string | null // public URL in LIVE_BUCKET, set on approval
  status: ArtStatus
  model: string | null
  created_at: string
  approved_at: string | null
}

// ---------- storage helpers ----------

/** Upload a candidate image to the private bucket; returns its storage path. */
export async function uploadCandidate(
  db: SupabaseClient,
  path: string,
  bytes: Buffer,
  contentType: string,
): Promise<void> {
  const { error } = await db.storage
    .from(CANDIDATES_BUCKET)
    .upload(path, bytes, { contentType, upsert: true })
  if (error) throw new Error(`candidate upload failed: ${error.message}`)
}

/** Short-lived signed URL so the Art tab can preview a private candidate. */
export async function signedCandidateUrl(
  db: SupabaseClient,
  path: string,
  expiresIn = 600,
): Promise<string | null> {
  const { data, error } = await db.storage
    .from(CANDIDATES_BUCKET)
    .createSignedUrl(path, expiresIn)
  return error ? null : (data?.signedUrl ?? null)
}

/** Copy an approved candidate into the PUBLIC live bucket; returns its public
 *  URL. Kept as a copy (not a move) so the original candidate/audit stays. */
export async function publishToLive(
  db: SupabaseClient,
  candidatePath: string,
  livePath: string,
  contentType: string,
): Promise<string> {
  const dl = await db.storage.from(CANDIDATES_BUCKET).download(candidatePath)
  if (dl.error || !dl.data) throw new Error(`download candidate failed: ${dl.error?.message}`)
  const buf = Buffer.from(await dl.data.arrayBuffer())
  const up = await db.storage.from(LIVE_BUCKET).upload(livePath, buf, { contentType, upsert: true })
  if (up.error) throw new Error(`live upload failed: ${up.error.message}`)
  const { data } = db.storage.from(LIVE_BUCKET).getPublicUrl(livePath)
  return data.publicUrl
}
