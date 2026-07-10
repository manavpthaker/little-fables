# Azad's Story World (`/read`)

The centerpiece of Little Fables: an Epic-style interactive reading PWA for the iPad, built on the [Storyverse](https://github.com/manavpthaker/storyverse) 5-layer framework. The kid app is the reader; parents make stories in the Parent Corner. The original creator canvas (`/story/create`, `/dashboard`) remains as the print-a-book offshoot.

## What's inside

- `/read` — Home / Bookshelf. Header shows a real star count (one per saved retell), a bedtime toggle (moon/sun), and the child's initial. The two-page spread renders in landscape (≥ ~1000px) and stacks on portrait/narrow screens. Kid nav is exactly Home / Grown-ups.
- `/read/story/[id]` — Reader. Landscape picture-book spread (art left, words right); word-by-word highlight while read aloud; ask blocks Next until answered (accepts anything after 2 misses so a 4-year-old is never hard-stuck); choice → "Your choice is changing the story…" → branch page (pre-baked for starter stories, live API continuation for generated ones). Full-bleed art pages supported (`bleed: true` — used by Azi's Little Bhen). Auto-reads each page. Coral Next (72px) is THE action; it grays out when blocked.
- End-of-story phase (rendered inline after the last page) — celebration, vocab stars (tap to hear the word and its meaning), and the "Tell it back" record card. The 96px coral mic uses the real `MediaRecorder`; retells save to IndexedDB and increment the star count.
- `/read/create` — Story Maker (parent-only). Reached only from Parent Corner. Pick a hero/place, or say an idea out loud; Claude generates a structured interactive story.
- `/read/parent` — Parent Corner. Gated by a multiplication question with three tappable answer buttons. Inter typography, shadcn neutrals, Lucide icons — quiet and plain, no emoji, no exclamation points. Lists all stories (starter + saved), plays retell recordings from IndexedDB, and edits Azad's universe (interests chips, teaching-goal toggles, family words).
- `app/api/story` — serverless route calling the Anthropic API; the Storyverse 5-layer prompt lives here. `vocab` is now `{ word, meaning }[]` for kid-friendly star words on the End screen.
- `lib/universe/azad-verse.ts` — Azad's universe defaults (companions Miko 🦊, Tara 🕷️, Boulder 🦕).

Design source of truth: `design/handoff/` (Claude Design bundle). Story text, asks, choices, vocab, and retell prompts for the three starter books come verbatim from `design/handoff/app/story-data.js`.

## Bedtime mode

Toggle the moon/sun button in the Home header. The whole kid surface flips: cream → indigo, coral → butter, warm shadows → dark. Persists in `localStorage` (`sw-bedtime-v1`). Parent and gate surfaces never flip.

## Local-first

- Stories: `localStorage`
- Retell recordings: `IndexedDB` (blobs)
- Universe edits: `localStorage`
- No login, no account. Starter stories always work offline; the Story Maker (`/read/create`) needs a network for generation.
- Supabase env vars are optional if you only use `/read` — middleware bypasses Supabase for `/read`, `/api/story`, `/sw.js`, `/manifest.webmanifest`, and `/icons/`.

## Setup

1. Add the API key (the only required env var for the reader):
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   # optional: STORY_MODEL=claude-sonnet-4-5 (default)
   ```
2. Run locally: `npm run dev` → http://localhost:3000/read
3. Deploy: push to Vercel, set `ANTHROPIC_API_KEY` in Project → Settings → Environment Variables.

## Install on the iPad

1. Open the deployed URL in Safari → it lands on `/read`
2. Share button → **Add to Home Screen**
3. The icon opens fullscreen straight into the bookshelf
4. First tap on 🔊 or 🎤 will ask for speaker/mic permission — allow it once

Voice notes: read-aloud uses the iPad's built-in voices (works offline). Speaking answers uses Safari's speech recognition (needs network). If recognition is unavailable, every voice interaction has a tap fallback ("I said it!").

## Updating Azad's universe

Quick edits: Parent Corner (⚙ in the Home pill nav, answer the multiplication gate). Structural edits (companions, new settings): `lib/universe/azad-verse.ts`.

## Costs

Each story start/continuation is one Claude call (~2–4k tokens): roughly a cent or two per story with Sonnet, less with Haiku (`STORY_MODEL=claude-haiku-4-5`).
