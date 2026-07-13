// Path helpers for the art pipeline. All paths are absolute (rooted at repo).
// The `public/art-preview` root is the source of truth for candidates and
// approvals — Parent Corner (Agent B) serves it statically for review.

import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

export const REPO_ROOT = process.cwd()
export const ART_PREVIEW_ROOT = join(REPO_ROOT, 'public', 'art-preview')

export function ensureDir(dir: string): string {
  mkdirSync(dir, { recursive: true })
  return dir
}

// ---------- Character sheets ----------
export function characterRoot(charId: string): string {
  return join(ART_PREVIEW_ROOT, 'sheets', charId)
}
export function characterPendingDir(charId: string): string {
  return ensureDir(join(characterRoot(charId), 'pending'))
}
export function characterApprovedDir(charId: string): string {
  return ensureDir(join(characterRoot(charId), 'approved'))
}

// ---------- Director plans ----------
export function directorDir(bookId: string): string {
  return ensureDir(join(ART_PREVIEW_ROOT, 'director', bookId))
}
export function directorPlanPath(bookId: string): string {
  return join(directorDir(bookId), 'plan.json')
}

// ---------- Scene candidates ----------
export function sceneRoot(bookId: string): string {
  return join(ART_PREVIEW_ROOT, 'scenes', bookId)
}
export function scenePendingDir(bookId: string): string {
  return ensureDir(join(sceneRoot(bookId), 'pending'))
}
export function sceneApprovedDir(bookId: string): string {
  return ensureDir(join(sceneRoot(bookId), 'approved'))
}

// ---------- Filename helpers ----------
export function timestampSlug(): string {
  const now = new Date()
  const pad = (n: number, w = 2) => String(n).padStart(w, '0')
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`
  )
}

/** Derive a file extension from a mime type returned by Gemini. Nano Banana
 *  Pro returns JPEG; the older 2.5-flash-image variant sometimes returns PNG.
 *  Approve-flow scans by prefix, so any extension is fine as long as sidecar
 *  meta.json ends with .meta.json. */
export function extFromMime(mimeType: string | undefined): 'png' | 'jpg' | 'webp' {
  const m = (mimeType || '').toLowerCase()
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg'
  if (m.includes('webp')) return 'webp'
  return 'png'
}

export function characterCandidateFilename(ts: string, idx: number, ext: string = 'png'): string {
  return `candidate-${ts}-${String(idx).padStart(2, '0')}.${ext}`
}
export function characterCandidateMetaFilename(ts: string, idx: number): string {
  return `candidate-${ts}-${String(idx).padStart(2, '0')}.meta.json`
}

export function sceneCandidateFilename(
  chapterIdx: number,
  pageIdx: number,
  ts: string,
  idx: number,
  ext: string = 'png',
): string {
  return `${chapterIdx}-${pageIdx}-candidate-${ts}-${String(idx).padStart(2, '0')}.${ext}`
}
export function sceneCandidateMetaFilename(
  chapterIdx: number,
  pageIdx: number,
  ts: string,
  idx: number,
): string {
  return `${chapterIdx}-${pageIdx}-candidate-${ts}-${String(idx).padStart(2, '0')}.meta.json`
}
