// Voice module v2 — provider-agnostic interfaces + concrete web implementations.
//
// Contract (see docs/voice-architecture.md):
//   - No webkitSpeechRecognition anywhere (dead in installed iOS PWAs).
//   - No navigator.* speech APIs outside this file.
//   - TTS: cached ElevenLabs audio + word-level timestamps via /api/tts,
//     played through HTMLAudioElement, with a graceful speechSynthesis fallback
//     ONLY when the caller opts in.
//   - STT: MediaRecorder → /api/listen → server transcription.
//   - Feature-detect Capacitor at runtime and defer to a (stub) native provider.
//   - IndexedDB page-audio cache on DB azad-read, store page-audio, version 3.
//     Preserves the existing `retells` store from version 2.

// ---------------- Types ----------------

export interface WordTimestamp {
  word: string
  /** Seconds from the start of the audio. */
  start: number
  end: number
}

export interface TtsResult {
  audio: Blob
  mimeType: string
  timestamps: WordTimestamp[]
}

/** Fetches TTS audio + word timings for a given text. Provider-agnostic. */
export interface TtsSource {
  fetch(text: string, opts?: { voice?: 'narrator' | 'buddy' }): Promise<TtsResult>
}

/** Transcribes a recorded audio blob into text. Provider-agnostic. */
export interface TranscriptionProvider {
  transcribe(audio: Blob): Promise<string>
}

/** Plays an audio+timestamps pair with per-word callbacks. */
export interface AudioSession {
  play(): Promise<void>
  pause(): void
  seek(seconds: number): void
  cancel(): void
  readonly duration: number
}

export interface SpeakHandle {
  cancel: () => void
}

export interface ListenHandle {
  stop: () => void
}

export interface RecorderHandle {
  stop(): Promise<Blob>
  cancel(): void
  mimeType: string
}

// ---------------- Capacitor bridge (native shell — stubbed) ----------------

interface CapacitorLike {
  isNativePlatform?: () => boolean
}

function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as unknown as { Capacitor?: CapacitorLike }).Capacitor
  try {
    return Boolean(cap && cap.isNativePlatform && cap.isNativePlatform())
  } catch {
    return false
  }
}

/**
 * Native providers are wired by the Capacitor shell (Phase 6). For now these
 * throw so the plumbing exists and mistakes are loud rather than silent.
 */
export const nativeTtsSource: TtsSource = {
  async fetch() {
    throw new Error('native not wired')
  },
}
export const nativeTranscriptionProvider: TranscriptionProvider = {
  async transcribe() {
    throw new Error('native not wired')
  },
}

// ---------------- Web TTS via /api/tts ----------------

function b64ToBlob(b64: string, mime: string): Blob {
  const bin = atob(b64)
  const len = bin.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export const webTtsSource: TtsSource = {
  async fetch(text, opts) {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, voice: opts?.voice ?? 'narrator' }),
    })
    if (!res.ok) {
      let msg = `tts http ${res.status}`
      try {
        const j = (await res.json()) as { error?: string }
        if (j.error) msg = j.error
      } catch {
        // ignore
      }
      throw new Error(msg)
    }
    const data = (await res.json()) as {
      audioBase64: string
      mimeType: string
      timestamps: WordTimestamp[]
    }
    return {
      audio: b64ToBlob(data.audioBase64, data.mimeType),
      mimeType: data.mimeType,
      timestamps: data.timestamps,
    }
  },
}

// ---------------- AudioSession over HTMLAudioElement ----------------

class WebAudioSession implements AudioSession {
  private audio: HTMLAudioElement
  private objectUrl: string
  private timestamps: WordTimestamp[]
  private rafId: number | null = null
  private lastWordIdx = -1
  private cancelled = false
  private onWord?: (i: number) => void
  private onEnd?: () => void

  constructor(
    blob: Blob,
    timestamps: WordTimestamp[],
    onWord?: (i: number) => void,
    onEnd?: () => void,
  ) {
    this.objectUrl = URL.createObjectURL(blob)
    this.audio = new Audio(this.objectUrl)
    this.audio.preload = 'auto'
    this.timestamps = timestamps
    this.onWord = onWord
    this.onEnd = onEnd

    this.audio.onended = () => {
      this.stopTick()
      if (!this.cancelled) this.onEnd?.()
    }
    this.audio.onerror = () => {
      this.stopTick()
      if (!this.cancelled) this.onEnd?.()
    }
  }

  get duration(): number {
    return isFinite(this.audio.duration) ? this.audio.duration : 0
  }

  async play(): Promise<void> {
    try {
      await this.audio.play()
      this.startTick()
    } catch {
      // autoplay blocked or similar — surface as end so caller can retry
      this.onEnd?.()
    }
  }

  pause(): void {
    this.audio.pause()
    this.stopTick()
  }

  seek(seconds: number): void {
    try {
      this.audio.currentTime = seconds
    } catch {
      // ignore
    }
  }

  cancel(): void {
    this.cancelled = true
    this.stopTick()
    try {
      this.audio.pause()
      this.audio.src = ''
    } catch {
      // ignore
    }
    try {
      URL.revokeObjectURL(this.objectUrl)
    } catch {
      // ignore
    }
  }

  private startTick() {
    if (!this.onWord) return
    const tick = () => {
      if (this.cancelled) return
      const t = this.audio.currentTime
      // Timestamps are sorted by start; find the last one whose start <= t.
      let idx = -1
      for (let i = 0; i < this.timestamps.length; i++) {
        if (this.timestamps[i].start <= t) idx = i
        else break
      }
      if (idx !== this.lastWordIdx && idx >= 0) {
        this.lastWordIdx = idx
        this.onWord?.(idx)
      }
      this.rafId = requestAnimationFrame(tick)
    }
    this.rafId = requestAnimationFrame(tick)
  }

  private stopTick() {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}

// ---------------- speak() ----------------

export interface SpeakOptions {
  onWord?: (wordIndex: number) => void
  onEnd?: () => void
  /** Provider override (default: web or native based on Capacitor detection). */
  source?: TtsSource
  /** Kid-app voice selection. */
  voice?: 'narrator' | 'buddy'
  /**
   * If the network TtsSource errors, fall back to device speechSynthesis.
   * Off by default — most callers want a hard failure so the UI can show
   * "The story machine hiccuped. Try again!" instead of a robot voice.
   */
  allowSpeechSynthFallback?: boolean
  /**
   * Optional seek — seconds from the start of the audio to begin playback at.
   * Only honored by the WebAudioSession path (network/cached TTS with real
   * timestamps). The speechSynth fallback ignores it (word-level seek isn't
   * possible with the browser synth). Guarded so `undefined` = current
   * behavior (back-compat).
   */
  startOffset?: number
}

function defaultTtsSource(): TtsSource {
  return isCapacitorNative() ? nativeTtsSource : webTtsSource
}

export function speak(text: string, opts: SpeakOptions = {}): SpeakHandle {
  if (typeof window === 'undefined') {
    opts.onEnd?.()
    return { cancel: () => {} }
  }

  const source = opts.source ?? defaultTtsSource()
  let session: AudioSession | null = null
  let synthCancel: (() => void) | null = null
  let cancelled = false

  const finish = () => {
    if (cancelled) return
    opts.onEnd?.()
  }

  ;(async () => {
    try {
      const result = await source.fetch(text, { voice: opts.voice })
      if (cancelled) return
      session = new WebAudioSession(result.audio, result.timestamps, opts.onWord, finish)
      if (typeof opts.startOffset === 'number' && opts.startOffset > 0) {
        session.seek(opts.startOffset)
      }
      await session.play()
    } catch (err) {
      if (cancelled) return
      if (opts.allowSpeechSynthFallback) {
        synthCancel = speakWithSpeechSynth(text, opts.onWord, finish)
      } else {
        // Surface as end so UI can show hiccup copy.
        finish()
        // Also rethrow to console for debugging.
        // eslint-disable-next-line no-console
        console.warn('speak(): TTS failed', err)
      }
    }
  })()

  return {
    cancel: () => {
      cancelled = true
      session?.cancel()
      synthCancel?.()
    },
  }
}

// ---- speechSynthesis fallback (opt-in only) ----

let cachedSynthVoice: SpeechSynthesisVoice | null = null
function pickSynthVoice(): SpeechSynthesisVoice | null {
  if (cachedSynthVoice) return cachedSynthVoice
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  const prefs = ['Samantha', 'Karen', 'Daniel', 'Google US English']
  for (const p of prefs) {
    const v = voices.find((vv) => vv.name.includes(p))
    if (v) {
      cachedSynthVoice = v
      return v
    }
  }
  cachedSynthVoice = voices.find((v) => v.lang.startsWith('en')) ?? voices[0]
  return cachedSynthVoice
}

function speakWithSpeechSynth(
  text: string,
  onWord?: (i: number) => void,
  onEnd?: () => void,
): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.()
    return () => {}
  }
  const synth = window.speechSynthesis
  synth.cancel()

  const words = text.split(/\s+/).filter(Boolean)
  const wordStarts: number[] = []
  {
    let i = 0
    for (const w of words) {
      const at = text.indexOf(w, i)
      wordStarts.push(at)
      i = at + w.length
    }
  }

  const utter = new SpeechSynthesisUtterance(text)
  utter.rate = 0.92
  utter.pitch = 1.05
  const v = pickSynthVoice()
  if (v) utter.voice = v

  let cancelled = false
  utter.onboundary = (e: SpeechSynthesisEvent) => {
    if (e.name && e.name !== 'word') return
    let idx = 0
    for (let i = 0; i < wordStarts.length; i++) {
      if (wordStarts[i] <= e.charIndex) idx = i
      else break
    }
    onWord?.(idx)
  }
  utter.onend = () => {
    if (!cancelled) onEnd?.()
  }
  utter.onerror = () => {
    if (!cancelled) onEnd?.()
  }
  synth.speak(utter)
  return () => {
    cancelled = true
    try {
      synth.cancel()
    } catch {
      // ignore
    }
  }
}

// ---------------- STT: recorder + /api/listen ----------------

export async function createRecorder(): Promise<RecorderHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mime = MediaRecorder.isTypeSupported('audio/mp4')
    ? 'audio/mp4'
    : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : ''
  const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
  const chunks: BlobPart[] = []
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data)
  }
  rec.start()

  const stopTracks = () => stream.getTracks().forEach((t) => t.stop())

  return {
    mimeType: rec.mimeType,
    stop: () =>
      new Promise<Blob>((resolve) => {
        rec.onstop = () => {
          stopTracks()
          resolve(new Blob(chunks, { type: rec.mimeType }))
        }
        try {
          rec.stop()
        } catch {
          stopTracks()
          resolve(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }))
        }
      }),
    cancel: () => {
      try {
        rec.stop()
      } catch {
        // ignore
      }
      stopTracks()
    },
  }
}

export const webTranscriptionProvider: TranscriptionProvider = {
  async transcribe(audio) {
    const form = new FormData()
    // Give the file a real extension so servers that sniff on filename are happy.
    const ext =
      audio.type.includes('mp4') ? 'm4a' :
      audio.type.includes('webm') ? 'webm' :
      audio.type.includes('wav') ? 'wav' : 'bin'
    form.append('audio', audio, `clip.${ext}`)
    const res = await fetch('/api/listen', { method: 'POST', body: form })
    if (!res.ok) {
      let msg = `listen http ${res.status}`
      try {
        const j = (await res.json()) as { error?: string }
        if (j.error) msg = j.error
      } catch {
        // ignore
      }
      throw new Error(msg)
    }
    const data = (await res.json()) as { transcript: string }
    return data.transcript ?? ''
  },
}

function defaultTranscriptionProvider(): TranscriptionProvider {
  return isCapacitorNative() ? nativeTranscriptionProvider : webTranscriptionProvider
}

export interface ListenOptions {
  onResult: (transcript: string) => void
  onEnd?: () => void
  onError?: (err: unknown) => void
  timeoutMs?: number
  provider?: TranscriptionProvider
}

export function listen(opts: ListenOptions): ListenHandle {
  if (typeof window === 'undefined') {
    opts.onEnd?.()
    return { stop: () => {} }
  }

  const provider = opts.provider ?? defaultTranscriptionProvider()
  const timeoutMs = opts.timeoutMs ?? 8000
  let done = false
  let recorder: RecorderHandle | null = null
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null
  let stopped = false

  const finish = () => {
    if (done) return
    done = true
    if (timeoutHandle) clearTimeout(timeoutHandle)
    opts.onEnd?.()
  }

  const doStop = async () => {
    if (stopped) return
    stopped = true
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
      timeoutHandle = null
    }
    if (!recorder) {
      finish()
      return
    }
    try {
      const blob = await recorder.stop()
      if (!blob || blob.size === 0) {
        finish()
        return
      }
      const transcript = await provider.transcribe(blob)
      opts.onResult(transcript)
    } catch (err) {
      opts.onError?.(err)
    } finally {
      finish()
    }
  }

  ;(async () => {
    try {
      recorder = await createRecorder()
      timeoutHandle = setTimeout(() => {
        void doStop()
      }, timeoutMs)
    } catch (err) {
      opts.onError?.(err)
      finish()
    }
  })()

  return {
    stop: () => {
      void doStop()
    },
  }
}

// ---------------- Availability probe ----------------

export function recognitionAvailable(): boolean {
  if (typeof window === 'undefined') return false
  if (isCapacitorNative()) return true
  if (typeof navigator === 'undefined') return false
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    return false
  }
  if (typeof MediaRecorder === 'undefined') return false
  return true
}

// ---------------- Fast keyword pre-filter ----------------

/** Fuzzy keyword match. Used only as an offline fallback in the reader. */
export function matchesAny(transcript: string, keywords: string[]): boolean {
  const t = transcript.toLowerCase()
  return keywords.some((k) => t.includes(k.toLowerCase()))
}

// ---------------- IndexedDB page-audio cache ----------------

const DB_NAME = 'azad-read'
const DB_VERSION = 3
const RETELLS_STORE = 'retells' // preserved from v2
const PAGE_AUDIO_STORE = 'page-audio' // new in v3

export interface CachedPageAudio {
  key: string
  mimeType: string
  audio: Blob
  timestamps: WordTimestamp[]
}

function pageAudioKey(bookId: string, chapterIdx: number, pageIdx: number): string {
  return `${bookId}::${chapterIdx}::${pageIdx}`
}

let dbPromise: Promise<IDBDatabase> | null = null

function openAudioDb(): Promise<IDBDatabase> | null {
  if (typeof window === 'undefined') return null
  if (typeof indexedDB === 'undefined') return null
  if (dbPromise) return dbPromise
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      // Preserve retells store from v2 (create if missing so a fresh install works too).
      if (!db.objectStoreNames.contains(RETELLS_STORE)) {
        db.createObjectStore(RETELLS_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(PAGE_AUDIO_STORE)) {
        db.createObjectStore(PAGE_AUDIO_STORE, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('IDB open blocked'))
  }).catch((err) => {
    // Reset so we retry next call.
    dbPromise = null
    throw err
  })
  return dbPromise
}

export async function getCachedAudio(
  bookId: string,
  chapterIdx: number,
  pageIdx: number,
): Promise<CachedPageAudio | null> {
  if (typeof window === 'undefined') return null
  const p = openAudioDb()
  if (!p) return null
  try {
    const db = await p
    return await new Promise<CachedPageAudio | null>((resolve, reject) => {
      const tx = db.transaction(PAGE_AUDIO_STORE, 'readonly')
      const req = tx.objectStore(PAGE_AUDIO_STORE).get(pageAudioKey(bookId, chapterIdx, pageIdx))
      req.onsuccess = () => resolve((req.result as CachedPageAudio | undefined) ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

export async function putCachedAudio(
  bookId: string,
  chapterIdx: number,
  pageIdx: number,
  value: Omit<CachedPageAudio, 'key'>,
): Promise<void> {
  if (typeof window === 'undefined') return
  const p = openAudioDb()
  if (!p) return
  try {
    const db = await p
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PAGE_AUDIO_STORE, 'readwrite')
      tx.objectStore(PAGE_AUDIO_STORE).put({
        key: pageAudioKey(bookId, chapterIdx, pageIdx),
        mimeType: value.mimeType,
        audio: value.audio,
        timestamps: value.timestamps,
      } satisfies CachedPageAudio)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // best effort — cache failures should never break the reader
  }
}
