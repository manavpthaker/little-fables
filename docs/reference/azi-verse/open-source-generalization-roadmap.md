# Open-Sourcing the Framework: Generalization Roadmap
## What to Extract First, What Stays Yours, and the Order of Operations

The core insight: **the Azi-Verse is an *instance*; the framework is the *product*.** Open-sourcing means separating the two cleanly. Some parts generalize almost for free; others are deeply entangled with your family and should never ship.

---

## The Separation Test

For every artifact, ask: *"If a Vietnamese-Brazilian family in Toronto used this tomorrow, what would they change?"*

- If the answer is "nothing" → **framework** (ship it)
- If the answer is "swap the values" → **config schema** (ship the schema, keep your values)
- If the answer is "this makes no sense for them" → **instance** (keep private, use as example only with permission you give yourself)

---

## Tier 1: Generalize First (highest value, lowest extraction cost)

### 1. The Evaluation Rubric → "Universe Quality Standard"

**Why first:** It's already ~90% universe-agnostic. Only the criterion labels reference Azi specifics ("Colombian and Indian cultures" → "the family's configured heritage cultures").

**Extraction work:**
- Parameterize cultural references to `{{culturalConfig}}`
- Ship both Standard and Illustrated versions
- Ship the hard-gate/soft-score two-tier model as the recommended implementation — this is your most original contribution and it's invisible in the rubric table itself
- Include the "Pickles and the Pause" lesson as documentation: *the rubric measures belonging, not just quality*

**Effort: Low. Value: Very high** — nothing like this exists publicly for family story universes.

### 2. The Age-Band Leveling Spec → "Format Ladder"

**Why:** Pure synthesis of public research. Zero family-specific content. Word counts, structural complexity, format rules, cross-age continuity techniques (role evolution, callbacks, cameos).

**Extraction work:** Almost none — restructure as a reference table + JSON schema.

### 3. The Future-Ready Skills Framework → "Skill Graph Starter"

**Why:** Already written universe-agnostically with IDs, tags, and cross-references. It *is* a schema with example data.

**Extraction work:**
- Ship taxonomy + age targets + archetypes + assessment indicators as-is
- Mark scenario planning (SC001–003) as optional/opinionated — the dystopian scenario framing won't suit every family
- Let families prune: a "select your priorities" onboarding beats shipping all six clusters as mandatory

---

## Tier 2: Ship as Schemas + Worked Example (medium extraction cost)

### 4. The Universe Bible → "World Bible Schema"

**The entanglement problem:** The guide's *content* is deeply personal (Rahway, the Westfield, Lito and Lita, Hess trucks). The *structure* is universal genius: settings with emotional functions, characters with jobs and speech patterns, rituals and motifs, tone specification, emotional-theme catalog.

**Extraction work:**
- Define the schema: `Character { role, traits, speechPatterns, roleByBand, canonRules }`, `Setting { emotionalFunction, sensoryAnchors }`, `Ritual`, `Motif`, `EmotionalTheme`
- Write a **fictional worked example** (invent a sample family — do NOT ship the Azi-Verse as the example; it contains your child's real name, town, school, birthday, and family structure)
- Ship a "Universe Interview" — the questionnaire that walks a new family from blank page to populated bible. This becomes the app's onboarding flow later.

**Privacy note: this is the tier where discipline matters most.** The current guide contains real names, a real address pattern, real schools, a real birthdate. None of that ever enters the repo, even in git history.

### 5. The Prompt-Engineering Patterns → "Embodiment Prompting Guide"

**Why:** The rule-following vs. character-embodiment distinction, the prompt-assembly order, and the hard-gate regeneration loop are genuinely novel documentation for LLM-assisted family storytelling.

**Extraction work:** Rewrite examples with the fictional worked-example family. Ship as a markdown guide + prompt templates with `{{placeholders}}`.

### 6. The Interaction Rituals → "Ritual Library"

**Why:** Prediction pauses, Feeling Passengers, Mystery Word, the 8-week playbook — all research-backed, none Azi-specific.

**Extraction work:** Strip the Colombian/Indian language examples down to `{{heritageLanguage}}` placeholders. Ship the 8-week playbook as a printable + the research citations that back each ritual.

---

## Tier 3: Ship Late or Never

### 7. The Stories Themselves — **Never** (as-is)

Your stories contain your son's name, plush companions' names, real locations, and therapeutic content calibrated to his specific challenges. They are the private payoff of the framework, not the framework.

**Alternative:** Write 2–3 demonstration stories *for the fictional example family*, run them through the rubric publicly (show the scores and revision loops), and ship those. Showing the QA process on example content is more valuable to adopters than the content itself.

### 8. The Quotes Collection — Skip

Attributed third-party quotes; thin value, nonzero rights friction. Replace with a note on building your own seed bank.

### 9. Child Profiles / Interaction Data Schema — Ship schema, hardcode the privacy rules

Ship the data models with the privacy constraints **baked in as code, not documentation**: first-names-only field validation, no photo fields, local-only storage, auto-delete timers on voice memos. Make the safe path the only path.

---

## Order of Operations

**Release 1 — "The Method" (docs only, no code):**
Rubric + Format Ladder + Skill Graph + World Bible Schema + Universe Interview + Embodiment Prompting Guide. A family with ChatGPT/Claude access can run the entire method manually. This is your equivalent of a whitepaper and will find its audience (parenting communities, multilingual family groups, therapeutic storytelling practitioners) before any code exists.

**Release 2 — "The Toolkit":**
JSON schemas, prompt templates, the two-tier QA checklist as a fillable worksheet, the fictional worked example with demo stories.

**Release 3 — "The App":**
The Phase 1 MVP from the architecture doc, universe-templated. New family → Universe Interview → populated bible → library.

---

## Licensing & Positioning Notes

- **Docs/method:** CC BY-NC-SA fits the spirit (families use freely, no one commercializes your method without you)
- **Code:** MIT or AGPL depending on whether you'd ever want a hosted-service path yourself (AGPL protects that option)
- **Name separation:** trademark-think even casually — "Azi-Verse" stays yours; the framework gets its own name so adopters build *their* universe, not extensions of your child's
- **Positioning sentence to test:** *"A research-backed framework for building your family's own story universe — one that grows with your child, honors your languages, and teaches without teaching."*

## The One-Sentence Strategy

Ship the loom, keep the tapestry.
