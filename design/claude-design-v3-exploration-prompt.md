# Claude Design prompt — Little Fables visual exploration (from the thesis)

Paste below the line into a **fresh** Claude Design project (no prior Little Fables files attached — this exploration starts from zero). The only inputs are this brief and, optionally, 2–3 pages of the existing book illustrations as content samples.

---

Design the visual world for **Little Fables** — starting from nothing but what the product *is*.

## The thesis

Little Fables is a private story universe for one child: Azad, 4 years old, curious and quick, growing up between cultures — Colombian Spanish on Mama's side, Gujarati and Hindi on Papa's, Haitian Creole next door. His parents write and generate the books; the app is where he lives inside them. It is not a content library; it is **a world that knows him**. It remembers the choices he made in yesterday's chapter. His buddy — a companion he chose — greets him by name, out loud. Stories teach invisibly (naming feelings, belly breaths, counting, brave hellos, words from home) the way a grandparent teaches: inside the story, never as a quiz. He reads in the daytime and in the car, by listening, speaking, and tapping — he cannot read UI text, so the world itself must tell him where to go. When he finishes a story, he tells it back in his own words, and the family keeps that recording like a photograph.

One more thing this world holds: **hand-made books.** Watercolor and colored-pencil illustrations his parents commissioned and made — treasures. Whatever this world looks like, those pages must feel at home in it, displayed the way a family frames what it loves.

## What the design must make a 4-year-old feel

- **"This place knows me."** Arrival is a greeting, not a menu.
- **"Something is alive here."** A companion is present on every screen — idle, breathing, reacting. Ambient motion (slow, gentle, never busy) makes the world feel awake.
- **"I know where to go."** Navigation without literacy: place, character, light, and sound carry wayfinding. If every label were removed, he could still get to his story.
- **"Reading is cozy AND an adventure."** Warmth and wonder together — light and depth (glow, layers, atmosphere), not flat panels of color and not noise.
- **"I did that."** His choices, his found words, his finished books leave visible traces in the world. Progress is a place that grows, never a score.

## Explore three directions

Each direction is a different metaphor for what this place *is*, championing a different part of the thesis. Build these three (and if a stronger thesis-derived metaphor occurs to you, you may swap ONE of them — state what you replaced and why):

**Direction A — Firefly Hollow** *(champions: "reading is cozy AND an adventure").* A storybook-dusk world at the forest's edge: deep indigo-teal skies, warm lantern and firefly glow, silhouetted trees, cozy pools of light where the books live. Rich darks make characters and illustrations luminous. Include a golden-hour daytime variant to prove it isn't night-only — this is a daytime-and-car app.

**Direction B — The Fable Tree** *(champions: "this place knows me" + "I did that").* The world is one great storybook tree that grows with the child: books nest in its branches, the companion waits at its roots, reading-day suns hang in its sky, found words bloom on it, and a winding path leads away toward each story. Navigation is moving through a place; progress is the tree visibly flourishing. Painterly, saturated-storybook palette (sage, sky, marigold, berry).

**Direction C — Paper Lantern Playroom** *(champions: "something is alive here" — the hand-made feeling).* A layered cut-paper diorama world: chunky torn-edge shapes, real shadows between paper layers, soft-but-saturated construction-paper color, tactile and huggable — the app feels crafted by hand, like the family's books are. Depth comes from paper layers; motion from gentle parallax.

Requirements for every direction:

- A world, not a layout: environments with light and depth that UI elements live *inside*.
- A companion character visibly alive in each mock.
- A palette and type pairing chosen for that world (display holds at 30px+, body reads at 24px+; storybook warmth over app-store gloss).
- Tri-cultural texture felt somewhere (not flag clichés — texture, pattern, warmth the way the family actually lives it).
- The hand-made book pages framed beautifully somewhere in the direction.
- Annotated motion intent (what breathes, drifts, glows — and how slowly).

## Surfaces to mock in each direction (same content, honest comparison)

1. **Arrival/Home** — the child arrives; his companion greets him; one clear "continue the story" moment; his collection of books; visible traces of his progress (reading days, found words) living in the world.
2. **Reading** — a story page: illustration + 1–3 sentences of read-along text with a spoken-word highlight treatment, and one "answer out loud" moment with a mic affordance.
3. **A celebration** — finishing a chapter or earning something: what joy looks like in this world.
4. **Choosing a companion** — how the child meets and picks his buddy.

## Rules that survive any aesthetic (ethics, not style)

Exactly one primary action per screen, in a single consistent action color of the direction's choosing. Every interactive element pairs a visual cue with spoken audio (show the affordance). Primary child touch targets ≥56px. No loss states, streaks-that-break, counters, currencies, locks, or leaderboards — progress only accumulates. Celebration over pressure. Reduced-motion variant respected. iPad landscape 1180×820 primary; note portrait stacking intent.

Deliver as one HTML file with a direction switcher so the three worlds compare side by side on identical content.
