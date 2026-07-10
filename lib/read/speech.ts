// Voice utilities for the reader app.
// - speak(): read-aloud with per-word callbacks (uses boundary events when the
//   platform fires them — iOS often doesn't — with a timer fallback)
// - listen(): speech recognition wrapper (webkitSpeechRecognition on iOS/Safari)
// - createRecorder(): MediaRecorder wrapper for "tell it back" recordings

export interface SpeakHandle {
  cancel: () => void
}

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

let cachedVoice: SpeechSynthesisVoice | null = null

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  const prefs = ['Samantha', 'Karen', 'Daniel', 'Google US English']
  for (const p of prefs) {
    const v = voices.find((v) => v.name.includes(p))
    if (v) { cachedVoice = v; return v }
  }
  cachedVoice = voices.find((v) => v.lang.startsWith('en')) ?? voices[0]
  return cachedVoice
}

// iOS loads voices async
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => { cachedVoice = null; pickVoice() }
}

export function speak(
  text: string,
  opts: {
    rate?: number
    onWord?: (wordIndex: number) => void
    onEnd?: () => void
  } = {}
): SpeakHandle {
  if (!speechAvailable()) { opts.onEnd?.(); return { cancel: () => {} } }

  const synth = window.speechSynthesis
  synth.cancel()

  const words = text.split(/\s+/).filter(Boolean)
  const utter = new SpeechSynthesisUtterance(text)
  utter.rate = opts.rate ?? 0.92
  utter.pitch = 1.05
  const voice = pickVoice()
  if (voice) utter.voice = voice

  let cancelled = false
  let boundaryFired = false
  let timer: ReturnType<typeof setInterval> | null = null

  // Fallback word timer: estimate ~ (60/150wpm) adjusted by rate
  const msPerWord = (60000 / 160) / (utter.rate)
  let wIdx = 0

  const startFallback = () => {
    if (timer) return
    timer = setInterval(() => {
      if (cancelled || boundaryFired) { if (timer) clearInterval(timer); return }
      if (wIdx < words.length) opts.onWord?.(wIdx++)
    }, msPerWord)
  }

  // Map char index -> word index for boundary events
  const wordStarts: number[] = []
  {
    let i = 0
    for (const w of words) {
      const at = text.indexOf(w, i)
      wordStarts.push(at)
      i = at + w.length
    }
  }

  utter.onboundary = (e: SpeechSynthesisEvent) => {
    if (e.name && e.name !== 'word') return
    boundaryFired = true
    if (timer) { clearInterval(timer); timer = null }
    let idx = 0
    for (let i = 0; i < wordStarts.length; i++) {
      if (wordStarts[i] <= e.charIndex) idx = i
      else break
    }
    opts.onWord?.(idx)
  }

  utter.onstart = () => { if (!boundaryFired) startFallback() }
  utter.onend = () => {
    if (timer) clearInterval(timer)
    if (!cancelled) opts.onEnd?.()
  }
  utter.onerror = () => {
    if (timer) clearInterval(timer)
    if (!cancelled) opts.onEnd?.()
  }

  synth.speak(utter)

  return {
    cancel: () => {
      cancelled = true
      if (timer) clearInterval(timer)
      synth.cancel()
    },
  }
}

// ---------- Speech recognition ----------

type SR = {
  new (): SpeechRecognitionLike
}
interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: ((e: unknown) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

export function recognitionAvailable(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as unknown as Record<string, unknown>
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition)
}

export interface ListenHandle {
  stop: () => void
}

/** Listen for one utterance; resolves transcript via onResult. */
export function listen(opts: {
  onResult: (transcript: string) => void
  onEnd?: () => void
  timeoutMs?: number
}): ListenHandle {
  if (!recognitionAvailable()) {
    opts.onEnd?.()
    return { stop: () => {} }
  }
  const w = window as unknown as Record<string, unknown>
  const Ctor = (w.SpeechRecognition || w.webkitSpeechRecognition) as SR
  const rec = new Ctor()
  rec.lang = 'en-US'
  rec.interimResults = false
  rec.maxAlternatives = 3
  rec.continuous = false

  let done = false
  const finish = () => {
    if (done) return
    done = true
    opts.onEnd?.()
  }

  const timeout = setTimeout(() => { try { rec.stop() } catch {} }, opts.timeoutMs ?? 8000)

  rec.onresult = (e) => {
    clearTimeout(timeout)
    const t = e.results[0]?.[0]?.transcript ?? ''
    opts.onResult(t)
  }
  rec.onend = () => { clearTimeout(timeout); finish() }
  rec.onerror = () => { clearTimeout(timeout); finish() }

  try { rec.start() } catch { finish() }

  return {
    stop: () => { clearTimeout(timeout); try { rec.stop() } catch {}; finish() },
  }
}

/** Fuzzy keyword match for spoken answers */
export function matchesAny(transcript: string, keywords: string[]): boolean {
  const t = transcript.toLowerCase()
  return keywords.some((k) => t.includes(k.toLowerCase()))
}

// ---------- Recorder (tell it back) ----------

export interface RecorderHandle {
  stop: () => Promise<Blob>
  cancel: () => void
  mimeType: string
}

export async function createRecorder(): Promise<RecorderHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mime = MediaRecorder.isTypeSupported('audio/mp4')
    ? 'audio/mp4'
    : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : ''
  const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
  const chunks: BlobPart[] = []
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
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
        rec.stop()
      }),
    cancel: () => { try { rec.stop() } catch {}; stopTracks() },
  }
}
