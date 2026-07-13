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

export function characterCandidateFilename(ts: string, idx: number): string {
  return `candidate-${ts}-${String(idx).padStart(2, '0')}.png`
}
export function characterCandidateMetaFilename(ts: string, idx: number): string {
  return `candidate-${ts}-${String(idx).padStart(2, '0')}.meta.json`
}

export function sceneCandidateFilename(
  chapterIdx: number,
  pageIdx: number,
  ts: string,
  idx: number,
): string {
  return `${chapterIdx}-${pageIdx}-candidate-${ts}-${String(idx).padStart(2, '0')}.png`
}
export function sceneCandidateMetaFilename(
  chapterIdx: number,
  pageIdx: number,
  ts: string,
  idx: number,
): string {
  return `${chapterIdx}-${pageIdx}-candidate-${ts}-${String(idx).padStart(2, '0')}.meta.json`
}
