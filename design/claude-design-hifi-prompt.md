# Claude Design prompt — Little Fables hi-fi mockup

Paste the prompt below into Claude Design (claude.ai/design) in the same project that produced the design-system handoff, so it can reference the tokens, components, and UI kits directly.

---

Design the complete hi-fi UI for **Little Fables — Story World**, the kid-facing interactive reading app (think Epic!, but personalized and voice-interactive), using the existing design system in this project exactly as specified: Dream Paper palette (cream #FBF4E6 canvas, espresso ink, coral #F4813C as the ONE action color per screen, pastels for labels only), Baloo 2 display + Quicksand body, pill/squircle/arch shape language, warm shadows only, emoji-as-illustration with real watercolor art where available.

**Device: iPad portrait (~820×1180), designed for a 4-year-old** — generous type, primary touch targets 56px+, one clear action per screen. Use the real content from the ui_kits/story-world/story-data.js ("Miko and the Wobbly Bridge", "The Rocket That Wouldn't Roar") and the real watercolor art in assets/illustration (azi-kitchen, azi-scene-03, jujy-cover) for "Azi's Little Bhen".

Produce these screens and states, linked as a click-through flow:

1. **Home / Library** — evolve the existing LibraryScreen: logo header, greeting ("Azad! What's tonight's story?"), voice-search pill with coral mic, category chips, arch-top "Tonight's story" hero, bookshelf mixing watercolor covers and gradient-emoji covers (give image covers a consistent cream frame so the shelf reads as one family), a "writing itself…" in-progress slot, floating pill nav (Home / Library / Create / Grown-ups).
2. **Story Maker** — kid-facing creation: hero picker (Miko 🦊, Tara 🕷️, Boulder 🦕, Papa, Dadi, Surprise), place picker, big coral "Tell me your idea!" mic moment with a listening state (pulsing rings), and a full-screen "Making your story…" generation state with playful progress copy.
3. **Reader** — the core screen, five states: (a) reading with word-by-word highlight (peach fill + coral underline) on the cream reading card below the scene art; (b) **ask** teaching moment: question bubble inside the reading card, coral mic, listening state; (c) praise state (green glow, specific praise copy) and hint state (amber glow, gentle phonetic hint); (d) **choice** point: 2–3 big choice cards with emoji, "say it or tap it" affordance, then a "your choice is changing the story…" generating state; (e) scene art variants: emoji-on-gradient AND full-bleed watercolor (use the Azi kitchen art).
4. **Story end / Tell it back** — celebration, tappable vocab stars, retell prompts, big coral record button with recording state, and "Saved for Mom and Dad!" confirmation.
5. **Bedtime mode** — the same Home and Reader with the tokenized flip: cream→night indigo sky, coral→butter #fbbf24, and show where the toggle lives (moon button in the home header).
6. **Grown-ups (Parent Corner)** — shadcn neutrals, Inter, quiet and plain: math gate, retell recordings list with audio players, universe editor (interests, teaching goals, family words in Gujarati), clearly separated from the kid world.
7. **Edge states** — offline banner ("No internet — your saved stories still work!"), generation error ("The story machine hiccuped. Try again!"), and empty "writing itself" shelf slot.

Rules: coral appears exactly once per screen as THE action; pastels never act; parent surfaces get no emoji and no exclamation points; kid surfaces never show file paths, timestamps, or settings language; all copy follows the voice guidelines (short rhythmic sentences, praise echoes the answer in CAPS, hints are phonetic and kind). Respect reduced motion. Reading text on iPad should be at least 22–26px — bump --text-story-page for this canvas rather than shipping the 17px phone size.
