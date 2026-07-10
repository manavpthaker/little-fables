// Local-first storage for the reader app.
// Stories: localStorage (small JSON). Retell audio: IndexedDB (blobs).

import type { Story } from '@/types/story'

const STORIES_KEY = 'azad-stories-v1'

export function loadStories(): Story[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(STORIES_KEY) ?? '[]') as Story[]
  } catch {
    return []
  }
}

export function saveStory(story: Story) {
  const stories = loadStories().filter((s) => s.id !== story.id)
  stories.unshift(story)
  // keep the latest 60 to stay under localStorage limits
  window.localStorage.setItem(STORIES_KEY, JSON.stringify(stories.slice(0, 60)))
}

export function deleteStory(id: string) {
  window.localStorage.setItem(
    STORIES_KEY,
    JSON.stringify(loadStories().filter((s) => s.id !== id))
  )
}

export function getStory(id: string): Story | undefined {
  return loadStories().find((s) => s.id === id)
}

// ---------- Retell recordings (IndexedDB) ----------

export interface Retell {
  id: string
  storyId: string
  storyTitle: string
  createdAt: number
  mimeType: string
  blob: Blob
}

const DB_NAME = 'azad-read'
const STORE = 'retells'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveRetell(r: Retell): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(r)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function listRetells(): Promise<Retell[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve((req.result as Retell[]).sort((a, b) => b.createdAt - a.createdAt))
    req.onerror = () => reject(req.error)
  })
}

export async function deleteRetell(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
