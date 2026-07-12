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

## Re-verify after fixes (the failed checkpoints only)

- Touch-only full pass: cold `/read` → arrival → pick buddy → Home → open a shelf book by
  tapping its drawn cover → read through an ASK page using only taps → finish chapter.
- `?clock=6:30 / 12:00 / 19:30 / 23:00` — four visibly different rooms; greeting matches.
- Contents → chapter 2 → lands on its page 1.
- Kitchen touch-only: seed → interview → readback → writing moment → shelf, no mic use.
- Word highlight during play on one pack-000 book (after backfill).
