# Home UI kit — the acceptance test

The north-star room as the real Home screen, interactive.

**What it demonstrates**
- The room IS the interface: buddy (breathing, tappable — cycles spoken lines/poses), one speech balloon, Continue beacon glowing on *Miko and the Wobbly Bridge*, four reading-day suns on the sill.
- Tap any book → endpaper rises from the book's own position and takes the stage (900ms, physical, continuous) → reading spread on the book's endpaper color. Lamplight sweeps the words; drawn mic (terracotta when live); drawn page-turn corner; kamishibai slide between pages; drawn back button puts the book away (endpaper shrinks back to the shelf).

**Acceptance checks**
- 9am test: cold open → page one of a chosen book in ONE tap. ✓
- Squint test: exactly one glowing thing (the beacon). ✓
- One-hand test: buddy, shelf, mic, corner all ≥56px and in the lower two-thirds. ✓
- Decision points: buddy, beacon book, other shelf books — 3 clusters, ≤5. ✓
- No spinner: waiting = the endpaper motif blooming. ✓

**Files**: `index.html` (stage + fonts + bundle), `RoomScene.jsx` (inlines the north-star SVG, hides its static bear), `Home.jsx` (state machine: room → opening → reading → closing).
