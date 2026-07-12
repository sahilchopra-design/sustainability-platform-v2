# Stewardship Report Generator
**Module ID:** `stewardship-report-generator` · **Route:** `/stewardship-report-generator` · **Tier:** A (backend vertical) · **EP code:** EP-CP3 · **Sprint:** CP

## 1 · Overview
UK Stewardship Code 2020 (12 Principles), ICGN Global Stewardship Principles, PRI signatory reporting. Case study generator and export.

**How an analyst works this module:**
- Report Builder selects framework and populates from data
- Case Study Generator creates engagement narratives
- Export produces PDF/Word for publication

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CASE_STUDIES`, `ICGN_DATA`, `PRI_SCORES`, `REPORTS`, `TABS`, `UK_PRINCIPLES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `UK_PRINCIPLES` | 13 | `compliance`, `evidence` |
| `ICGN_DATA` | 8 | `score` |
| `PRI_SCORES` | 7 | `score`, `maxScore` |
| `CASE_STUDIES` | 5 | `title`, `company`, `theme`, `status`, `engagementType`, `outcome` |
| `REPORTS` | 5 | `template`, `status`, `sections`, `completePct` |

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
**Frontend seed datasets:** `CASE_STUDIES`, `ICGN_DATA`, `PRI_SCORES`, `REPORTS`, `TABS`, `UK_PRINCIPLES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| UK Code Principles | — | FRC | UK Stewardship Code 2020 |
| ICGN Principles | — | ICGN | Global Stewardship Principles |

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
**Methodology:** Multi-framework stewardship reporting
**Headline formula:** `Compliance = Principles_met / Total_principles per framework`

Templates auto-populated from engagement data. Case study generator selects an engagement and produces a structured narrative with data points.

**Standards:** ['UK Stewardship Code', 'ICGN', 'PRI']
**Reference documents:** UK Stewardship Code 2020; ICGN Global Stewardship Principles; PRI Annual Assessment

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
| `stewardship-tracker` | engine:stewardship_engine, table:ownership |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch — static mock content, not even PRNG-generated.** The guide describes
> `Compliance = Principles_met / Total_principles` computed per framework, templates "auto-populated
> from engagement data," and a case-study generator that "selects an engagement and produces a
> structured narrative." **None of this is computed.** Every number in this file — UK Stewardship
> Code principle compliance %, ICGN principle scores, PRI module scores, case-study outcomes, report
> completion % — is a **literal hardcoded constant**; there is no `sr()` seeding, no formula, and no
> API call anywhere in the 218-line file. A real backend engine (`backend/services/
> stewardship_engine.py`, 742 lines) exists with genuine engagement-scoring and escalation logic, but
> this page never calls it.

### 7.1 What the module computes

Nothing is computed — four static reference tables are rendered directly:

```
UK_PRINCIPLES   — 12 principles (P1–P12), each a hardcoded {compliance, evidence} pair, e.g.
                  P1 Purpose & Governance: compliance=92, evidence=88
                  P8 Monitoring Service Providers: compliance=68, evidence=60  (lowest of the 12)
ICGN_DATA       — 7 principles, hardcoded scores 72–90
PRI_SCORES      — 6 modules, hardcoded score/maxScore out of 5 (e.g. Fixed Income 3/5)
CASE_STUDIES    — 4 hardcoded named engagement narratives (Shell, Barclays, Glencore, Toyota)
REPORTS         — 4 hardcoded report-pipeline rows with a literal completePct
```

The only "calculation" in the file is `Math.round(REPORTS.reduce((s,r)=>s+r.completePct,0)/
REPORTS.length)` — an average of 4 hardcoded percentages (72, 58, 100, 45 → **69%** "Avg Completion"
KPI).

### 7.2 Parameterisation

| Table | Values | Provenance |
|---|---|---|
| UK Stewardship Code 12 principles | Compliance 68–92%, evidence 60–88% | Real principle titles (FRC 2020 Code); scores are illustrative constants with no computation basis |
| ICGN 7 principles | Scores 72–90 | Real principle categories; illustrative constants |
| PRI 6 modules | 3–4 out of 5 | Real PRI Reporting Framework module names; illustrative constants |
| Case studies | 4 named real companies (Shell, Barclays, Glencore, Toyota) | Plausible, real-world-consistent engagement narratives, presented as fixed examples not generated from actual engagement records |

### 7.3 Calculation walkthrough

1. **Report Builder tab** — 4 KPI cards (`Active Reports`, `Templates`, `Case Studies`, `Avg
   Completion`) computed from `REPORTS.length`/`CASE_STUDIES.length`/the literal-average above, plus
   a pipeline table with a progress bar per report.
2. **UK Stewardship Code / ICGN / PRI tabs** — bar/radar charts of the static tables above, with no
   drill-down computation.
3. **Case Study Generator tab** — displays the 4 fixed `CASE_STUDIES` entries; despite the guide's
   claim of a generator that "selects an engagement and produces a structured narrative," there is no
   selection logic or narrative-generation code — the 4 entries are the entire dataset.
4. **Export Centre tab** — UI affordances (buttons) for export; no export logic is implemented in the
   portion of the file reviewed (no CSV/PDF generation call).

### 7.4 Worked example

`Avg Completion = round((72+58+100+45)/4) = round(68.75) = 69%` — the only genuinely computed number
on the page.

### 7.5 The real (disconnected) backend engine

`backend/services/stewardship_engine.py` implements a real per-company engagement-effectiveness
scorer that this page could call but does not:

```
_engagement_score(e) =  20 (baseline, any engagement)
                       + intensity_bonus×10   (intensity ∈ {low:1, medium:2, high:3, critical:4})
                       + 20 (if objectives_set)
                       + 20 (if milestone_achieved)
                       + 15 / −10 / −20  (outcome: positive / stalled / failed)
                       + 5  (if ≥3 engagement types used)
                       clamped to [0,100]
```

`_rating(score)`: `advanced ≥75`, `progressing ≥50`, `developing ≥25`, else `initial`.
`_escalation_signal` walks a real `ESCALATION_LADDER` (engagement type → escalation level) and
recommends escalation based on months since last contact and outcome, citing **GFANZ-E-2** guidance
("requires escalation to assertive stewardship after…"). This is a substantive, defensible
rules-based scoring engine — entirely unused by the report generator UI.

### 7.6 Data provenance & limitations

- Every score in this module is a fixed illustrative constant, not derived from any actual fund's
  engagement records, voting history, or PRI submission.
- The case-study narratives, while plausible and referencing real companies (Shell, Barclays,
  Glencore, Toyota), are fixed demo content, not generated from an underlying engagement database.
- The real backend `stewardship_engine.py` scoring/escalation logic is validated, cites a named
  standard (GFANZ-E-2), and should be the actual data source for this page — the remediation path is
  wiring, not building a new model.

**Framework alignment:** UK Stewardship Code 2020 (real 12 principles reproduced, scores fictional) ·
ICGN Global Stewardship Principles (real 7-category structure, scores fictional) · PRI Reporting
Framework (real 6-module structure, scores fictional) · GFANZ-E-2 escalation guidance (genuinely
cited and implemented in the disconnected backend engine).

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to the real engine and fix the failing routes (analytics ladder: rung 1 → 3)

**What.** The §7 flag is emphatic: this page computes nothing — every number (UK Stewardship Code principle compliance %, ICGN scores, PRI module scores, case-study outcomes, report completion %) is a **literal hardcoded constant**, no `sr()`, no formula, no API call in the 218-line file; the only "calculation" is averaging 4 hardcoded `completePct` values. Meanwhile a real 742-line backend (`stewardship_engine`, blast radius 2) implements genuine engagement-scoring and escalation logic citing GFANZ-E-2, and the module exposes working GET reference endpoints — but the lineage sweep records `POST /engagement`, `/escalation`, and `/portfolio` as **failed**. So the good engine is broken-and-unused while the page shows fixed demo content. Evolution A is remediation, not a new build.

**How.** (1) Triage the three failing POST routes (deployment-prep methodology). (2) Replace the hardcoded `UK_PRINCIPLES`/`ICGN_DATA`/`PRI_SCORES` tables with calls to `POST /portfolio` and `/engagement` so compliance percentages are computed from an asset manager's actual engagement records, proxy votes, and initiative memberships (the engine's `assess_portfolio` signature already takes exactly these). (3) The `Compliance = Principles_met / Total_principles` formula the guide states becomes real, per framework. (4) Drive the escalation ladder from `POST /escalation` (GFANZ-E-2) and the reference `/ref/escalation-ladder` endpoint.

**Prerequisites.** The three route failures are the gate; the engine and reference endpoints already exist — the fix is wiring plus repair. **Acceptance:** principle compliance percentages come from `/portfolio`, not constants; all three POST routes pass the sweep; changing engagement inputs changes the scores.

### 9.2 Evolution B — Stewardship-report and case-study drafter (LLM tier 2)

**What.** The module's entire purpose is report generation — "Case Study Generator creates engagement narratives," "Export produces PDF/Word." That is a tool-calling drafting task: the copilot calls `POST /engagement` and `/portfolio` for the real assessment figures, then drafts the UK Stewardship Code / ICGN / PRI report sections and per-engagement case-study narratives grounded in those computed scores — never inventing compliance percentages (the exact failure mode of the current hardcoded page).

**How.** Tier-2 pattern once the routes work: engagement/portfolio assessment become tools; the copilot narrates the computed principle-by-principle compliance and drafts the framework report, citing `GET /ref/frameworks` for the principle text. Case-study generation reads real engagement records (escalation stage, outcome) and structures the narrative. Drafts route to the report-studio/export layer; the no-fabrication validator checks every compliance figure against tool output.

**Prerequisites (hard).** Evolution A — the compute endpoints fail and the page is static demo content, so drafting from it would produce authoritative-looking reports built on hardcoded numbers, exactly what a stewardship disclosure must not be. **Acceptance:** every compliance percentage in a drafted report traces to a `/portfolio` or `/engagement` call; case studies reference real engagement records; a framework principle with no supporting engagement data is flagged as a gap, not fabricated as compliant.