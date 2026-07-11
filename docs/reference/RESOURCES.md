# Little Fables — source materials index

> **⚠️ Canon note:** `azi-verse/` is the **universe source of truth** (the real Azi-Verse: Westfield/Rahway, plush companions Jujy/Dory/Pandies/Citie/Clappy/Slothie/Monkie/Peter/Pooh, Colombian-Indian tri-cultural family, rituals, evaluation rubric with a 90+ ship gate, craft rules). It supersedes the invented Miko/Zoomtown universe, which remains only as one storybook series with finished art. See `docs/content-pipeline.md` for how the library gets pre-populated from it.

Curated from the Storyverse framework repo and the original LittleFables Python system. **This folder is the knowledge base for the v2 build** — the Claude Code prompt will point here, and the story-engine system prompt should be assembled from these, not written from memory.

## How each asset feeds the build

### Story engine (app/api/story — the heart)

| Asset | Use |
|---|---|
| `storyverse/story-generation.txt` | The original master generation prompt (universe injection, 5-layer architecture, character consistency rules). Merge its structure into the chapter-generation system prompt. |
| `storyverse/docs/06-skill-embedding.md` | How to embed teaching goals through ACTION, never lectures — the canonical guidance for writing `ask` blocks. Quote its patterns in the system prompt. |
| `storyverse/docs/07-therapeutic-techniques.md` | Emotional-regulation story patterns (naming feelings, belly breaths, externalization). Drives the "feelings" ask type and chapter emotional arcs. |
| `storyverse/docs/08-story-structure.md` | Story structure by age band — pacing, sentence rhythm, page counts. Source of truth for chapter length (4–7 pages) and arc shape per chapter vs. per book. |
| `storyverse/docs/05-cultural-integration.md` | Code-switching and family-word integration rules (context makes meaning clear, never dictionary translations). Governs Gujarati weaving. |
| `littlefables/config/age_group_settings.json` | Concrete vocabulary lists, sentence structures, themes, and tone per age band (0–2 → 7–8). Inject the 4–5 and 5–6 bands into the system prompt as vocabulary calibration. |
| `littlefables/prompts/writing_styles.json` | Writing-style exemplars per reading level with concrete example sentences — few-shot material for the generator. |
| `littlefables/config/themes.json` + `config/story_templates.json` | Theme taxonomy and story premise templates — seed the parent maker's "surprise me" and Today's-adventure premise rotation. |

### Quality gate (validate generated chapters before they reach Azad)

| Asset | Use |
|---|---|
| `storyverse/docs/09-quality-evaluation.md` | The scoring rubric (entertainment, skill embedding, values, consistency, cultural authenticity). Turn into an automated post-generation check: a cheap second model call scores the chapter; regenerate below threshold. |
| `littlefables/prompts/proofing_review.json` | Proofing question set (clarity, age-fit, tone) — merge into the same quality-gate pass. |

### Parent maker (story creation flow)

| Asset | Use |
|---|---|
| `littlefables/prompts/story_development.json` | Character/plot elicitation questions — the parent maker's guided mode ("Who is the main character? What motivates them?"). |
| `littlefables/prompts/writing.json` | Drafting prompts for story openings/beats — power the maker's step-by-step co-writing option. |
| `littlefables/prompts/interactive_features.json` | Patterns for interactive elements — cross-check when designing new ask/choice types. |
| `littlefables/prompts/accessibility_prompts.json` | Accessibility phrasing guidance — informs spoken-navigation copy. |
| `storyverse/templates/*.yaml` | Universe/character/setting/cultural-elements schemas — the canonical shape for `azad-verse` and the Parent Corner universe editor fields. |

### Art & design

| Asset | Use |
|---|---|
| `style_analysis_framework.md` | Framework for analyzing/matching illustration style — the base for per-chapter art-generation prompts (P2) so generated art matches the ink-and-wash books. |
| `littlefables/prompts/scene_design.json` + `prompts/style_inspiration.json` | Scene composition and style prompts — merge into art-generation prompts and scene-emoji fallback choices. |
| `littlefables/style_guide.md` | The original brand/style guide — historical context for the design system. |
| `universal_template_system.md` | Layout/template system from the print-book era — reference for the print-a-book offshoot. |

### Voice & pedagogy

| Asset | Use |
|---|---|
| `littlefables/storytelling_tips.md` | Read-aloud and engagement techniques — informs narration pacing, recap phrasing, buddy dialogue. |
| `storyverse/docs/00-philosophy.md` | The why — 5-layer architecture rationale. Preserve in any rewritten system prompt so intent survives refactors. |

## Not copied (where to find more)

- Storyverse repo (`../storyverse/`): example universes (maya-verse), validator tools, remaining docs (universe design guide, getting started, technical implementation).
- `Little Fables Stories/LittleFables/models/`: Python model sketches (engagement_model, emotion_analysis, age_adjustment, decision_tree_model, reinforcement_learning…). Not runnable as-is, but `age_adjustment.py` and `engagement_model.py` contain heuristics worth mining if we later tune difficulty or session pacing.
- `Little Fables Stories/Azi's Little Bhen/Reference Illustrations/` + `Reference photos/`: character reference sheets (Azi, Kaka, Kaki, Dada, Dadi) — the consistency anchors for future AI art generation of family characters.
- `Little Fables Stories/LittleFables/config/`: additional configs (conversation_flows.json copied; design_system.json, layout_templates.json, prompts.json remain in place).
