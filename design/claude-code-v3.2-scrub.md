# Claude Code prompt — v3.2: scrub the v2 design system, then rebuild on clean ground

Run from the repo root. Ordering is the point of this prompt: **remove the old design system
completely FIRST, then fix forward.** Every v3.x regression so far (white cards over the
drawn shelf, emoji covers, old Contents, stale styling) leaked from v2 code that was left
compiling. Stop patching leaks; remove the source.

Binding specs unchanged: `design/v3-build-addenda.md` (A1–A3), the touch-balance directive
in `design/claude-code-v3-build-prompt.md`, and the v3.1/v3.2 findings in
`design/claude-code-v3.1-fixes.md`.

## Phase 0 — Scrub inventory (verified against the repo, July 12)

Delete or fully port each of these. "Port" means rebuild as a Drawn Room component under
`.lf-room` tokens — never import from the old kit.

1. **`app/read/read.css` — the `.sw-app` block.** The entire v2 "Dream Paper" system still
   ships: `.sw-app` tokens (day palette, night-indigo bedtime flip, shadcn parent neutrals,
   v2 radii/shadows/motion/fonts, iPad type scale, watercolor washes, `.sw-bedtime`,
   `.sw-breathe`, butter pulse). Remove the whole block. Parent surfaces get their own tiny
   scoped token set (`.lf-parent`: Inter, neutrals — intentionally plain, that's design, not
   legacy). Nothing in the kid app may reference an `.sw-*` class when this phase ends.
2. **`app/read/components.tsx` — the v2 component kit.** Still exports and is still
   imported: `WashScene`, `washBg`, `MatCover`, `BuddyFace` (emoji faces), `AskBubble`,
   `ChoiceCards`, `SpeechBubble`, `Confetti`, `CircleBtn`, `BigMic`, `PillNav`, `SunRow`,
   `ProgressRing`, `ChapterDots`, `Doodles`, `NatureTag`, `Medallion`, `Dots`. Delete the
   file. For each surviving usage, replace with the drawn equivalent (most already exist in
   `app/read/art/`); whatever has no drawn equivalent yet gets built now, from the handoff,
   not adapted from the old kit. `OfflineBanner` is the one exception worth keeping — move
   it out and reskin it drawn.
3. **`app/read/SwApp.tsx`** — rename/refactor so the app shell carries no `.sw-app` class or
   v2 assumptions (keep the SW-registration + online-state logic).
4. **Content-layer v2 visuals — the deepest root.** `content/packs/pack-000-*.json`,
   `lib/read/starter-stories.ts`, and `lib/read/migrate.ts` carry `bg:
   linear-gradient(160deg …)` washes and per-page emoji arrays; `scripts/
   convert_family_stories.py` has the `SCENES` emoji map that generates them. This is why
   emoji scenes keep appearing in the reader. Change the content contract: scene becomes a
   semantic key only (`scene: 'farm' | 'night' | …`); the KID APP maps scene keys to drawn
   art (or the drawn endpaper placeholder where page art doesn't exist yet — never emoji,
   never gradient washes). Update the converter (drop SCENES gradients/emojis, emit semantic
   keys), regenerate pack-000, update starter-stories and migrate.ts to the same contract.
   Keep `qaRecord`/prose untouched — this is presentation metadata only.
5. **Emoji glyphs in kid-facing TSX.** Still present in `story/[id]/page.tsx` (praise 🎉),
   `story/[id]/EndPhase.tsx`, `story/[id]/Contents.tsx`, `create-with-buddy/
   InterviewPhase.tsx` (chip emojis), `components.tsx`, `art/props.tsx`. Standing rule: no
   emoji anywhere in the kid app — chips get small drawn glyphs from the art library or no
   glyph; praise moments use drawn marks (stars/lantern), not 🎉. (Parent Corner may keep
   plain text; it has no emoji today.)
6. **`app/read/create/page.tsx`** (old parent Story Maker) — parent-facing, so plain is
   correct, but it still imports kid-kit pieces and `lf-press`; rescope it to `.lf-parent`
   tokens only.
7. **`lib/universe/azad-verse.ts`** — strip the emoji fields the old UI consumed (verify
   nothing else reads them first).
8. **Route hygiene** — `/read/buddy` redirect stays. Delete any now-orphaned v2 files the
   above uncovers (old handoff imports, dead CSS, `scripts/__pycache__`).

**Scrub gates (all must pass before Phase 1):**
- `grep -rn "sw-app\|sw-bedtime\|washBg\|WashScene\|MatCover\|BuddyFace" app lib` → zero hits.
- Emoji gate: a regex sweep for emoji codepoints over `app/read/**` (excluding `/parent`)
  → zero hits.
- `grep -rn "linear-gradient(160deg" app lib content` → zero hits.
- `tsc` clean (known exemptions) + `next build` green — deleting the kit may not leave
  dangling imports.
- Visual: Home, arrival, reader, Contents, kitchen, words, badges, complete — each screen
  renders only Drawn Room surfaces (screenshot pass).

## Phase 1 — Rebuild what the scrub exposes, from scratch

The shelf is the proof case: with `MatCover`/washes gone, rebuild Home + arrival shelf as
drawn books IN the shelf niches (suppress the room SVG's baked-in decorative covers when
real books render — no double-shelf, no floating cards, no glow outlines). Page-scene art:
semantic scene keys map to drawn scene components where they exist; the drawn endpaper
placeholder elsewhere (this is the seam the art pipeline backfill will fill).

## Phase 2 — Carry over the open v3.2 fixes (from claude-code-v3.1-fixes.md)

- **P0-A** `/api/story` 504 on kid stories: split generation/QA (return after hard gates,
  soft-score async) or two chained requests; client shows one drawn retry beat on timeout.
- **P1-B** Kitchen auto-listen → tap-to-listen only, every phase.
- **P1-C** Seed→interview transition renders stale inert chips — swap phases atomically.
- **P2** Word-pin scraps over letters · arrival buddy needs 2–3 taps (fix the handler, not
  just the pressed state) · kid-voiced chip copy (1–3 kid words) · dusk sun+moon both
  visible · reader banner focal crop.

---

# v3.2 live verification (a05d23c, July 12, 6 AM pass)

**Confirmed on littlefables.ai after SW nuke:** scrub gates pass in code (components.tsx
deleted; zero live sw-app/wash/MatCover refs; gradient gate clean; emoji gate clean except
noted vestiges) · arrival picks buddy on FIRST tap · Home shelf is drawn covers in niches,
paged, no white cards, no double-render · dawn lighting + matching greeting at 6 AM ·
Contents drawn · kitchen mic idle until tapped ("tap to talk") in every phase · interview
chips kid-worded ("the moon", "a friend", "too dark", "a grumpy guy") · **kid-story
generation SUCCEEDS end-to-end** (~70s): touch-only seed→interview→readback→writing moment→
"The Helper and the Dark" (7 pp) opened in the reader with universe cast (Jujy, Dory,
Slothie, Clappy) and the drawn endpaper scene placeholder.

## Residuals for the next pass (small)

1. **Seed→interview chip swap still not atomic** — after answering the seed, the OLD seed
   chips stay visible AND TAPPABLE for ~6s (wrong-slot answers live under the new question)
   until the want-chips render. Swap must happen with the speech, not after it.
2. **Seed chips are parent-voiced profile strings** ("AKAI keyboard, patience while
   learning", "guitar and music (Azi's three-chord C-G-Am progression)"). The interview
   slots got kid-worded; the seed didn't. Map interests → 1–3 kid words ("music",
   "puzzles", "the moose").
3. **Word-pin paper scraps still overlap pin text** on Home ("moon" half-covered) — third
   report.
4. `coverEmoji: '✨'` vestige on generated books (`create-with-buddy/page.tsx:537`,
   `create/page.tsx:290`) — retire the field for BookCoverArt dispatch.
5. Window sky overlay has a hard rectangular seam inside the window frame (visible at dawn).
6. Today's-Adventure card overlaps the buddy on the rug at this viewport.
7. Reader banner focal crop (carried from v3.1 #15).

## Phase 3 — Verify

Scrub gates re-run + the v3.1 re-verify list (touch-only full pass incl. kitchen through a
successful generation; four clock states; word highlight) + regression (pack-000 renders,
retells, offline, Supabase-free kid app, parent flows).
