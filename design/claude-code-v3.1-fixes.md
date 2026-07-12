# Claude Code prompt — v3.1 fixes (live QA of b2e752c on littlefables.ai)

Live QA pass, July 12. The Drawn Room core landed: arrival scene, drawn reader, A3 play/next
semantics, word-tap seek, folio→Contents round-trip, multi-chapter lands on Contents, drawn
Words wall, plain Parent gate. What follows are the failures, in priority order. The binding
specs are unchanged: `design/v3-build-addenda.md` (A1–A3) and the touch-balance directive in
`design/claude-code-v3-build-prompt.md`.

## P0 — flow traps (a touch-only child gets stuck)

**1. Ask pages hard-trap touch-only readers.**
Repro: `/read/story/azi-bhen` page 1 (COUNTING ask). Next is `disabled`, swipe no-ops,
scrubber no-ops, and the ask's only affordance is "Answer out loud" (mic). A child who
doesn't speak cannot leave page 1 of 2.
Cause: `app/read/story/[id]/page.tsx` — `goNext` does `if (gated) return` (~line 834; the
comment above it even quotes A3 correctly, then re-imposes the gate), and `askBlocked` only
clears via voice praise or `fallbackUnlocked` (two voice misses).
Fix per A3 + touch-balance: (a) prev/next chevrons and swipe are NEVER gated — gates apply
only to auto-turn in continuous play mode; (b) every ask renders tappable answer options
co-present with the mic from first paint (for counting asks: number chips; generic asks: 2–3
answer chips + "skip for now" affordance). The chip catalog pattern from
`create-with-buddy/InterviewPhase.tsx` (`chipsForSlot`) is the model.

**2. First-run still routes to the dead v2 buddy carousel.**
Cold start `/read` → `router.replace('/read/buddy')` (`app/read/page.tsx:80`) — the old
emoji-card carousel, not the new drawn arrival. `/read/arrival` works and is orphaned.
Fix: redirect to `/read/arrival`; same change in `lib/read/intents.ts:261` and
`app/read/create-with-buddy/page.tsx:150`. Then delete the v2 `/read/buddy` route (or make
it a redirect) and remove it from `public/sw.js` PRECACHE.

**3. Kitchen seed phase is voice-only with no exit.**
`/read/create-with-buddy` first screen ("What's YOUR story about? Tell me anything!") has
exactly ONE interactive element: the mic. No suggestion chips, no back button. This is the
precise pattern the touch-balance directive exists to kill. `InterviewPhase.tsx` got chips;
the `seed`, `redirect-offer`, `correction`, and `readback-entry` phases in
`create-with-buddy/page.tsx` did not.
Fix: chips + mic co-present in every phase (seed chips can come from the kid's interests /
recent books / wildcard cast); always-visible drawn back affordance (door edge, per the
mockup) on every kitchen screen.

**4. Home shelf is the old v2 card component floating over the drawn room.**
White rounded cards with EMOJI covers (🫎🚌🐻🌙🚂🪞) render misaligned over the drawn shelf,
overlap each other, sit on top of the Today's-Adventure card (its `Start` link doesn't
respond to clicks — z-index), and overflow right with `overflowX: hidden` — the clipped
books are unreachable by touch.
Fix: face-out drawn covers in the `ROOM_ZONES` shelf spots (the SVG cover components exist —
arrival already renders Miko/Moose/Papa covers); shelf browsing per the hi-fi (paged shelf
or swipeable row with visible affordance); kill the white-card component on Home; verify
Start link is clickable.

## P1 — A2 lighting is wired but invisible

**5. The room art does not consume the lighting vars.**
The state machine is correct (verified: 23:55 → `data-register="lantern"` + indigo sky var;
`?clock=19:30` → dusk gradient var). But the rendered room is identical at 6:30 and 12:00,
barely warmer at 19:30, and looks like golden hour at midnight — the window sky is static
art and the ambient overlay is imperceptible.
Fix: window sky fill = `var(--lf-sky)`; sun/moon position per keyframe; ambient overlay
opacity raised to visible levels; lantern register = darkened walls + warm light pools per
the mockup's night state. Acceptance: screenshots at ?clock=6:30 / 12:00 / 19:30 / 23:00
must be obviously different at a squint.

**6. Buddy greeting ignores the clock.** "Good morning, friend!" at 23:55. Pick the greeting
line from the same daypart the lighting uses.

## P1 — reader

**7. Chapter jump keeps the page index.** Contents → Chapter 2 lands on "page 2 of 28"
(carried `pageIdx` from chapter 1). Reset to page 1 (or that chapter's saved progress).

**8. Contents screen is still v2.** White cards, 📕 emoji chapter icons, old rounded font.
Restyle as the drawn Contents spread (A3: chapters with ✓ / current / closed states, drawn
per the handoff).

**9. pack-000 audio backfill still missing.** `/audio/azi-bhen/0-0.mp3` and
`.timestamps.json` → 404; reader falls back to `/api/tts`; no word highlighting possible.
Run the ElevenLabs pre-generation for all pack-000 books (this was the standing backfill
task — it now blocks the tap-word=seek acceptance test).

## P2 — polish

10. **Arrival shelf shows hardcoded hi-fi covers** ("A Boat of Leaves", "The Quiet Snail",
    "Azad's Bird Book") that don't exist as books. Render the real shelf or neutral spines.
11. **Today's-Adventure title illegible in dusk/lantern** (title var goes light while the
    card stays cream). Pin card-internal text to ink-on-cream regardless of register.
12. **Word-pin paper scraps overlap the word text** on the Home wall ("moon" is half
    covered). Offset the pin decoration.
13. **Shelf cover buttons have no accessible labels** (read_page shows six unnamed buttons).
    `aria-label={book.title}`.
14. **Arrival buddy tap: first tap sometimes yields no visible response** (second tap showed
    the speech card + rug circle). A1 requires <100ms visible pressed state on first touch.
    Also the buddy speech-card text is very low contrast (pale gold on cream).
15. **Reader banner art crop** cuts faces on azi-bhen page 1 (`object-position` / focal
    crop).
16. **Kitchen visuals still emoji** (emoji bear avatar, emoji mic on the coral button) —
    the BuddyMic/drawn-sprite reskin didn't reach the kitchen screens.
17. **Service worker cache name still `lf-read-v3`** across a wholesale visual replacement —
    bump to `lf-read-v4` so stale shells can't serve the old app offline.

---

# v3.1 re-verify results (0d72d7d, live July 12)

**Verified fixed:** first-run → arrival (#2) · ask chips + skip co-present, prev/next never
gated, chip answer → praise (#1) · continuous play auto-turns then pauses at the page-2 ask
(A3 end-to-end) · kitchen touch-only seed→interview→readback→writing-moment, drawn sprites +
drawn back door, dual-mode chips at every interview question (#3, #16) · lighting: dawn /
noon / dusk / night are four unmistakably different rooms, greeting matches daypart (#5, #6)
· chapter jump lands on ch2 page 1 (#7) · Contents drawn with You-are-here / Coming-up
covers (#8) · azi-bhen audio 200 + word highlight follows narration on moose (#9) · Home
shelf paged with chevrons + aria-labels, Start link clickable, Today's title ink-locked
(#4, #11, #13).

## v3.2 — remaining items

**P0-A. `/api/story` 504s on kid-story generation.** The full touch-only kitchen flow ended
in the friendly failure state because both generation attempts returned 504 Gateway Timeout.
`maxDuration = 90` is already set on the route — so either the kid pipeline (generation +
embodiment + two-stage QA + possible regeneration, all in one request) exceeds 90s, or the
Vercel plan caps below 90. Fix: raise to the plan max AND restructure — return the story
after the hard-gate pass and run soft scoring/revision async (or split into two requests the
client chains: generate → qa). The client should also treat a 504/timeout with one visible
retry, not straight to the oven line.

**P1-B. Kitchen auto-listens.** Seed screen opens with "I'm listening!" / "Tap when done",
and interview questions re-arm the mic ("I'm listening — or tap one above"). The directive
is tap-to-listen only, always explicitly initiated. Chips may appear with speech; the mic
must stay idle until tapped.

**P1-C. Seed→interview transition shows stale inert chips.** After answering the seed, the
old seed chips stay rendered (not in the a11y tree, not tappable) for several seconds before
Q1's want-chips appear. Swap phases atomically or show the writing-desk beat between.

**P1-D. Home shelf double-render.** The paged real-book cards float over the painted shelf's
own hardcoded covers (Papa Gets the Moon / Azad's Bird Book / Quiet Snail visible behind and
between cards) — most visible at dusk/night. Suppress the baked-in covers in the room SVG
when real covers render; covers should sit IN the shelf niches, not glow above them.

**P2.** Word-pin paper scraps still overlap pin text on Home ("moon" half-covered — #12 was
not actually fixed) · arrival buddy tap still needs 2–3 taps before the hello/rug beat
appears (repro'd twice; #14's press-state fix didn't cure the handler) · seed chip copy is
parent-voiced profile strings ("AKAI keyboard, patience while learning", "(Azi's three-chord
C-G-Am progression)") — chips a 4-year-old reads should be 1–3 kid words ("music", "puzzles",
"a hero") · dusk window shows sun and moon simultaneously · reader banner crop (#15, still
open) · cover art is emoji-centric by design (BookCoverArt emoji dispatch) — fine as interim,
but the art-pipeline backfill (`design/claude-code-art-prompt.md`) is what actually retires
emoji from the shelf.

## Re-verify after fixes (the failed checkpoints only)

- Touch-only full pass: cold `/read` → arrival → pick buddy → Home → open a shelf book by
  tapping its drawn cover → read through an ASK page using only taps → finish chapter.
- `?clock=6:30 / 12:00 / 19:30 / 23:00` — four visibly different rooms; greeting matches.
- Contents → chapter 2 → lands on its page 1.
- Kitchen touch-only: seed → interview → readback → writing moment → shelf, no mic use.
- Word highlight during play on one pack-000 book (after backfill).
