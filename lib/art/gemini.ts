// Tiny wrapper around Google's Generative Language API for image generation.
//
// The primary model is `gemini-2.5-flash-image-preview` ("Nano Banana Pro"),
// which returns inline base64 PNGs on the `candidates[i].content.parts[j]
// .inlineData` path. If Google flips the model id (they have before), we
// fall back through a short list of known image-capable model ids and log
// which one worked so future runs can prefer it.
//
// This file assumes fetch is global (Node 20+ / Next runtime — both fine).

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// Ordered from most preferred → fallback. First entry that returns an image
// wins and its id is echoed back so the caller records it in meta.json.
// Model ids verified against Generative Language API v1beta ListModels
// (July 2026): the flagship is `gemini-3-pro-image` ("Nano Banana Pro");
// `gemini-3.1-flash-image` is "Nano Banana 2" (faster/cheaper); `gemini-2.5-
// flash-image` is the original "Nano Banana". Imagen models use a
// `:predict` endpoint (not generateContent) so they're not in this list.
export const GEMINI_IMAGE_MODELS = [
  'gemini-3-pro-image',
  'gemini-3.1-flash-image',
  'gemini-2.5-flash-image',
] as const

export type GeminiImageModel = string

export interface GeminiImagePart {
  /** MIME type: 'image/png' | 'image/jpeg' */
  mimeType: string
  /** Base64-encoded image data (no data-URI prefix). */
  data: string
}

export interface GeminiCallOpts {
  apiKey: string
  /** Text prompt (required). */
  prompt: string
  /** Optional reference images to condition on (multi-modal input). */
  referenceImages?: GeminiImagePart[]
  /** How many candidate images to return (1-4). */
  candidateCount?: number
  /** Optional model override — otherwise cascades through GEMINI_IMAGE_MODELS. */
  preferModel?: GeminiImageModel
  /** Set to true to force-print the raw error body on failure (verbose debug). */
  verbose?: boolean
}

export interface GeminiCandidate {
  /** Base64 PNG data (no data-URI prefix). */
  base64: string
  /** MIME type reported by the API. */
  mimeType: string
}

export interface GeminiCallResult {
  candidates: GeminiCandidate[]
  /** The model id that ultimately succeeded. */
  model: GeminiImageModel
  /** True if this call retried after rate-limiting / 5xx. */
  retried?: boolean
}

interface GenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
        inlineData?: { mimeType: string; data: string }
        // Some model variants use camelCase differently.
        inline_data?: { mime_type: string; data: string }
      }>
    }
    finishReason?: string
  }>
  promptFeedback?: unknown
  error?: { code: number; message: string; status: string }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function extractCandidates(json: GenerateContentResponse): GeminiCandidate[] {
  const out: GeminiCandidate[] = []
  for (const c of json.candidates ?? []) {
    for (const p of c.content?.parts ?? []) {
      const inline = p.inlineData ?? (p.inline_data
        ? { mimeType: p.inline_data.mime_type, data: p.inline_data.data }
        : undefined)
      if (inline && typeof inline.data === 'string') {
        out.push({ base64: inline.data, mimeType: inline.mimeType || 'image/png' })
      }
    }
  }
  return out
}

async function tryOneModel(
  model: GeminiImageModel,
  opts: GeminiCallOpts,
): Promise<{ ok: true; candidates: GeminiCandidate[] } | { ok: false; status: number; body: string }> {
  const url = `${API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(opts.apiKey)}`
  const parts: Array<Record<string, unknown>> = []
  // Order matters for some models — send reference images first, then the
  // text prompt that references them.
  if (opts.referenceImages) {
    for (const img of opts.referenceImages) {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } })
    }
  }
  parts.push({ text: opts.prompt })

  // Nano Banana Pro (`gemini-3-pro-image`) rejects `candidateCount > 1`
  // with "Multiple candidates is not enabled for this model". Loop instead:
  // one API request per candidate. Also lets us bail early on error without
  // losing partial results.
  const wanted = Math.max(1, Math.min(4, opts.candidateCount ?? 1))
  const gathered: GeminiCandidate[] = []
  for (let n = 0; n < wanted; n++) {
    const body: Record<string, unknown> = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['Image'],
        candidateCount: 1,
      },
    }
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!resp.ok) {
      const errBody = await resp.text().catch(() => '')
      // If we've already gathered at least one image, surface those and mark
      // the model successful — the caller writes what it got.
      if (gathered.length > 0) break
      return { ok: false, status: resp.status, body: errBody }
    }
    const json = (await resp.json()) as GenerateContentResponse
    const cands = extractCandidates(json)
    if (cands.length === 0) {
      if (gathered.length > 0) break
      return { ok: false, status: 200, body: JSON.stringify(json).slice(0, 500) }
    }
    gathered.push(...cands)
  }
  return { ok: true, candidates: gathered }
}

/**
 * Generate images from Gemini with model cascade + one retry on transient
 * failures. Throws only when every model failed non-recoverably.
 */
export async function generateGeminiImage(opts: GeminiCallOpts): Promise<GeminiCallResult> {
  if (!opts.apiKey) throw new Error('GEMINI_API_KEY missing')

  const candidateModels: GeminiImageModel[] = opts.preferModel
    ? [opts.preferModel, ...GEMINI_IMAGE_MODELS.filter((m) => m !== opts.preferModel)]
    : [...GEMINI_IMAGE_MODELS]

  let lastError = ''
  let retried = false

  for (const model of candidateModels) {
    // First attempt.
    const first = await tryOneModel(model, opts)
    if (first.ok) return { candidates: first.candidates, model, retried }

    // 404/400 → wrong model id, move on. 429/5xx → one retry.
    if (first.status === 404 || first.status === 400) {
      if (opts.verbose) console.warn(`[gemini] ${model} → HTTP ${first.status}, trying next model`)
      lastError = `[${model} ${first.status}] ${first.body.slice(0, 200)}`
      continue
    }
    if (first.status === 429 || first.status >= 500) {
      retried = true
      await sleep(1500)
      const second = await tryOneModel(model, opts)
      if (second.ok) return { candidates: second.candidates, model, retried }
      lastError = `[${model} retry ${second.ok ? 'ok' : (second as { status: number }).status}] ${
        (second as { body?: string }).body?.slice(0, 200) ?? ''
      }`
      continue
    }
    // Other 4xx (401/403/etc.) → surface immediately.
    throw new Error(`Gemini ${model} failed: HTTP ${first.status} — ${first.body.slice(0, 300)}`)
  }

  throw new Error(`All Gemini image models failed. Last error: ${lastError || '(unknown)'}`)
}
