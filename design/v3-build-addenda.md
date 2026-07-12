# v3 build addenda — binding requirements recorded ahead of the code round

Three requirements from Manav (July 2026), to be folded into the Claude Code prompt alongside the design system + hi-fi handoffs. All become review checkpoints when the hi-fi prototype lands.

## A1. Touch-native is the first interaction state

Touch is the app's primary and default input — designed first, before voice, before anything pointer-shaped. Voice agency (v3 R16) layers *on top of* a fully delightful finger-only app, never instead of it.

**The gesture grammar (complete, and closed):**
- **Tap** = act (open, choose, turn, answer).
- **Press-and-hold** = hear it (the spoken label/cue for any element) — this is the accessibility layer AND the discovery mechanic.
- **Scrub/drag** = reveal (pop-up moments, art reveals — finger position drives the magic per the Sabuda pattern).
- **Swipe** = page turn (child-initiated, with the kamishibai slide following the finger until release).
- Nothing else. No double-tap (unreliable at 4), no multi-touch requirements, no long-drag precision, no pinch.

**Engineering requirements:**
1. Zero hover dependence: no information or affordance exists only on `:hover`; all "hover" styles have touch-visible equivalents (idle glow, breathing).
2. Pressed states are designed states: every touchable renders a drawn pressed treatment (ink darkens, object settles ~2px) within **<100ms** of `pointerdown` — feedback on touch, not on release.
3. `touch-action: manipulation` globally on kid surfaces (kills 300ms delays and double-tap zoom); `user-select: none` and no iOS callout/magnifier on kid surfaces; overscroll contained (no rubber-band revealing browser chrome).
4. Pointer Events only (no mouse/touch dual handlers); drag interactions track the finger 1:1 with generous slop (≥24px before a tap becomes a drag).
5. Targets: ≥56px primary / ≥44px everything, with ≥8px spacing; interactive zones biased to the lower two-thirds of the screen (small arms, resting grip).
6. Swipe page-turns follow the finger (interruptible, reversible mid-gesture); release velocity decides commit/cancel.
7. First-run teaching demonstrates the grammar by arrangement (the first book wiggles on tap-worthy moments); no gesture tutorials.
8. Review checkpoint (hi-fi + build): every flow completable with one finger, no keyboard, no hover, no voice.

## A2. The room's lighting follows the real clock

The room is lit by the device's actual time of day — continuously, not as discrete themes. The window is honest: open the app at 7:12am and it's morning in the room; at 7:12pm the lantern register is arriving.

**Spec:**
1. A `lighting` module computes a continuous day position from the device clock (approximate sunrise/sunset by month — a simple seasonal table is fine; no location permission needed. Optional lat/long refinement if the native shell lands).
2. Six keyframe states interpolated smoothly: **dawn** (pale rose light, long cool shadows) → **morning** (clear butter light) → **midday** (high white-warm, short shadows) → **golden** (the north-star state: deep marigold pools) → **dusk** (lantern register begins: indigo rises, lamp warms on) → **night** (full lantern: moon in window, pools of gold). Interpolation runs over CSS custom properties (`--light-pool`, `--shadow-color`, shadow length/angle, window sky gradient, ambient temperature overlay) — the drawn art itself doesn't swap, the *light on it* does.
3. Register coupling: `data-register="lantern"` engages automatically from dusk onward (and for quiet-time books at any hour); Day registers govern before dusk. Inside books, `story` register still wins — the page's palette governs while reading; the room is re-lit correctly on return.
4. Live drift: if a session crosses a boundary (reading through sunset), the room has changed when he returns to it — never animate a visible fast transition while he watches; light drifts at real-world speed or shifts during register changes/scene returns.
5. The lighting layer is decorative, never informational: no content, affordance, or contrast requirement may depend on time of day; all states must pass contrast checks in **night** lighting (worst case).
6. Dev/test override: `?clock=19:30` (or localStorage `lf-clock-override`) forces a time; Parent Corner gets no user-facing control in v3 (the honesty is the point) beyond the existing quiet-time behavior.
7. Battery/reduced-motion: interpolation ticks at most once per minute; reduced-motion snaps between keyframes on scene entry only.

**Hi-fi review checkpoint:** the prototype should show ≥3 lighting states of the same room and a dusk auto-transition into lantern; if it shipped with fewer, the code round implements the full six-keyframe system from this spec regardless.

## A3. The standardized reader transport (one way to read, everywhere)

Current build's failure: the "play" control advances to the next page, chapter/page position is illegible, and there's no consistent back/forward. The reader becomes a **media player whose track is the chapter** — standard transport semantics that never vary, in every book, every mode.

**The transport bar** (persistent, bottom-center, drawn style, identical on every page):

`◀ prev page | ▶/⏸ play–pause | next page ▶` — three controls, standard symbols, fixed positions, fixed meanings:
- **Play (⏵, the terracotta control, largest)** = narrate the *current page* from the current position. Never navigates. Toggles to **Pause (⏸)** while narrating; pause keeps position (resume continues mid-sentence via the audio timestamps).
- **Prev / Next (quiet ink chevrons)** = page turns, with the kamishibai slide. Always available, always only page turns.
- Swipe remains equivalent to prev/next (A1 grammar); controls and gesture never disagree.

**Play mode is continuous (read-to-me).** While in the playing state: page narrates → 1.5s breath → auto-turn → next page narrates — like an audiobook with pictures, the convention Epic/Khan already taught him. **Interactive moments (ask / choice / breathe) always pause playback** and hand control to the child; answering resumes play mode. Pausing or manually turning exits continuous flow until play is tapped again. This amends the earlier "child-initiated turns everywhere" rule: turns are child-initiated when paused; play mode reads continuously. Drive mode = play mode + voice-only interactions (unchanged).

**Words are the timeline.** Tap any word → narration seeks to that word and plays from there (character-level timestamps make this exact). Press-and-hold a word → speaks just that word (plus meaning if it's a star word), no seek. This replaces the old tap-a-word behavior and joins the A1 gesture grammar.

**Position is always legible.**
- A drawn **ribbon scrubber** above the transport: chapter progress with a tick per page, draggable with snap-to-page (fat thumb, ≥56px hit zone), page label spoken while dragging ("page four").
- The **folio corner** (top-right, drawn dog-ear showing "4 of 12") opens the **Contents** — a drawn contents spread: chapter list with scene thumbnails, read chapters ✓, current chapter marked, tappable to jump (re-read anytime; future chapters show the closed-book state). One consistent place to answer "where am I in this book?"
- **Back** (top-left, drawn arrow) always goes up exactly one level: page → Contents → the room. Never anything else.

**Hard rules:** play/pause never navigates; prev/next never plays; no control ever changes meaning by context; transport position and symbols identical across quick stories, chapter books, kid-made books, and quiet mode. End of chapter in play mode flows into the chapter-end screen (hook + Next chapter) rather than auto-starting the next chapter — chapters are the child's decision.

**Hi-fi review checkpoint:** verify the transport exists with these exact semantics; if the in-flight prototype shipped the old play-as-next behavior, the code round implements this spec regardless, and the prototype gets a revision note.
