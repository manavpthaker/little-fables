# Claude Code prompt — implement the Story World hi-fi design end-to-end

Copy everything below the line into Claude Code, run from the repo root (`little-fables/`).

---

## Mission

Implement the approved hi-fi design for **Little Fables — Story World** (an Epic!-style interactive reading PWA for a 4-year-old, Azad, on an iPad) into this Next.js app. The design handoff from Claude Design is at `design/handoff/` — treat it as the source of truth for visuals and interaction, and this prompt as the source of truth for product behavior and engineering constraints.

A functional v1 of the app already exists under `app/read/` with working voice, story generation, and storage. **This is a redesign + upgrade of that app, not a greenfield build.** Preserve all working behavior (real speech, real persistence, real API generation) while replacing the UI with the handoff design.

## Read these first, in order

1. `design/handoff/HANDOFF-README.md` — how to read a Claude Design handoff.
2. `design/handoff/Story World.html` — the primary design (iPad **landscape** app). Follow its imports: `app/shared.jsx` (canvas CSS: iPad type scale, bedtime flip, animations, shared chrome), `app/HomeScreen.jsx`, `app/ReaderScreen.jsx`, `app/EndScreen.jsx`, `app/GrownupsScreen.jsx`, `app/main.jsx`, `app/story-data.js`.
3. `design/handoff/_ds/little-fables-design-system-*/tokens/*.css` — color/typography/geometry tokens (`--lf-*`). The `_ds_bundle.js` contains the compiled `AskBubble`, `ChoiceCards`, `VocabStar`, `Button`, `Card`, `Input` components — read their inline styles and replicate them.
4. `design/handoff/app-v1/` — an earlier portrait iteration. Reference only; do not implement it.
5. Existing app code: `app/read/**`, `app/api/story/route.ts`, `lib/read/*` (speech.ts, storage.ts, starter-stories.ts), `lib/universe/azad-verse.ts`, `types/story.ts`, `middleware.ts`, `public/manifest.webmanifest`, `public/sw.js`.

The design files are prototypes: match the visual output pixel-perfectly, but do not copy their internal structure (their word-highlight timer, fake mic timeouts, and localStorage router are simulations — the real app already has real implementations to wire in).

## Confirmed product decisions (do not re-litigate)

- **Story creation is parent-only.** The kid app has no Maker entry. Kid nav is exactly `Home / Grown-ups` (see `PillNav` in shared.jsx). The existing `/read/create` page becomes the parent-facing story maker, reachable only from the Parent Corner's "New story" button. Home copy: "New stories appear here when Mom and Dad finish making them ✦".
- **Responsive orientation.** The design is a 1180×820 landscape spread. Implement responsively: landscape/wide (≥ ~1000px) renders the two-page spread (Reader: art left ~46%, words right; Home: greeting+hero left 480px, chips+shelf right; End: celebration left, tell-it-back right). Portrait/narrow stacks the same content vertically (art above words) with the same tokens and type scale. No "rotate your device" wall.
- **Bedtime mode ships.** Moon/sun toggle in the Home header. Implement exactly as the `.sw-bedtime` CSS-variable flip in shared.jsx (cream→night indigo, coral→butter, warm shadows→dark, pastels→translucent tints, `--sw-on-action` flips to night). Applies to kid surfaces only (never gate/parent). Persist in localStorage.
- **Stars are real:** the ⭐ counter in the Home header = number of saved retell recordings (one star per "tell it back"). No other gamification.
- **Robustness beats purity of the mockup:** asks block the Next button (per design), but after 2 unmatched/failed listen attempts, accept any answer with the hint text and unblock — a 4-year-old must never be hard-stuck. If speech recognition is unavailable (`recognitionAvailable()` in `lib/read/speech.ts`), asks show tappable "I said it!" affordance instead of hard-blocking, and choices remain tappable (design already says "Say it out loud — or tap it!").

## What exists and must keep working

- `lib/read/speech.ts` — `speak()` (speechSynthesis + word-boundary callbacks with timer fallback), `listen()` (webkitSpeechRecognition wrapper), `matchesAny()`, `createRecorder()` (MediaRecorder). Wire the design's word highlight, mic states, and record button to these — do not reimplement.
- `lib/read/storage.ts` — stories in localStorage, retell audio blobs in IndexedDB. Keep the API; the Parent Corner recordings list and star count read from `listRetells()`.
- `app/api/story/route.ts` — Anthropic-powered generate/continue returning structured story JSON (Storyverse 5-layer prompt). The Reader's choice → "Your choice is changing the story…" state wraps the real `mode:'continue'` fetch for generated stories; starter stories use pre-baked branch pages.
- `lib/universe/azad-verse.ts` — universe defaults + localStorage merge. The Parent Corner universe editor reads/writes this.
- `middleware.ts` — `/read`, `/api/story`, `/sw.js`, `/manifest.webmanifest`, `/icons/` bypass Supabase. Keep it that way; kid app must work with zero Supabase env vars. The original creator app (`/story/create`, `/dashboard`, auth) must not break.

## Schema and data changes

Update `types/story.ts` and everything downstream:

- `vocab` becomes `{ word: string; meaning: string }[]` (see story-data.js). Vocab stars on the End screen show "«word» means «meaning»" when tapped, and speak it aloud via `speak()`.
- Add `by?: string` to Story ("Made by Papa" attribution, shown on covers/meta where the design shows it).
- Add `bleed?: boolean` to StoryPage (full-bleed art pages, used by Azi's Little Bhen — see ReaderScreen's bleed handling: art fills the left page edge-to-edge with `border-radius: 0 var(--radius-hero) var(--radius-hero) 0`).
- Keep `scene.emojis` + gradient as the fallback illustration for pages without `image` (generated stories have no art yet; render the emoji-on-gradient placeholder in the art slot). Parent Corner story list shows drafts as "art still painting".
- Replace `lib/read/starter-stories.ts` content with `design/handoff/app/story-data.js` **verbatim** (text, asks, choices, vocab, retell prompts, attribution): `miko-bridge` (5 pages, full ink-and-wash art, one choice with two art-backed branches), `azi-bhen` (2 bleed pages using `/books/azis-little-bhen/*.jpg`), `jujy-christmas` (2 pages). Keep the existing rocket story as a 4th shelf item with emoji scenes (it's the no-art rendering test case). Art paths: `/art/miko-*.jpg`, `/art/jujy-02-village.jpg` (already optimized in `public/art/`). Asks in the design have no `answers` arrays — keep the existing keyword-match `answers` on asks where they exist (counting → ["three","3"]), empty array = any answer praises.
- Update `app/api/story/route.ts` prompt + validation for the new vocab shape (ask the model for `vocab: [{word, meaning}]` with kid-friendly meanings) and pass through `by: "Made by <who>"` from a request field.

## Build order

1. **Tokens + fonts.** Create `app/read/read.css` importing nothing external: paste the `--lf-*` tokens from the handoff tokens CSS, the `.sw-app` iPad type-scale overrides, the `.sw-bedtime` flip, and all `sw-*` keyframes/utility classes (breathe, ring ×3 delays, dot, fade-up, pen, shake, lf-press, screen scroll) with the `prefers-reduced-motion` guards from shared.jsx. Load **Baloo 2** (weights 600–800) via `next/font/google` in the root layout alongside existing Quicksand/Inter; map `--font-display` to it. Import read.css in `app/read/layout.tsx` and put the `sw-app` class + bedtime class logic there (client wrapper).
2. **Shared components.** `app/read/components.tsx` (client): `Doodles`, `CircleBtn` (52px default), `BigMic` (breathing coral circle, pulsing rings when listening), `PillNav` (espresso active pill), `OfflineBanner`, `AskBubble` (question/praise/hint tones per the _ds_bundle styles, 46px pulsing mic), `ChoiceCards` (emoji cards, chosen = coral border + peach + glow, others dim to 0.45), `VocabStar`, progress bar with knob. No iOS StatusBar component — that's mockup chrome; the real PWA has a real status bar.
3. **Home** (`app/read/page.tsx`): header (logo — `logo-tree-ink.png`, white variant in bedtime — wordmark, ⭐ count from retells, bedtime toggle, avatar circle), greeting, "Tonight's story" arch-radius hero (most recent/first shelf story, 68px coral play badge overhanging bottom-right), category chips (from universe interests, 4 max, pastel scallop labels — decorative filter, fine to leave non-functional in v1), Bookshelf grid of `ShelfCover`s (every cover in the same cream mat: 9px padding card, 1.5px warm line, aspect-square art), the "new stories appear here" footer line, offline banner when `navigator.onLine` is false, PillNav.
4. **Reader** (`app/read/story/[id]/page.tsx`): responsive spread per above. Right page: reading card with `--text-story-page` 24px words (each word a span; highlight = peach fill + 3px coral underline driven by `speak()` onWord), ask section after dashed divider (blocking logic + AskBubble states; praise/hint also set the card's green/amber glow ring per ReaderScreen's `glow`), choice section (ChoiceCards; on choose → dim others 650ms → "Your choice is changing the story…" bouncing dots → branch pages appended (starter) or API continue (generated); on API error show the friendly error and re-enable the cards), progress bar ("page N of M" / "bonus page!" + title), controls row: 56px prev, **72px coral Next** (the ONE coral action; grays to cream-line + espresso-faint while blocked), 56px replay (restarts `speak()` for the page). Top bar: back CircleBtn, "Story time" title, 🔊/🔇 toggle. Auto-read each page on arrival.
5. **End screen** (route or phase after last page): left — 🎉 with ✨/⭐ satellites, "The end! Great reading!", vocab stars (tap → meaning line fades up + spoken), "Back to the Bookshelf" cream pill; right — "TELL IT BACK 🎤" card: retell prompts, 96px record button (breathe idle / rings + ⏸ + "I'm listening… 0:42" timer while recording via `createRecorder()`), saved state = mint pill "✓ Saved for Mom and Dad!" and the retell persisted to IndexedDB (this is what increments stars).
6. **Gate + Parent Corner** (`app/read/parent/page.tsx`): gate = shadcn-neutral card "Grown-ups only", one multiplication question with **three tappable answer buttons** (randomize the product and two near-miss distractors), shake animation + "Not quite — try once more." on wrong. Parent Corner per GrownupsScreen.jsx: Inter, `--lf-p-*` neutrals, Lucide icons (the repo has `lucide-react` — use it instead of the handoff's inline SVGs), header ("Parent corner", "Azad · 4 years old · N stories read this month" — wire N to real data or drop the claim), "New story" primary button → links to `/read/create`; left column: Stories card (starter + saved stories with 44px cover thumbs, by/pages/teaches meta, Published/Draft status pills) and Retell recordings card (real IndexedDB retells, play/pause with progress bar via an `<audio>` element, delete); right column: Azad's universe editor bound to `loadUniverse()`/`saveUniverse()` — interests as removable chips + add input, teaching goals as toggle chips, family words as word/meaning rows + add inputs; "✓ Auto-saved" footer. No emoji, no exclamation points anywhere on gate/parent surfaces.
7. **PWA + polish.** Manifest: `background_color` → `#FBF4E6`, keep `theme_color` dark for status-bar legibility. Service worker: bump cache version, precache `/art/*.jpg`, `/books/azis-little-bhen/*.jpg`, logo PNGs. Doodles on Home/End only. All tap targets ≥ 44px, primary kid controls ≥ 56px.
8. **Housekeeping.** Delete the stray full-size `*.png` files in `public/art/` (jpg versions already exist there and are the ones referenced). Update `README-STORY-WORLD.md` for the new structure (parent-only creation, bedtime mode, design source at `design/handoff/`).

## Rules

- Coral (`--lf-coral`) appears exactly **once per screen** as the action; when a mic or choice is active, the Next button visually recedes (design shows how). Pastels never act. Warm shadows only on cream; never cool gray.
- Kid-surface copy follows the voice guidelines: short rhythmic sentences, praise echoes the answer in CAPS, hints are phonetic and kind, never "wrong". Parent surfaces: quiet, plain, sentence case.
- Never show kids file paths, timestamps, settings language, or error jargon. Kid-facing errors: "The story machine hiccuped. Try again!"
- Respect `prefers-reduced-motion` for every animation.
- TypeScript throughout; no new runtime deps (fonts via next/font; icons via existing lucide-react; everything else is CSS + React).
- Do not touch the creator app routes, Supabase code, or auth. Pre-existing type errors in `components/chat/AIChat.tsx`, `components/workspace/AssetTray.tsx`, and `scripts/` are known — leave them.

## Verify before finishing

1. `npx tsc --noEmit` — no new errors beyond the three known pre-existing ones.
2. `npm run build` succeeds.
3. `npm run dev` manual pass: Home renders both orientations (resize window); open Miko → auto-read with word highlight → page 2 ask blocks Next, mic → praise/hint glow, 2-fail fallback unblocks → choice page: tap Boulder → "changing the story…" → branch art page → finish → End screen → record a retell → saved chip → Home shows ⭐ incremented → Grown-ups gate (wrong answer shakes, right answer passes) → recordings list plays the retell → universe edits persist after reload → bedtime toggle flips every kid screen and persists → offline (DevTools) shows the banner and starter stories still open.
4. `/read` works with `ANTHROPIC_API_KEY` unset except generation (friendly error), and with no Supabase env vars at all.

Work through the build order sequentially, committing after each numbered step with a descriptive message.
