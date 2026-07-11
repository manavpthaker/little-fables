# Story Universe Platform: Architecture Document
## Component Specs, Data Models, and MVP Scoping

*Working title options: "Azi-Verse Engine," "StoryLoom," "Universe Builder" — the framework is universe-agnostic; Azi-Verse is instance #1.*

---

## 1. System Overview

A local-first web application for creating, evaluating, delivering, and tracking personalized children's stories within a consistent, growing story universe. Think **Epic!'s library experience + Khan Academy's skill graph + a generation engine that keeps everything on-brand**.

### Design Principles (inherited from project decisions)

1. **Local-first, privacy-by-architecture.** IndexedDB storage, no child data leaves the device, COPPA-compliant by design not by policy. (From the Parent-Child Research Framework's offline protocols.)
2. **Universe as runtime config.** The world bible is structured data consumed by generation, evaluation, and display — not a document humans keep in sync manually.
3. **Hard gates before soft scores.** A story that violates character consistency or cultural sensitivity fails, no matter how charming.
4. **Embodiment over rules.** Generation prompts deliver the universe as a narrator identity, not a compliance checklist.
5. **Learning is invisible.** No quizzes. Skill tracking happens through story tagging and interaction signals.

---

## 2. Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                    │
│  Reader UI │ Creator Studio │ Parent Dashboard │ Library  │
├─────────────────────────────────────────────────────────┤
│                     INTERACTION LAYER                     │
│  Prediction Pauses │ Feeling Check-ins │ Mystery Words    │
│  Read-aloud/TTS │ Language Wall │ Comfort Rituals         │
├─────────────────────────────────────────────────────────┤
│                      ENGINE LAYER                         │
│  Generation Engine │ QA Pipeline │ Leveling Engine        │
│  Skill Tagger │ Personalization Engine                    │
├─────────────────────────────────────────────────────────┤
│                       DATA LAYER                          │
│  Universe Bible │ Story Library │ Skill Graph             │
│  Child Profiles │ Interaction Log │ Seed Bank             │
│              (IndexedDB, local-first)                     │
└─────────────────────────────────────────────────────────┘
```

### 2.1 Universe Bible Service

**Source:** Azi-Verse Universe Guide
**Responsibility:** Single source of truth for characters, settings, rituals, motifs, tone, and cultural configuration. Serves three consumers:

- Generation Engine (as prompt payload)
- QA Pipeline (as validation reference)
- Reader UI (character art, glossaries, pronunciation guides)

**Key operations:** `getPromptPayload(ageband, characters[])`, `validateCharacterBehavior(storyText)`, `getCulturalConfig()`

### 2.2 Leveling Engine

**Source:** Research Brief
**Responsibility:** Classifies and constrains content by age band. Enforces word counts, structural complexity, vocabulary strategy, and format rules. Owns the progression logic ("reader graduation" within the universe).

**Key operations:** `getBandSpec(age)`, `classifyStory(storyText)`, `suggestNextBand(childProfile)`

### 2.3 Skill Graph Service

**Source:** Future-Ready Skills Framework
**Responsibility:** Maintains the skills taxonomy, age-appropriate targets, and archetype mappings. Tags stories with embedded skills; computes coverage for the parent dashboard.

**Key operations:** `getSkillTargets(age)`, `tagStory(storyText)`, `getCoverageReport(childId, dateRange)`, `suggestUndercoveredSkills(childId)`

### 2.4 Generation Engine

**Source:** Prompt-engineering patterns from web-app planning + Universe Guide + Seed Bank
**Responsibility:** Assembles generation prompts (narrator embodiment + child context + skill target + band spec + optional theme seed) and calls the LLM. Supports full generation, co-writing (parent drafts, engine refines), and revision loops driven by QA feedback.

**Prompt assembly order:**
1. Narrator identity ("You are the storyteller for this universe...")
2. Child context (age, current challenge, interests)
3. Universe payload (relevant characters, settings, rituals)
4. Cultural config (languages, code-switching rules, terms to include/exclude — e.g., the Spanish-removal preference toggle)
5. Structural spec from Leveling Engine
6. Skill target from Skill Graph
7. Optional thematic seed from Seed Bank

### 2.5 QA Pipeline

**Source:** Evaluation Rubric + hard/soft constraint model
**Responsibility:** Two-stage evaluation of every story before it enters the library.

```
Stage 1 — HARD GATES (pass/fail):
  ├─ Character consistency vs. Universe Bible
  ├─ Cultural sensitivity (stereotype/tokenism check)
  ├─ Age-developmental match vs. Leveling Engine
  └─ Cultural element accuracy vs. Cultural Config
        │ any fail → regenerate with violation notes
        ▼
Stage 2 — SOFT SCORING (weighted):
  ├─ Story structure & narrative quality
  ├─ Skill embedding naturalness ("no preaching" check)
  ├─ Language & multilingual integration
  ├─ Interactive potential (pause-point density)
  └─ Therapeutic value (when applicable)
        │ score < 90 → revision loop with suggestions
        ▼
  PUBLISH to Library (with score breakdown stored)
```

**Implementation note:** Stage 1 and Stage 2 are both LLM-as-judge calls against the rubric's observable descriptors, plus deterministic checks where possible (word count, heritage-word density per page, banned-term list).

### 2.6 Interaction Layer

**Source:** Parent-Child Story Development Research Framework
**Responsibility:** Turns reading into the parent-child ritual the research validates.

- **Prediction pauses:** stories are authored/generated with marked pause points; reader UI surfaces "What do you think happens next?" with optional voice-memo capture (local, auto-deleted weekly)
- **Feeling check-ins:** Feeling Passengers UI — child assigns emotions to train cars, chooses where each "gets off"
- **Mystery Word:** one heritage word hidden per story; found words populate the family Language Wall
- **Read-aloud:** Web Speech Synthesis API (zero-setup) with ElevenLabs as premium upgrade path
- **Comfort rituals:** every story ends in the app the way it ends on the page — a closing screen with the snack/song/moon motif

### 2.7 Parent Dashboard

**Sources:** Skill Graph + Interaction Log + QA assessment indicators
**Responsibility:** The Khan-Academy-style view for adults only.

- Skill coverage over time (which competencies stories have touched)
- Engagement signals (re-read requests, pause participation, mystery words found)
- Behavioral integration prompts ("Azi's Gentle Giant's Secret came up 3× this month — try referencing it during transitions")
- Parent guides attached to each story (plain language, concrete scripts)

---

## 3. Data Models

All stored locally in IndexedDB. Shapes shown as JSON.

### 3.1 Character

```json
{
  "id": "char_jujy",
  "name": "Jujy",
  "role": "The Loyal Leader",
  "species": "tuxedo cat (plush, was once real)",
  "traits": ["confident", "devoted", "forgets plans mid-announcement"],
  "speechPatterns": ["announces plans grandly", "trails off"],
  "relationships": [
    { "characterId": "char_azi", "type": "companion", "note": "deeply devoted" }
  ],
  "roleByBand": {
    "0-3": "cuddly presence",
    "4-8": "speaking friend",
    "7-10": "flawed leader learning to listen"
  },
  "canonRules": ["never cruel", "confidence exceeds competence, kindly"],
  "visualAnchors": ["black-and-white tuxedo pattern"],
  "firstAppearance": "story_whisker_roll_001"
}
```

### 3.2 Story

```json
{
  "id": "story_moose_bigness",
  "title": "The Moose Who Knew About Bigness",
  "status": "published",
  "ageBand": "4-8",
  "format": "picture-book-length read-aloud",
  "wordCount": 2400,
  "structure": { "parts": 8, "pausePoints": [3, 5, 7] },
  "charactersUsed": ["char_azi", "char_pandies"],
  "settingsUsed": ["setting_adirondacks_farm"],
  "skillTags": ["SS003.emotional-regulation", "SS002.empathy"],
  "therapeuticTechnique": {
    "name": "Gentle Giant's Secret",
    "type": "embedded-regulation",
    "parentGuideId": "guide_moose_001"
  },
  "culturalElements": {
    "heritageWords": [{ "word": "agua", "language": "es", "page": 4 }],
    "densityPerPage": 1
  },
  "mysteryWord": { "word": "agua", "language": "es" },
  "qaRecord": {
    "hardGates": { "passed": true },
    "softScore": 93,
    "breakdown": { "structure": 9, "skills": 10, "cultural": 8, "language": 9, "universe": 10 },
    "revisions": 2
  },
  "content": "...markdown...",
  "parentGuide": "...markdown...",
  "createdAt": "2026-05-02",
  "moralPlacement": ["part3", "part6", "closing-line"]
}
```

### 3.3 Skill Graph Node

```json
{
  "id": "SS003.emotional-regulation",
  "cluster": "Adaptive Resilience",
  "label": "Emotional regulation",
  "ageTargets": {
    "0-3": "naming feelings",
    "4-8": "pause-and-choose strategies",
    "7-10": "self-directed coping under pressure"
  },
  "teachingArchetypes": ["Resilience Champion"],
  "observableIndicators": [
    "child references technique outside story time",
    "improved recovery time from upsets (parent-reported)"
  ],
  "relatedSkills": ["SS002.empathy", "SS003.adaptability"]
}
```

### 3.4 Child Profile

```json
{
  "id": "child_001",
  "firstNameOnly": "Azi",
  "birthMonth": "2022-04",
  "currentBand": "4-8-early",
  "languages": { "home": ["en", "es"], "heritage": ["hi", "gu"], "exposureGoals": ["hi"] },
  "interests": ["guitar", "puzzles", "trampoline"],
  "currentChallenges": ["sleep transitions", "physical impulse control"],
  "comfortObjects": ["Slothie", "Jujy"],
  "contentPreferences": {
    "excludeTerms": [],
    "toneCalibration": "lighter-playful",
    "framingDevices": false
  }
}
```

*Note: no last names, no photos, no cloud sync. The `excludeTerms` array is where the Spanish-endearment toggle lives — a per-profile preference, not a universe rule.*

### 3.5 Interaction Event

```json
{
  "id": "evt_8842",
  "childId": "child_001",
  "storyId": "story_moose_bigness",
  "type": "prediction_pause",
  "pausePoint": 5,
  "engaged": true,
  "voiceMemoRef": "local_blob_ref | null",
  "autoDeleteAt": "2026-07-17",
  "timestamp": "2026-07-10T19:42:00"
}
```

### 3.6 Universe Config (top-level)

```json
{
  "universeId": "azi-verse",
  "tone": "gentle, elevated, timeless, authentically multicultural",
  "narratorIdentity": "...embodiment prompt block...",
  "rituals": ["whisker-wiggle roll call", "comfort ending", "moon watches"],
  "hardRules": ["no framing devices unless requested", "morals distributed across 3 moments"],
  "culturalConfig": { "cultures": ["Colombian", "Indian"], "consultationLog": [] },
  "scoringWeights": { "structure": 0.20, "skills": 0.20, "cultural": 0.15, "language": 0.15, "age": 0.20, "universe": 0.10 }
}
```

---

## 4. MVP Scoping

### Phase 0 — Foundation (what already exists)
✅ Universe bible content, skills framework, rubric, research base, ~a dozen validated stories, docx/PDF production pipeline, TTS vendor decision.

### Phase 1 — MVP: "The Living Library" (4–6 weekends of build)

**Goal:** Replace the current chat-session workflow with a persistent app for the two of you.

- Story library: import existing stories (markdown), browse by band/skill/character
- Reader UI: clean read-aloud view, marked pause points, Web Speech TTS
- Universe bible as editable structured data (characters, settings, rituals)
- Child profile with preference toggles
- Manual story entry + parent guide attachment
- IndexedDB persistence, export/import for backup

**Explicitly deferred:** generation, automated QA, dashboard.

**Success test:** bedtime happens from the app three nights a week without friction.

### Phase 2 — Generation + QA (the engine)

- Generation Engine with embodiment prompting (Anthropic API in artifact, or API key in a local app)
- Hard-gate checks (deterministic first: word counts, heritage-word density, excluded terms; then LLM-as-judge for character consistency and sensitivity)
- Soft scoring with revision loop
- Co-writing mode: parent seed → engine draft → collaborative edit

**Success test:** a newly generated story passes the same bar as "The Moose Who Knew About Bigness" with ≤2 revision loops.

### Phase 3 — Interaction Layer

- Prediction-pause UI with optional local voice memos (auto-delete)
- Mystery Word game + Language Wall
- Feeling Passengers check-in
- ElevenLabs TTS upgrade

### Phase 4 — Dashboard + Multi-Child + Open Framework

- Skill coverage dashboard and behavioral-integration nudges
- Second-child support (sibling profile, shared universe)
- Universe templating: extract Azi-specifics into config → open-source the shell (see companion roadmap doc)

### Build-stack recommendation

React + IndexedDB (Dexie.js), no backend for Phases 1–3. Generation via API calls with user-supplied key kept local. This matches the local-first decision already made and keeps COPPA posture trivially clean: there is no server to audit.

---

## 5. Risks & Open Questions

1. **LLM-as-judge reliability** for cultural sensitivity — keep the human (and family-elder consultation log) in the loop for any story touching new cultural ground; automate only what's been human-validated as a pattern.
2. **Rubric drift** — the rubric evolved 3× already; version it in the config so old stories keep their original score context.
3. **Voice cloning** for narration is powerful but store any voice model locally only.
4. **Scope creep** — the framework docs describe an ages 0–12 arc; the MVP should serve exactly one four-year-old exceptionally well.
