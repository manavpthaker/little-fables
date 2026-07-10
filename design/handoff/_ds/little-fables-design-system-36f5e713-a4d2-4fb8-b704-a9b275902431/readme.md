# Little Fables Design System

**Little Fables** began as a storybook composer — a canvas tool for parents and teachers to create printable bedtime stories — and is evolving into an EPIC / Khan Academy Kids / YouTube Kids-style app: interactive stories with bidirectional learning, built for one specific kid first (Azad, 4). Stories run on the **Storyverse 5-layer framework**: surface (fun) / skills / values / systems / future. The reader speaks pages aloud, asks teaching questions the child answers by voice ("ask" blocks), and branches on the child's choices ("choice" blocks).

## Sources

- Codebase: `little-fables/` (local mount, Next.js 14 + Tailwind + shadcn/ui, read-only). Key paths:
  - `app/read/*` + `lib/read/*` + `lib/universe/azad-verse.ts` — **Story World**, the kid-facing reader PWA (the brand's design heart)
  - `app/story/create`, `components/workspace/*`, `components/shared/*` — the tablet-first **Composer**
  - `components/ui/*` — stock shadcn primitives (parent surfaces)
  - `app/api/story/route.ts` — the story engine prompt (tone-of-voice source)
- Brand folder: `Little Fables Stories/` (local mount) — the **logo** (`little-fables_logo-tree-01@300x-8.png`, `LittleFables/little-fables_logo-tree-02.svg`), two produced picture books ("Azi's Little Bhen" pages, "Jujy Christmas Adventure" print proofs V01-V04), watercolor reference illustrations, an `Inspiration/` folder (external references — not copied in), and a Python story-pipeline (`LittleFables/`) with config JSONs.
- No Figma or decks were provided.

## The two surfaces

1. **Story World** (kid, tablet/phone PWA) — the **Dream Paper** system (decided 2026-07, direction 3 in `explorations/`): warm cream paper, espresso ink, one coral action color, pastel chips, real illustration; **bedtime mode** flips cream→night indigo and coral→butter. This replaced the earlier candy-gradient night look.
2. **Parent surfaces** (Composer + Parent Corner, light) — calm, quiet shadcn neutrals in Inter. Tools for grown-ups; deliberately undecorated so the stories carry the color.

---

## CONTENT FUNDAMENTALS

**Voice**: warm, playful, direct. Short rhythmic sentences written to be read aloud. Sound effects are first-class copy: "Vroom vroom!", "SCREEEECH!", "ROOOAAAR!". Onomatopoeia in caps, always with exclamation marks.

**Kid-facing copy**
- Speaks TO the child as "you"; the app belongs to the child ("Azad's Story World", "Interactive stories made just for Azad").
- Exclamation-mark energy: "Make a New Story!", "Pick a story or make a new one!"
- Questions invite participation, answerable out loud in a word or two by a 4-6yo: "Can you count the missing planks with me?"
- Praise is specific and echoes the answer: "Yes! THREE planks were missing. Great counting!" Hints are gentle and phonetic: "Red, blue, red, blue, red... b-b-b...?"
- Feelings are named, then regulated: "Miko's tummy felt tight and worried." → "One big belly breath. In... and out."
- Teaching is embedded in ACTION, never lectures. Values (kindness, gratefulness, trying again) are modeled by characters, not stated.
- Title case for story titles ("The Rocket That Wouldn't Roar"); sentence case elsewhere.

**Parent-facing copy**: plain, quiet, sentence case. "Auto-saved", "Search stories...", "Create Test Story", "Storage: 245 MB / 1 GB". No exclamation marks, no emoji. First-person possessives ("My Stories").

**Emoji in copy**: kid surfaces use emoji freely as decoration and iconography (🌟 in headings, 🪄 on the CTA). Parent surfaces use none.

**The cast** (original characters only — never brand/IP characters): Miko 🦊 (fox on a blue moto, "Vroom vroom, let's zoom!"), Tara 🕷️ (clever spider, "A web can fix it!"), Boulder 🦕 (gentle brontosaurus builder, "Slow and steady builds it best."). Settings: Zoomtown, the Star Garage, Dino Canyon.

---

## VISUAL FOUNDATIONS — Dream Paper

**The rule that makes it cohesive: one temperature.** Everything on kid surfaces is warm — warm cream, warm ink, warm borders, warm shadows. Never mix cool grays or blue-blacks onto the paper.

**Color**
- Canvas: cream `#FBF4E6`; cards `#FFFDF7` with 1.5px warm lines `#F0E4CD`; text espresso `#3B3227`, soft `#8A7B68`, faint `#B9A98F`.
- **Coral `#F4813C` is THE action color — one per screen**: the CTA, the mic, the play/next, the spoken-word highlight. Pressed `#D96A28`. It floats on a soft glow (`0 6px 14px rgba(244,129,60,.35)`), never hard shadows.
- Pastels (peach `#FFE8CF`, mint `#DFEEDD`, lilac `#E9E6F6`, blush `#FBE1E4`) label things — category chips, washes, praise/hint states — and never act.
- **Bedtime mode flips, doesn't fork**: cream→night indigo `#1e1b4b`, coral→butter `#fbbf24`, text→cream. Same rules, lights down.
- **Saturation belongs to the art.** Covers and scenes bring the rainbow; the UI stays paper-quiet so they glow. Scene gradients (`--lf-scene-*`) survive as the emoji-placeholder scene backgrounds until per-story art lands.

**Type**: Baloo 2 (600-800) for display — greetings 30px, story titles 22, sections 17, buttons 18. Quicksand (600-700) for everything read: story text 17px/1.7, labels 13, meta 12.5. Never one font everywhere; never Baloo for long text. (Baloo 2 is a new brand decision — not in the codebase yet; Quicksand already is. Inter stays on parent surfaces.)

**Backgrounds**: flat cream with 2-3 faint `✦`/`〰` doodle marks at ~6% espresso opacity. No gradients as chrome, no textures, no images-as-background.

**Shape**: everything soft — pill buttons/search/nav (999px), cover squircles 18px, cards 20px, scene art 24px, arch-top hero art (`170px 170px 20px 20px`), scalloped chip labels (`12px 12px 22px 22px`). Floating pill bottom nav.

**Elevation**: warm shadows only — `--shadow-warm` (nav, covers), `--shadow-warm-lg` (scene art), `--shadow-coral-glow` / `--shadow-butter-glow` (the action). Cards prefer a 1.5px warm line over shadow.

**Motion**: press = scale(.95) 150ms (unchanged); the mic breathes via a slow glow pulse; panels slide 300ms ease-out; reduced-motion respected. Word highlight tracks read-aloud.

**Hover/press**: touch-first — press scale everywhere; inactive nav items sit at faint `#B9A98F` and gain espresso on hover.

**Touch**: 44px minimum targets, tap feedback on everything interactive.

---

## ICONOGRAPHY

- **Logo: the Fable Tree** — a hand-inked woodcut tree (radiating brush-stroke canopy, leaves, roots) in charcoal ink `#1c2527`. Files: `assets/logo-tree-ink.png` (transparent, ink), `assets/logo-tree-white.png` (transparent, for night/dark), `assets/little-fables-logo-tree.png` (original, opaque light bg), `assets/little-fables-logo-tree-02.svg` (vector variant). It reads perfectly at 26px+ and holds on paper, night indigo, and scene gradients. Wordmark: "Little Fables" set next to the mark — Literata/serif on storybook surfaces, Fredoka on kid UI, Inter on parent chrome. Never redraw or restyle the tree; the app-code `Logo.tsx` (plain type) predates the mark.
- **Kid surfaces: illustration first, emoji as placeholder.** Real story art fills covers and scenes (`assets/illustration/`); until per-story art generation lands, scenes fall back to 2-5 large emoji on a scene gradient. UI glyphs are quiet unicode + emoji: ⌕ search, 🎤 mic, ▶ play, ‹ › nav, ✎ create/writing, ⌂ home, ⚙ grown-ups, ⭐ stars, ✦ doodles. No icon font, no SVG icon set.
- **Parent surfaces: [Lucide](https://lucide.dev)** (`lucide-react` in source) at 16px (`w-4 h-4`), stroke style, matching text color. Common glyphs: BookOpen, Sparkles, Palette, Users, Bot, Save, Share2, Eye, Plus, Search, Clock, Star, Settings, LogOut. In HTML kits we load Lucide from CDN (`unpkg.com/lucide@latest`) — same set the codebase imports.

---

## ILLUSTRATION

Little Fables ships real illustrated books; that art is the brand's visual soul and where the app is headed:
- **Style**: soft colored-pencil / watercolor on warm cream paper. Gentle vignettes, quiet backgrounds, tender expressions. Muted heirloom palette: cream `#f7f1e3`, charcoal ink `#1c2527`, sage `#a8b59a`, dusty blue `#93aebd`, ochre `#d9a05b`, terracotta warmth in skin tones.
- **References in `assets/illustration/`**: `azi-kitchen.jpg`, `azi-scene-03.jpg` (book pages from "Azi's Little Bhen"), `jujy-cover.jpg` (vintage-storybook cover, richer + darker), `vocab-page-ref.jpg` (watercolor vocabulary spread — the print ancestor of VocabStar).
- **Emoji scenes are the placeholder, watercolor is the destination**: the reader's emoji-on-gradient scenes stand in until per-story art generation matches the book style.
- Direction exploration (colorful app vs ink-and-paper storybook): `explorations/Direction — Colorful vs Storybook.html`.

---

## INDEX

- `styles.css` — global entry; imports everything under `tokens/`
- `tokens/` — `fonts.css` (Google Fonts CDN), `colors.css`, `typography.css`, `geometry.css` (radius/shadow/motion/touch)
- `guidelines/` — foundation specimen cards shown in the Design System tab
- `assets/` — logo (`logo-tree-ink.png`, `logo-tree-white.png` + originals) and `illustration/` book-art references
- `explorations/` — design-direction explorations (not part of the shipped system)
- `components/story-world/` — kid primitives: `MagicButton`, `StoryCover`, `SceneStage`
- `components/learning/` — bidirectional-learning primitives: `AskBubble`, `ChoiceCards`, `VocabStar`
- `components/parent/` — shadcn recreations: `Button`, `Card`, `Input`, `Avatar`
- `ui_kits/story-world/` — the kid reader PWA: Library + interactive story Reader
- `ui_kits/composer/` — parent/teacher surfaces: marketing home + tablet composer
- `SKILL.md` — agent skill entry point

**Intentional additions** (not literal components in source, derived from the data model + starter stories): `AskBubble`, `ChoiceCards`, `VocabStar`, `SceneStage` render the `ask` / `choice` / `scene` / `vocab` blocks defined in `types/story.ts` — the reader screen that displays them isn't built in the codebase yet, so their visual treatment extends the Library screen's established language (gradients, pills, Fredoka, press-scale).

**Codebase honesty notes**: the composer's shadcn theme is stock neutral — README.md declares purple `#8b5cf6` as brand primary but no code applies it; we token it as an accent, not chrome. Fonts ship from Google Fonts CDN (no binaries in repo).
