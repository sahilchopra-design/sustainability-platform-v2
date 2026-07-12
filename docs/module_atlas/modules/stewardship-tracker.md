# Stewardship Tracker
**Module ID:** `stewardship-tracker` · **Route:** `/stewardship-tracker` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG engagement and proxy voting activity tracker enabling asset managers and asset owners to record, monitor and report stewardship activities in line with stewardship codes.

> **Business value:** The UK Stewardship Code requires FCA-authorised managers to publish annual reports demonstrating purposeful engagement; this tracker automates evidence collection and narrative generation.

**How an analyst works this module:**
- Log new engagement with objective, timeline and KPIs
- Record meeting notes and milestone outcomes
- Track proxy voting decisions against ESG policy
- Flag escalations for collaborative engagement or divestment
- Produce annual stewardship report compliant with UK Stewardship Code Principle 9

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BLANK_FORM`, `ENG_TYPES`, `ESC_COLORS`, `ESC_LABELS`, `LS_KEY`, `MILESTONES`, `OUTCOMES`, `OUTCOME_STYLES`, `PIE_COLORS`, `SAMPLE_ENGAGEMENTS`, `STATUS_COLORS`, `STATUS_PIPELINE`, `TOPICS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SAMPLE_ENGAGEMENTS` | 17 | `companyName`, `ticker`, `sector`, `topic`, `engagementType`, `date`, `milestone`, `escalationLevel`, `outcome`, `status`, `notes`, `nextAction`, `nextDate`, `esgScore`, `sbtiCommitted` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ESC_LABELS` | `{ 1: 'Monitoring', 2: 'Watching', 3: 'Engaging', 4: 'Escalating', 5: 'Divest-Ready' };` |
| `TOPICS` | `['Climate Target Setting', 'Coal Phase-Out', 'Board Diversity', 'Supply Chain Labor', 'Deforestation', 'Water Stewardship', 'Executive Remuneration', 'GHG Disclosure'];` |
| `ENG_TYPES` | `['Letter', 'Meeting', 'Public Statement', 'Collaborative', 'Vote Against', 'Co-filing'];` |
| `uid` | `() => sr(_sc++).toString(36).slice(2, 10);` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `avgEsc` | `engagements.length > 0 ? +(engagements.reduce((s, e) => s + e.escalationLevel, 0) / engagements.length).toFixed(1) : 0;` |
| `topSector` | `Object.entries(sectorCount).sort((a, b) => b[1] - a[1])[0]?.[0] \|\| 'N/A';` |
| `topTopic` | `Object.entries(topicCount).sort((a, b) => b[1] - a[1])[0]?.[0] \|\| 'N/A';` |
| `label` | `d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });` |
| `rows` | `engagements.map(e => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/stewardship/engagement` | `assess_single_engagement` | api/v1/routes/stewardship.py |
| GET | `/api/v1/stewardship/ref/engagement-types` | `ref_engagement_types` | api/v1/routes/stewardship.py |
| GET | `/api/v1/stewardship/ref/proxy-resolutions` | `ref_proxy_resolutions` | api/v1/routes/stewardship.py |
| GET | `/api/v1/stewardship/ref/initiatives` | `ref_initiatives` | api/v1/routes/stewardship.py |
| GET | `/api/v1/stewardship/ref/frameworks` | `ref_frameworks` | api/v1/routes/stewardship.py |

### 2.3 Engine `stewardship_engine` (services/stewardship_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `StewardshipEngine.assess_portfolio` | entity_name, engagements, proxy_votes, initiative_memberships, assessment_date | Full portfolio stewardship assessment. Args: entity_name: Asset manager / FI name engagements: List of per-company engagement inputs proxy_votes: Optional list of proxy vote records initiative_memberships: Dict of {initiative_id: status} e.g. {"CA100_PLUS": "member", "NZIF": "pending"} assessment_date: ISO date (default today) |
| `StewardshipEngine.assess_engagement` | e | Assess engagement effectiveness for a single investee company. |
| `StewardshipEngine.assess_proxy_votes` | v | Score proxy voting alignment for an AGM. |
| `StewardshipEngine.assess_escalation` | e | Determine current and recommended escalation level for a company. |
| `StewardshipEngine._engagement_score` | e |  |
| `StewardshipEngine._rating` | score |  |
| `StewardshipEngine._escalation_signal` | e |  |
| `StewardshipEngine._gfanz_milestone` | e, score |  |
| `StewardshipEngine._engagement_gaps` | e |  |
| `StewardshipEngine._assess_initiatives` | memberships, engagements |  |
| `StewardshipEngine._aggregate` | run_id, entity_name, assessment_date, company_results, escalation_plans, proxy_results, initiative_results, engagements |  |

**Engine `stewardship_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `CA100_FOCUS_SECTORS` | `{'B06': 'Oil & Gas', 'C19': 'Petroleum Refining', 'C24': 'Iron & Steel', 'C20': 'Basic Chemicals', 'D35': 'Electric Utilities', 'H49': 'Road Transport', 'H51': 'Air Transport', 'B05': 'Coal Mining', 'C17': 'Paper & Pulp', 'C23': 'Cement / Glass'}` |
| `ESCALATION_LADDER` | `[{'level': 1, 'action': 'written_communication', 'trigger_months_stalled': 3}, {'level': 2, 'action': 'meeting_management', 'trigger_months_stalled': 6}, {'level': 3, 'action': 'meeting_board', 'trigger_months_stalled': 9}, {'level': 4, 'action': 'shareholder_resolution', 'trigger_months_stalled': 1` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `ownership` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ENG_TYPES`, `MILESTONES`, `OUTCOMES`, `PIE_COLORS`, `SAMPLE_ENGAGEMENTS`, `STATUS_PIPELINE`, `TOPICS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Engagements | — | Engagement Log | Number of ongoing ESG engagement programmes with investee companies. |
| Voting Alignment Rate | — | Proxy Voting Records | Proportion of votes cast in line with ESG voting policy; deviations require explanation. |
| Escalation Rate | — | Engagement Log | Share of engagements escalated to collaborative or public action after insufficient progress. |
- **Engagement Logs, AGM Voting Records, Company Disclosures** → Milestone tracking + voting policy alignment engine → **Stewardship reports, escalation registers, PRI Active Ownership disclosures**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/stewardship/ref/engagement-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'engagement_types', 'reference'], 'n_keys': 3}`

**GET /api/v1/stewardship/ref/escalation-ladder** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['steps', 'escalation_ladder', 'engagement_type_details', 'reference'], 'n_keys': 4}`

**GET /api/v1/stewardship/ref/frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks', 'reference'], 'n_keys': 2}`

**GET /api/v1/stewardship/ref/initiatives** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'initiatives', 'reference'], 'n_keys': 3}`

**GET /api/v1/stewardship/ref/proxy-resolutions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'resolution_types', 'reference'], 'n_keys': 3}`

**POST /api/v1/stewardship/engagement** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/stewardship/escalation** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/stewardship/portfolio** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Engagement Effectiveness Rate
**Headline formula:** `EER = Milestones Met / Total Milestones × 100`

Proportion of engagement milestones achieved within target timeframe; proxy for stewardship programme effectiveness.

**Standards:** ['UK Stewardship Code 2020', 'PRI Active Ownership 2.0']
**Reference documents:** UK Stewardship Code 2020 (FRC); PRI Active Ownership 2.0 2022; ICGN Global Stewardship Principles

**Engine `stewardship_engine` — extracted transformation lines:**
```python
alignment_score = min(100.0, alignment_score / total_weight)
next_level = current + 1
coverage = (engaged / max(len(company_results), 1)) * 100
proxy_align = sum(p.alignment_score for p in proxy_results) / len(proxy_results)
nzami_pct = (nzami_aligned / max(total_nzami, 1)) * 100
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `stewardship_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `stewardship-report-generator` | engine:stewardship_engine, table:ownership |

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

## 9 · Future Evolution

### 9.1 Evolution A — Persist engagements server-side and compute the EER the guide promises (analytics ladder: rung 1 → 3)

**What.** This is the most legitimate of the three stewardship modules: it is a genuine CRUD engagement tracker with 17 hand-authored real-company records (Exxon, Shell, BP, Apple, Rio Tinto), add/edit/delete forms, and localStorage persistence — once a user edits, the data is genuinely theirs. But §7 flags that the guide's headline `EER = Milestones Met / Total Milestones × 100` **is not computed** (no milestone counter exists), `escalationLevel` is set manually per record rather than derived from the backend's `_escalation_signal` (months since contact, engagement type, outcome), and the whole thing lives in localStorage rather than the server, despite a real `stewardship_engine` (shared, blast radius 2) sitting available — with `POST /engagement`, `/escalation`, `/portfolio` all recorded as **failed** in the sweep.

**How.** (1) Triage the three failing POST routes (shared with `stewardship-report-generator` — fix once, both benefit). (2) Move engagement records from localStorage to a server-side `stewardship_engagements` table so they persist across devices and feed the report generator. (3) Add a milestone sub-structure per engagement and compute the EER the guide specifies. (4) Derive `escalationLevel` from the engine's `_escalation_signal` (months-since-contact, type, outcome) so two users don't disagree on the same engagement's level. (5) Feed `POST /portfolio` for the UK Stewardship Code Principle 9 annual-report evidence the workflow targets.

**Prerequisites.** The three route failures are the gate; a persistence-layer migration for engagements. **Acceptance:** EER computes from milestone completion; escalation level derives from the signal function; engagements persist server-side and are consumable by the report generator.

### 9.2 Evolution B — Engagement-logging and escalation copilot (LLM tier 2)

**What.** A copilot that lowers the CRM friction: "log an engagement with Shell on coal phase-out, meeting held, outcome partial", "what escalation level does this warrant?", "which engagements are stalled and need escalation?" — the LLM structures the free-text log into the engagement schema, submits it via `POST /engagement`, and reads the engine's escalation signal to recommend next steps.

**How.** Tier-2 pattern: the engagement/escalation/portfolio endpoints become tools; the LLM converts natural-language notes into structured records (company, topic, type, outcome) the user confirms before submission, and narrates the engine's escalation recommendation — never inventing an EER or escalation level. Stalled-engagement detection reads the portfolio assessment. Every metric cited traces to a tool response.

**Prerequisites (hard).** Evolution A — the endpoints currently fail and escalation is a manual field, so there is no engine signal to narrate. **Acceptance:** every escalation recommendation cites the engine's signal inputs (months-since-contact, outcome); logged engagements round-trip through `POST /engagement`; the EER quoted matches the computed value.