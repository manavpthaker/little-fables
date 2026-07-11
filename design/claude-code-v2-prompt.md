# Claude Code prompt — Little Fables v2: the full build

Run from the repo root. This is a comprehensive revision: new design, chapter model, real voice, conversational interactions, pre-populated library. Work through the phases in order, committing after each.

---

## Mission

Rebuild the kid-facing app (`/read`) of Little Fables into the v2 product defined by `design/PRD-story-world-v2.md`: chapter books with a map and resume, the buddy system, reading-day suns, badges, My Words, world memory, a pre-populated family library, and a real voice + conversation layer. This supersedes the current `/read` implementation — rewrite it; don't patch it. The creator app (`/story/create`, `/dashboard`, auth) must keep working untouched.

## Read first, in this order

1. `design/PRD-story-world-v2.md` — product truth: requirements R1–R15, non-goals (no loss states, no notifications, no reward currencies), research foundations, phasing.
2. `design/handoff-v2/` — **the final UI. Read `Little Fables.html` and follow every import** (`app/shared.jsx`, `app/screens-a.jsx` (Home, BuddyCarousel, BuddyArrival, ChapterMap), `app/screens-b.jsx` (Reader, ReaderAsk, BreatheAlong, ChapterEnd, BookComplete, Recap), `app/screens-c.jsx` (BadgeEarn, BadgeShelf, MyWords, PortraitHome, PortraitMap, ArtNote, BearSampleSVG), `app/screens-parent.jsx` (Gate, ParentCorner, StoryMaker), `app/data.js`, `lib/*`). It's a prototype: match the rendered output (watercolor washes, mat covers, sun rows, medallions, confetti, buddy faces, speech bubbles, 68px mics), not its internal structure. Its fake timers/random outcomes get replaced by the real systems below.
3. `docs/voice-architecture.md` — the voice + conversation spec. Binding decisions, not suggestions.
4. `docs/content-pipeline.md` + `content/packs/pack-000-family-originals.json` + `content/CONVERSION-NOTES.md` — the library and its schema (`kind`, `chapters[].pages[]`, `parentGuide`, `breathe`, `originNote`).
5. `docs/reference/RESOURCES.md` and `docs/reference/azi-verse/` — the canon universe (real cast/settings/rituals), the evaluation rubric (ship gate), skill-embedding and craft rules. The story-engine system prompt is **assembled from these files** — read them before writing it.
6. Existing code worth keeping: `lib/read/storage.ts` (extend), `lib/read/speech.ts` (partially — see Phase 3), `app/api/story/route.ts` (rework), `middleware.ts` public-route bypass (extend to new API routes).

## Non-negotiable product rules

Coral acts exactly once per screen; pastels never act. Every kid-surface interactive element speaks (spoken text via the TTS layer) and works without reading. Primary kid targets ≥56px. No loss states, notifications, currencies, or leaderboards; suns never unlight. Kid errors are friendly ("The story machine hiccuped. Try again!"); parent surfaces are plain (no emoji, no exclamation points). Reduced motion respected. Kid app fully public — zero Supabase dependency (extend the middleware bypass to every new `/api/*` route the kid app calls). All parent-authored content and recordings stay local-first; API keys live server-side only.

## Phase 1 — Data model + library

- New types (`types/story.ts`): `Book { id, title, coverImage?, coverEmoji, wash, by, kind:'quick'|'chapter', chapters: Chapter[], vocab:{word,meaning}[], teachingGoals, retellPrompts, parentGuide?, originNote?, seasonal?, quiet? }`, `Chapter { title, pages: Page[], hook?, recapQuestion? }`, `Page { text, scene {wash|image, emojis}, ask?, wonder?, choice?, breathe? }`, plus `Progress { bookId, chapter, page }`, `WorldState { choiceLog: {bookId, chapter, label, summary}[] }`, `BuddyState`, `ReadingDays`, `Badges`, `WordBook`.
- Migrate v1 saved stories → 1-chapter Books on load (non-destructive).
- Load `content/packs/*.json` as the pre-seeded library (starter + family stories on the shelf, `by` attribution shown). Miko keeps its real art; pack stories render wash + emoji scenes with the "art still painting" treatment.
- Reading-day suns: a day with ≥1 finished chapter or quick story lights it (both count). Stars in header = collected words. Badges per PRD R11 (first-choice, book-complete, Miko Master, reading-day milestones 5/10/25, retell milestones, 10 star words) — detected the moment earned, never gating.

## Phase 2 — Screens (from handoff-v2)

Implement every screen in the handoff with real state: buddy carousel (persisted pick, switching free, growth stages; milestone arrivals via the crate → BuddyArrival beats), Home (buddy header speaking exactly one line — greeting or worldState callback, sun row, Continue card with chapter dots + progress ring OR Today's adventure + daily quest, My World strip, two shelf rows + "writing itself…" slot, offline banner on `navigator.onLine === false`), ChapterMap (done ✓ thumbnails re-readable, current stop + buddy, "Not yet… Mom is still painting this one ✦"), Reader (spread landscape / stacked portrait per PortraitHome/PortraitMap patterns, word highlight from TTS timestamps, asks/wonder/choice/breathe blocks, ask-the-story mic, blocking Next with the 2-miss mercy rule and tap fallbacks), ChapterEnd (recap question, hook, Next chapter / All done), Recap interstitial (>24h resume, buddy speaks "Last time… YOU chose…"), BookComplete (confetti, vocab stars speaking word+meaning, Tell it back → transcription + buddy response, badge handoff), BadgeEarn/BadgeShelf, MyWords (tap = hear it), Gate (3-answer multiplication, shake), ParentCorner (Stories with Draft → Checking → Published lifecycle, Retellings with audio + transcript, universe editor bound to the real universe), StoryMaker wizard (format → intake cards with chips → review → per-chapter generation progress).

## Phase 3 — Voice + conversation (docs/voice-architecture.md)

- **TTS:** `/api/tts` (ElevenLabs `convert-with-timestamps`; `ELEVENLABS_API_KEY`, voices `NARRATOR_VOICE_ID`/`BUDDY_VOICE_ID` in env). Pre-generate page audio + alignment at publish (pipeline step + StoryMaker step + a backfill script `scripts/generate-audio.ts` for pack-000). Cache audio+timestamps in IndexedDB/SW; word highlight driven by alignment. Fallback chain per the doc. Delete the boundary-event/timer highlighting.
- **STT:** `/api/listen` — audio blob → Whisper (or `STT_PROVIDER=elevenlabs`). Remove all webkitSpeechRecognition usage (dead in standalone iOS PWAs); `listen()` becomes record-and-post with the same handle interface.
- **Native-shell seams (binding):** per the doc's Phase 6, a Capacitor iPad shell is a planned fast follow. Structure for it now: `lib/read/speech.ts` exposes provider-agnostic `TranscriptionProvider` / `TtsSource` / `AudioSession` interfaces with runtime feature-detection (web implementations only in this build); all persistence flows through the storage module (no raw localStorage/IndexedDB in components); no speech/audio browser APIs referenced outside the speech module. Do not add Capacitor itself yet.
- **Conversation:** `/api/respond` (Haiku) per the doc: judged asks with echo-praise + ≤1 follow-up, freeform "tell me YOUR idea" third path on choices (feeds `childIdea` into continuation + worldState), `wonder` asks, retell feedback naming a detail, ask-the-story ≤2 bounded exchanges, turn etiquette (8s timeout → re-invite → tap fallback), canned praise/hint as offline/error fallback, safety rails pinned in the system prompt.

## Phase 4 — Story engine + pipeline

- Rework `/api/story`: system prompt assembled from `docs/reference/` (azi-verse universe guide + rituals + craft rules: three-moment morals, repair language, code-switching rules, age-band vocabulary from littlefables configs); modes `start` (quick), `chapter` (book context + prior chapter summaries + worldState + optional `childIdea`), continuation resolves in ≤2 choices; output = the new Book/Chapter schema incl. hook + recapQuestion + wonder asks.
- **Quality gate:** post-generation Haiku scoring call against `docs/reference/azi-verse/evaluation-rubric.md`; <90 → one revision with notes → still <90 flags "needs review" in Parent Corner instead of publishing.
- Pre-generation: finishing chapter N pre-generates + caches N+1 (cap 1 ahead) when online.
- `scripts/generate-story-pack.ts` per `docs/content-pipeline.md` (brief rotation, rubric gate, dedupe, emits `content/packs/pack-NNN.json`) — build it and generate **pack-001 (12 stories) as part of this work**, then stop for human review.

## Phase 5 — PWA + polish + verify

SW: new cache version; precache shell, pack JSON, art, generated audio; offline = full reading of cached books with ElevenLabs audio. Manifest name "Little Fables". Housekeeping: remove `public/art/*.png` duplicates (jpg is canonical), remove dead v1 screens, update `README-STORY-WORLD.md` → `README-LITTLE-FABLES.md`.

**Verification (all must pass):** `tsc` clean (3 known pre-existing errors exempt); `next build` succeeds; manual pass — carousel pick → Home greeting → open Miko Ch1 → auto-read with timestamp highlight → ask: answer nonsense twice (mercy unblock), answer well (echo praise) → choice: speak a freeform idea → continuation references it → chapter end → Next chapter → finish book → retell records + transcribes + buddy names a detail → badge earn → suns/stars/words update → resume another day path shows Recap → bedtime toggle → parent gate → recordings with transcripts → StoryMaker generates a quick story that passes the gate → airplane mode: cached book fully readable with audio, asks fall back to canned + tap. Run `scripts/convert_family_stories.py` and `scripts/generate-audio.ts` and confirm pack-000 renders on the shelf with parent guides visible only in Grown-ups.

Env needed: `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `OPENAI_API_KEY` (Whisper) or `STT_PROVIDER=elevenlabs`, voice IDs, optional `STORY_MODEL`/`JUDGE_MODEL`.
