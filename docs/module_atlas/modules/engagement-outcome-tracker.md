# Engagement Outcome Tracker
**Module ID:** `engagement-outcome-tracker` · **Route:** `/engagement-outcome-tracker` · **Tier:** A (backend vertical) · **EP code:** EP-CP1 · **Sprint:** CP

## 1 · Overview
30 engagements with CA100+ progress tracking, milestone monitoring, and escalation history.

**How an analyst works this module:**
- Engagement Dashboard shows 30 engagements with status
- CA100+ Progress tracks 10 Net Zero benchmark indicators
- Escalation History logs escalation actions taken

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CA100_INDICATORS`, `COLLAB`, `ENGAGEMENTS`, `ESCALATION_DIST`, `ESC_COLORS`, `MILESTONES_DIST`, `MILESTONE_COLORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ENGAGEMENTS` | 16 | `company`, `sector`, `status`, `milestone`, `escalation`, `ca100`, `nzScore`, `indicators` |
| `MILESTONES_DIST` | 5 | `value` |
| `ESCALATION_DIST` | 4 | `value` |
| `CA100_INDICATORS` | 11 | `met`, `partial`, `notMet` |
| `COLLAB` | 6 | `partners`, `assetsAum`, `yearsActive` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Engagement Dashboard','CA100+ Progress','Milestone Tracking','Escalation History','Collaborative Engagement','Impact Attribution'];` |
| `sectors` | `[...new Set(ENGAGEMENTS.map(e => e.sector))];` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/engagement/entities` | `list_entities` | api/v1/routes/engagement.py |
| POST | `/api/v1/engagement/entities` | `create_entity` | api/v1/routes/engagement.py |
| GET | `/api/v1/engagement/entities/{entity_id}` | `get_entity` | api/v1/routes/engagement.py |
| PATCH | `/api/v1/engagement/entities/{entity_id}/progress` | `update_progress` | api/v1/routes/engagement.py |
| POST | `/api/v1/engagement/log` | `add_log_entry` | api/v1/routes/engagement.py |
| POST | `/api/v1/engagement/commitments` | `add_commitment` | api/v1/routes/engagement.py |
| POST | `/api/v1/engagement/escalations` | `add_escalation` | api/v1/routes/engagement.py |
| GET | `/api/v1/engagement/summary` | `engagement_summary` | api/v1/routes/engagement.py |
| DELETE | `/api/v1/engagement/entities/{entity_id}` | `delete_entity` | api/v1/routes/engagement.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`, `real-db`

**Database tables:** `__future__` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `engagement`, `engagement_commitments`, `engagement_entities`, `engagement_escalations`, `engagement_log`, `fastapi` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CA100_INDICATORS`, `COLLAB`, `ENGAGEMENTS`, `ESCALATION_DIST`, `ESC_COLORS`, `MILESTONES_DIST`, `MILESTONE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Engagements | — | Stewardship | Active company engagements |
| CA100+ Focus | — | CA100+ | Focus companies in portfolio |

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/engagement/entities** — status `passed`, provenance ['db-empty'], source tables: `engagement_commitments`, `engagement_entities`, `engagement_escalations`, `engagement_log`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/engagement/entities/{entity_id}** — status `failed`, provenance ['db-empty'], source tables: `engagement_entities`
Output: `None`

**GET /api/v1/engagement/summary** — status `passed`, provenance ['real-db'], source tables: `engagement_entities`, `engagement_log`
Output: `{'type': 'object', 'keys': ['totals', 'by_theme', 'by_priority_tier', 'upcoming_actions'], 'n_keys': 4}`

**POST /api/v1/engagement/commitments** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/engagement/entities** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**DELETE /api/v1/engagement/entities/{entity_id}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**PATCH /api/v1/engagement/entities/{entity_id}/progress** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/engagement/escalations** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Engagement effectiveness scoring
**Headline formula:** `Effectiveness = MilestonesAchieved / MilestonesTargeted × 100`

Engagement lifecycle: letter → meeting → commitment → action → verification. Escalation: dialogue → enhanced → vote against → public statement → divestment.

**Standards:** ['CA100+', 'IIGCC', 'PRI']
**Reference documents:** CA100+ Net Zero Company Benchmark; IIGCC Net Zero Stewardship Toolkit

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **52** other module(s).

| Connected module | Shared via |
|---|---|
| `carbon-market-intelligence` | table:sqlalchemy |
| `reference-data-explorer` | table:sqlalchemy |
| `carbon-integrity-mrv-analytics` | table:sqlalchemy |
| `supply-chain-esg-hub` | table:sqlalchemy |
| `geothermal-market-intelligence` | table:sqlalchemy |
| `carbon-institutions-taxonomy` | table:sqlalchemy |
| `supply-chain-resilience` | table:sqlalchemy |
| `carbon-footprint-intelligence` | table:sqlalchemy |
| `carbon-reduction-projects` | table:sqlalchemy |
| `climate-underwriting-workbench` | table:sqlalchemy |

## 7 · Methodology Deep Dive

The guide (engagement-effectiveness scoring, CA100+ progress, escalation ladder) is broadly matched.
The module is a **stewardship/engagement tracker** over a hand-authored table of real investee
companies, structured around the genuine **Climate Action 100+ Net Zero Company Benchmark** indicator
set and the standard escalation ladder. Two small gaps: the guide says "30 engagements across 20
companies" but the code table holds **15** engagements; and the guide's effectiveness formula
(`MilestonesAchieved / MilestonesTargeted × 100`) is not computed as a headline — the module tracks
milestone *status* categorically rather than as a ratio.

### 7.1 What the module computes

The data layer is 15 engagements with **real company names** (Shell, TotalEnergies, BP, Exxon, Chevron,
Glencore, BHP, Rio Tinto, ArcelorMittal, HeidelbergCement, Volkswagen, Samsung, POSCO, Holcim, Duke
Energy), each carrying: `status`, `milestone` (5-stage), `escalation` (4-level), `ca100` (focus flag),
`nzScore` (0–100 net-zero benchmark score), `indicators` (count met).

Derived values are simple groupings/filters — there is no scoring engine:
```js
sectors  = unique(ENGAGEMENTS.sector)
filtered = sectorFilter=='All' ? ENGAGEMENTS : filter by sector
```
Distributions (`MILESTONES_DIST`, `ESCALATION_DIST`, `CA100_INDICATORS`, `COLLAB`) are **static
pre-tabulated** counts, not computed from the engagement rows.

### 7.2 Parameterisation / scoring rubric

**Engagement lifecycle (milestone ladder):**

| Stage | Colour | Meaning |
|---|---|---|
| Letter Sent | grey | Initial outreach |
| Meeting Held | amber | Dialogue opened |
| Commitment Made | blue | Company pledge |
| Action Taken | green | Implementation |
| Verified | navy | Independently confirmed |

**Escalation ladder:** Dialogue → Enhanced → Vote Against → Public Statement → (Divestment). The
distribution: Dialogue 8, Enhanced 4, Vote Against 2, Public Statement 1.

**CA100+ Net Zero Benchmark indicators (10, real):** Net Zero by 2050, Short-term Targets, Capex
Alignment, Scope 3 Disclosure, Lobbying Alignment, Just Transition Plan, TCFD Reporting, Board
Oversight, Executive Remuneration, Methane Targets — each with met/partial/notMet counts. These are the
authentic CA100+ benchmark disclosure indicators.

`nzScore` (28–72) is a hand-set net-zero benchmark score per company (Exxon 28 lowest, Holcim 72
highest) — consistent with real CA100+ assessment gradients, but editorial.

### 7.3 Calculation walkthrough

Load 15 engagements → filter by sector → dashboard shows engagement rows with milestone/escalation
badges and nzScore → CA100+ tab renders the 10-indicator met/partial/notMet stacked bars → milestone
and escalation tabs render the pre-tabulated distributions → collaborative-engagement tab lists 5 real
investor initiatives (CA100+, IIGCC Net Zero, ShareAction, FAIRR, CDP Non-Disclosure) with partner
counts and AUM → impact-attribution tab links engagement outcomes to portfolio effect. The API route
(`/api/v1/engagement/*`) exists for persisting entities/escalations, but the displayed data is static.

### 7.4 Worked example

**CA100+ indicator coverage.** For "TCFD Reporting": met 9, partial 4, notMet 2 (across 15 companies —
note counts exceed 15 as they aggregate the full 20-company universe the guide references). Coverage
rate = met/(met+partial+notMet) = 9/15 = 60% fully compliant. By contrast "Just Transition Plan": met
2, partial 5, notMet 8 → only 2/15 = 13% met — the module's signal that just-transition planning is
the weakest CA100+ dimension across the engaged universe, while TCFD reporting is the most mature.

An engagement's escalation status also encodes effectiveness: Exxon (nzScore 28) sits at "Vote Against"
and Chevron (32) at "Public Statement" — the two lowest scorers have escalated furthest up the ladder,
the intended dialogue-to-escalation logic.

### 7.5 Companion analytics

- **Collaborative engagement:** 5 real initiatives with partner count, AUM ($T), years active — the
  collective-stewardship layer (CA100+ 12 partners / $8.5T; CDP Non-Disclosure 20 partners / $18.5T).
- **Milestone & escalation distributions:** the funnel from Letter Sent (2) to Verified (3), and the
  Dialogue-heavy escalation profile.
- **Impact attribution:** connects engagement stage to portfolio net-zero contribution.

### 7.6 Data provenance & limitations

- **Company names and CA100+ indicators are real; the scores and counts are editorial** (hand-set,
  not a live CA100+ data feed). No PRNG.
- The guide's effectiveness *ratio* is not computed; the module tracks milestone/escalation status
  categorically. Distributions are pre-tabulated, not derived from the 15 rows (and reference the
  broader 20-company universe).
- 15 engagements in code vs the guide's stated 30.

**Framework alignment:** **Climate Action 100+ Net Zero Company Benchmark** — the 10-indicator
disclosure framework is genuine; CA100+ assesses focus companies against these indicators at
met/partial/not-met granularity, exactly the structure rendered. **IIGCC Net Zero Stewardship Toolkit**
— the milestone (letter→verify) and escalation (dialogue→divestment) ladders follow the IIGCC
stewardship escalation model. **PRI** — the collaborative-engagement and outcome-tracking discipline
reflects PRI's active-ownership reporting.

## 9 · Future Evolution

### 9.1 Evolution A — Use the CRUD backend the module already has (analytics ladder: rung 1 → 2)

**What.** This module has the platform's clearest wiring gap: a complete, real engagement backend exists — 9 endpoints with full CRUD over four genuine tables (`engagement_entities`, `engagement_log`, `engagement_commitments`, `engagement_escalations`), and `GET /summary` traces `real-db` — but the tables are **empty** (`db-empty`, entities returns `len: 0`, the by-id GET `failed` on the empty set) and the page renders 16 seeded `ENGAGEMENTS` rows instead of calling any of it. Evolution A is not new analytics; it is connecting a working page to a working backend and seeding it.

**How.** (1) Rewire the page: dashboard from `GET /entities` + `/summary`, milestone/escalation distributions computed from real rows; the seeded `ENGAGEMENTS`/`MILESTONES_DIST`/`ESCALATION_DIST` arrays deleted. (2) Seed with public reality: the CA100+ Net Zero Company Benchmark assessments are published per focus company — ingest the current cycle so the CA100+ tab shows genuine indicator statuses (met/partial/not-met per the 10 indicators) instead of authored counts. (3) Exercise the write path: the lineage harness `skipped` all five mutating endpoints — the D1 `--allow-writes` branch-DB sweep should cover them, doubling as fixture creation. (4) Rung 2: implement the guide's effectiveness metric (`milestones achieved / targeted`) over real milestone history, with cohort comparison (engaged vs not) as the honest first cut of "impact attribution."

**Prerequisites.** CA100+ benchmark ingester (public CSV/site data); the failed by-id endpoint root-caused (likely just empty-set handling). **Acceptance:** lineage re-sweep shows all 9 endpoints `passed` with rows; creating an engagement in the UI persists and survives reload; the CA100+ tab matches the published benchmark for a spot-checked company.

### 9.2 Evolution B — Stewardship copilot for logs, escalations, and PRI reporting (LLM tier 2)

**What.** Stewardship teams drown in writing: meeting notes → structured log entries, escalation rationales, PRI/IIGCC reporting narratives. A tool-calling copilot that (a) converts a pasted meeting note into a structured `POST /log` entry (theme, milestone movement, next action) for analyst confirmation, (b) recommends escalation steps by applying the module's documented ladder (dialogue → enhanced → vote against → public statement → divestment) to the entity's actual history from `GET /entities/{id}`, and (c) drafts the annual stewardship-outcomes narrative from `/summary` data with per-claim engagement citations.

**How.** Tools: the module's 9 existing endpoints — the CRUD surface is exactly a tier-2 tool set; mutations (log/commitment/escalation writes) gate behind explicit confirmation per RBAC convention. Grounding corpus = this Atlas record's §5 (lifecycle and escalation ladder) plus the CA100+ benchmark definitions. Escalation recommendations must cite the history rows that trigger the ladder step ("two commitments missed since 2025-Q3 → enhanced engagement per policy") — recommendation logic is transparent rule application, narrated.

**Prerequisites (hard).** Evolution A — with empty tables there is no history to structure or cite, and drafting stewardship outcomes from the seeded rows would fabricate an engagement record, which PRI signatories can be audited on. **Acceptance:** a golden meeting note produces a log entry whose fields the analyst confirms unchanged ≥80% of the time in fixture tests; every escalation recommendation cites real history rows; the annual narrative contains zero claims without an engagement-log citation.