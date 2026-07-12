---
name: little-fables-design
description: Use this skill to generate well-branded interfaces and assets for Little Fables — a private, voice-first storybook app for one 4-year-old, rendered as a hand-drawn room in ink and watercolor. Contains essential design guidelines, the pigment/type/motion token system, the north-star room scene, drawn UI components (buddy, books, reading spreads, endpapers), and rules ("the constitution") for prototyping in this world.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

Key entry points:
- `readme.md` — context, content fundamentals, visual foundations, iconography, index.
- `styles.css` — the token system (import this; it pulls in fonts + all tokens).
- `assets/room/north-star.svg` — THE scene; every visual decision derives from it.
- `assets/lf-filters.js` — include once per page for the drawn-line/wash/boil SVG filters.
- `components/` — Buddy, SpeechBalloon, BookCover, ReadingPage/MicButton, AskCard, ChoiceCards, BreatheCircle, WritingMoment, ReadingSuns, StarWord, Medallion, RecapStrip, Endpaper, ParentSurface (each with a `.prompt.md`).
- `guidelines/constitution-*.card.html` — the eleven rules; obey all of them in anything you make.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

Non-negotiables when designing for Little Fables: warm paper ground (never flat, never white), warm ink (never #000), the 10 pigments only, terracotta = exactly one action per screen, colored shadows (dusk/bark, never grey), type always set (Young Serif display / Alegreya reading, 24px+ for the child; Caveat ONLY for the child's own words), drawn borders not geometric strokes, foley-only sound, no spinners (endpapers wait instead), no loss states, celebrations are light not confetti, reduced-motion variants always.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
