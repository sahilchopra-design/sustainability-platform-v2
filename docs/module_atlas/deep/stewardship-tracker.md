## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch (partial).** The guide's headline formula, `EER (Engagement Effectiveness
> Rate) = Milestones Met / Total Milestones × 100`, **is not computed anywhere in the code** — there
> is no `EER`, no "milestones met" counter, and no percentage-complete metric per engagement. What
> the module actually implements is a genuine **CRUD engagement tracker**: 17 hand-authored,
> plausible, real-company engagement records (ExxonMobil, Shell, BP, Apple, Rio Tinto, Adani, etc.)
> with add/edit/delete forms, localStorage persistence, and CSV/JSON export — closer to a
> lightweight stewardship CRM than a scored effectiveness-rate engine. As with the sibling module
> `stewardship-report-generator`, a real backend engine (`stewardship_engine.py`) with genuine
> engagement-scoring and escalation logic exists but is not called from this page.

### 7.1 What the module computes

`SAMPLE_ENGAGEMENTS` (17 records) is the seed dataset, replaced by the user's own saved data once
they add/edit engagements (`localStorage['ra_stewardship_v1']`). Each record carries real-world
plausible fields: `companyName`, `ticker`, `sector`, `topic` (one of 8 named ESG topics: Climate
Target Setting, Coal Phase-Out, Board Diversity, Supply Chain Labor, Deforestation, Water
Stewardship, Executive Remuneration, GHG Disclosure), `engagementType` (Letter/Meeting/Public
Statement/Collaborative/Vote Against/Co-filing), `escalationLevel` (1–5), `outcome` (7-state:
Pending/Positive/Partial/No Change/Escalated/Resolved/Negative), `status` (5-stage pipeline:
Draft→Sent→Acknowledged→In Progress→Resolved), `esgScore`, `sbtiCommitted`. `uid()` (an `sr()`-seeded
base-36 string) generates record IDs only — it plays no role in any score.

### 7.2 Parameterisation

| Field | Values | Provenance |
|---|---|---|
| Seed records | 17 real companies, real-sounding engagement narratives | Hand-authored demo content; plausible outcomes (e.g. ExxonMobil "Positive" via Climate Action 100+ commitment; Coal India "No Change" after a CEO meeting) |
| `escalationLevel` | 1–5, labelled `Monitoring→Watching→Engaging→Escalating→Divest-Ready` | Real 5-rung engagement-escalation ladder concept, applied as a static field per record (not computed from engagement history) |
| `esgScore` | 18–72 (hand-typed per record) | Plausible, not sourced from a live ESG data feed |

### 7.3 Calculation walkthrough

1. **Filtering/sorting** — `search`, `filterOutcome`, `filterEscHigh` (escalation ≥4), and a
   sortable table (`sortCol`/`sortDir`) over `engagements`.
2. **Summary KPIs** — `avgEsc = mean(escalationLevel)` (guarded `engagements.length>0 ? … : 0`),
   `topSector`/`topTopic` (mode of `sector`/`topic` via `Object.entries(count).sort()[0]`).
3. **Add/Edit form** — `BLANK_FORM` → user-entered engagement, appended/updated in `engagements`
   state and persisted to `localStorage` on every change.
4. **Export** — `downloadCSV`/`downloadJSON` serialise the full `engagements` array.
5. **Company autocomplete** — `companySearch` queries `GLOBAL_COMPANY_MASTER` via `globalSearch()`
   for ticker/name suggestions when adding a new engagement — a genuine, useful integration with the
   platform's real company master data (not synthetic).

### 7.4 Worked example

Over the 17 seed records: `escalationLevel` values are `[3,5,2,1,4,2,1,2,3,3,5,2,3,2,1,1,3]` →
`avgEsc = 43/17 ≈ 2.53` → **"Watching–Engaging" band** on the 5-level scale. Outcome distribution:
Positive ×7, Partial ×4, No Change ×2, Escalated ×3, Pending ×1 → a 41% "Positive" rate among the
seed dataset, though — per the mismatch note — this is a simple outcome tally, not the guide's
milestone-based EER.

### 7.5 The real (disconnected) backend engine

See the deep dive for `stewardship-report-generator` (same backend file,
`backend/services/stewardship_engine.py`) for the genuine `_engagement_score` formula (baseline +
intensity bonus + objectives/milestone bonuses + outcome adjustment, clamped [0,100]) and
`_escalation_signal` logic (GFANZ-E-2-referenced escalation-ladder walk) that this tracker's UI does
not call — wiring the "Add Engagement" form to `POST /api/v1/stewardship/engagement` would let the
real engine compute effectiveness/escalation instead of leaving those fields as static user input.

### 7.6 Data provenance & limitations

- Seed data is hand-authored demo content with plausible real-company narratives; once a user starts
  editing, the dataset becomes genuinely user-owned (unlike most `sr()`-fabricated modules in this
  batch), which is a meaningfully different — and more legitimate — data-provenance story.
- No EER or milestone-completion metric exists despite being the guide's headline formula.
- `escalationLevel` is set manually per record, not derived from the real backend's
  `_escalation_signal` (months since contact, engagement type, outcome) — two users could
  legitimately disagree on what escalation level the same engagement warrants.

**Framework alignment:** UK Stewardship Code 2020 Principle 9 (systematic engagement evidencing —
the tracker's record-keeping structure genuinely supports this, though EER itself is unimplemented) ·
PRI Active Ownership 2.0 (real engagement-type taxonomy reflected in `ENG_TYPES`) · GFANZ-E-2
escalation guidance (genuinely implemented in the disconnected backend engine, not surfaced here).
