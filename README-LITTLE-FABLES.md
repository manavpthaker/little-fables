# Little Fables (`/read`) — v2

An interactive reading PWA for a 4-year-old (Azad, reads at 5–6 level). Chapter books with a **buddy** who greets him aloud, a **map** he can navigate without reading, **reading-day suns** that never turn off, badges he can show his parents, star words he collects into a book, and a **world that remembers his choices** across sessions. Built on the [Storyverse](https://github.com/manavpthaker/storyverse) 5-layer framework and the Azi-Verse canon (`docs/reference/azi-verse/`).

**This is a daytime and car-ride app, not a bedtime app.** Design assumes weekend mornings, quiet time, and drives — which is why offline-first and audio-forward behavior are primary.

## What's inside

- `/read` — **Home v2**. Buddy header (spoken greeting or world-memory callback), reading-day suns for the week, **Continue** card for the book mid-flight (or Today's adventure if nothing's mid-flight), My World strip (badges + star words), two shelf rows (Chapter books, Quick stories) with the "art still painting" slot for drafts. Every element voices itself.
- `/read/buddy` — **Buddy carousel**. Pick from Bramble, Otter, Little Anky, Moto, Rocky, Rusty (three living / three nonliving — living/nonliving classification baked in). More arrive at reading-day milestones via the **BuddyArrival** three-beat reveal. Free to switch anytime.
- `/read/story/[id]` — **Reader**. Chapter map on entry for chapter books, straight into pages for quick stories. Word highlight driven by ElevenLabs timestamps. Ask blocks judged by Haiku via `/api/respond` (2-miss mercy, then any answer is accepted with the hint). Choices have three paths: option A, option B, or **"…or tell me YOUR idea!"** — the child's freeform spoken idea gets fed into the continuation as `childIdea`. Breathe pages render a Belly-Breath mini-interaction. Ask-the-story mic always available (≤2 exchanges then gentle return). ChapterEnd asks a spoken recap question, hooks the next chapter, and offers Next chapter / All done. BookComplete = confetti + vocab stars (tap = hear word + meaning) + Tell-it-back recording (transcribed by Whisper) + badge handoff.
- `/read/badges` — Badge shelf (earned + locked with silhouettes). `/read/badges/earn/[id]` is the celebration screen. Badges recognize, never gate.
- `/read/words` — My Words. Every star word collected in the wordbook; tap = hear it and its meaning.
- `/read/parent` — **Parent Corner**. Magic-link auth (Supabase), math gate (3 tappable answers, shake on wrong). Tabs: Stories (lifecycle Draft → Checking → Published → Needs review), Retellings (audio + Whisper transcript), Universe editor (interests / teaching goals / family words in Spanish, Gujarati, Hindi, Creole).
- `/read/create` — **Story Maker** wizard. Format (Quick vs Chapter book 3–5 chapters) → Intake chips (Hero / Setting / Teaching goal / Cultural elements / Emotional theme / optional freeform idea) → Review → per-chapter Writing progress → Success.

## What sits underneath

- **Data model** (`types/story.ts`): `Book { kind, chapters: Chapter[], vocab: {word, meaning}[], teachingGoals, retellPrompts, parentGuide?, originNote?, quiet?, seasonal? }`. A quick story is a 1-chapter book. `Chapter.hook` carries the next-chapter tease line and `Chapter.recapQuestion` is what the buddy asks at chapter end.
- **World state** (`lib/read/storage.ts`): every choice logs into `WorldState.choiceLog` (last ~20) with a short summary; `WorldState.latestCallback` is the line the buddy speaks on Home. Progress autosaves every page turn. Reading days are ISO dates in a set; the sun row draws from `currentWeekSuns()`. Badges live in `EarnedBadges`; the moment a condition is met, `grantBadge` flags a pending earn that Home routes to `/read/badges/earn/[id]` next mount. WordBook accumulates star words with meanings + pronunciation + origin.
- **Content**: `content/packs/pack-000-family-originals.json` — 7 family stories converted (Bus Detour, Bramble's Hello, Cozy Circle, Moose Who Knew About Bigness, Coocoo and the Boy Who Could, Midnight Train, Papa Gets the Moon) — 12 chapters, 279 pages. Loaded on shelf via `lib/read/packs.ts`. `content/originals/` preserves the source prose verbatim. Reference reading and the story-engine system prompt are assembled from `docs/reference/azi-verse/`.
- **Voice** (`docs/voice-architecture.md`):
  - **TTS**: `/api/tts` calls ElevenLabs `convert-with-timestamps`. Audio + word-alignment are pre-generated at publish time (pipeline step + `scripts/generate-audio.ts` backfill). Cached in IndexedDB. Fallback chain: cached ElevenLabs → device `speechSynthesis` → text-only.
  - **STT**: `/api/listen` — MediaRecorder client-side, Whisper (or ElevenLabs Scribe) server-side. `webkitSpeechRecognition` is completely gone.
  - **Conversation**: `/api/respond` — Claude Haiku 4.5. Judged asks with echo-praise + ≤1 follow-up, freeform choice paths that feed `childIdea` into generation, wonder questions with no right answer, retell feedback naming a detail, ask-the-story bounded to ≤2 exchanges.
  - **Native seams**: `lib/read/speech.ts` exposes provider-agnostic `TranscriptionProvider`, `TtsSource`, `AudioSession` interfaces. Feature-detect a Capacitor bridge at runtime. Native shell is a fast-follow (`docs/voice-architecture.md` §Phase 6) — SFSpeechRecognizer for offline STT, Apple Personal Voice for Papa's actual voice, background audio for drive mode.
- **Story engine** (`app/api/story/route.ts`): system prompt assembled from `docs/reference/` (universe guide + creation instructions + future-ready skills + evaluation rubric). Modes `start` (quick), `chapter` (book + prior chapters + worldState + optional childIdea), `continue` (branch resolution). **Rubric gate**: post-generation Haiku scoring against `docs/reference/azi-verse/evaluation-rubric.md`. <90 → one revision → still <90 → `status: 'needs-review'` in Parent Corner (never blocks parents from seeing what came out).
- **Content pipeline**: `scripts/generate-story-pack.ts` per `docs/content-pipeline.md` — brief rotation → generate → rubric gate → dedupe → emit `content/packs/pack-NNN.json`. `scripts/generate-audio.ts` pre-generates ElevenLabs audio for a pack. Costs: pack-000 audio ≈ ~$5–10 once; a fresh pack-001 (12 stories) ≈ ~$3 including quality gate.
- **Cross-device sync**: Supabase (magic link auth). Local-first stays the read source; every mutation writes through. Books stored as a jsonb blob (`reader_stories.book`), retells in `reader_retells` + `reader-retells` storage bucket, buddy/badges/reading-days/wordbook/worldstate in a per-user `reader_state` blob. All RLS-scoped to `auth.uid()`. Migrations in `supabase/migrations/`.
- **PWA**: `sw.js` (cache `lf-read-v3`) precaches shell + pack art + generated audio. Manifest is "Little Fables". Kid app runs with zero Supabase env vars; creator-app auth is optional.

## Env vars

Kid-app-only (no sync, no voice):
- none required. The shelf, buddy, chapter map, reader (text-only), badges, and words all work offline against local storage.

With voice (ElevenLabs + Whisper):
- `ELEVENLABS_API_KEY`, `NARRATOR_VOICE_ID`, `BUDDY_VOICE_ID`
- `OPENAI_API_KEY` (Whisper) OR set `STT_PROVIDER=elevenlabs`

With generation and conversation:
- `ANTHROPIC_API_KEY`, optional `STORY_MODEL` (default `claude-sonnet-4-6`), `JUDGE_MODEL` (default `claude-haiku-4-5-20251001`), `RESPOND_MODEL`, `SHIP_GATE_MIN` (default 90), `SKIP_RUBRIC=1` to bypass rubric gate in dev.

With cross-device sync:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (add on Vercel; the middleware short-circuits gracefully when they're missing).

## First-time setup

1. Add env vars to `.env.local` (or Vercel).
2. Run the Supabase migrations in the SQL editor:
   - `supabase/migrations/0001_reader_kid_app.sql`
   - `supabase/migrations/0002_reader_v2_books.sql`
3. `npm install && npm run dev` → http://localhost:3000/read
4. Optional: pre-generate audio for the family pack — `npx tsx scripts/generate-audio.ts`.
5. Optional: generate a fresh pack — `npx tsx scripts/generate-story-pack.ts --pack 001 --count 12`.

## Install on the iPad

Same as v1: open in Safari → Share → Add to Home Screen. The PWA opens straight into the buddy carousel on first launch, then Home on every subsequent open. First 🎤 tap will request the microphone — allow once. Reading + audio work offline for cached books.
