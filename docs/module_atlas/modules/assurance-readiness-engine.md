# Assurance Readiness Engine
**Module ID:** `assurance-readiness-engine` · **Route:** `/assurance-readiness-engine` · **Tier:** A (backend vertical) · **EP code:** EP-CR3 · **Sprint:** CR

## 1 · Overview
ISAE 3000/3410 readiness assessment with evidence scoring, control testing, and limited vs reasonable assurance gap.

**How an analyst works this module:**
- Readiness Dashboard shows overall score and dimension breakdown
- ISAE 3000 Checklist shows requirement-by-requirement status
- Limited vs Reasonable shows gap and upgrade path

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSURANCE_LEVELS`, `CHECKLIST`, `PROVIDERS`, `READINESS`, `TABS`, `TRAIL`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `READINESS` | 8 | `score` |
| `CHECKLIST` | 13 | `category`, `status`, `strength` |
| `ASSURANCE_LEVELS` | 3 | `evidence`, `controls`, `documentation`, `cost` |
| `PROVIDERS` | 8 | `type`, `experience`, `coverage`, `avgCostK`, `specialization` |
| `TRAIL` | 7 | `completeness`, `gaps`, `lastUpdated` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Readiness Dashboard','ISAE 3000/3410 Checklist','Evidence Strength Scoring','Control Testing','Audit Trail Completeness','Assurance Provider Comparison'];` |
| `overallScore` | `Math.round(READINESS.reduce((s,r)=>s+r.score,0)/READINESS.length);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/assurance-readiness/assess/batch` | `assess_batch` | api/v1/routes/assurance_readiness.py |
| GET | `/api/v1/assurance-readiness/ref/standards` | `ref_standards` | api/v1/routes/assurance_readiness.py |

### 2.3 Engine `assurance_readiness_engine` (services/assurance_readiness_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `AssuranceReadinessEngine.assess` | entity, assessment_date |  |
| `AssuranceReadinessEngine._build_score_map` | entity | Build a map of criterion_id → (score, status, evidence, quality, gaps). Priority: explicit CriterionInput entries > auto-derived from module flags. |
| `AssuranceReadinessEngine._build_domain_results` | crs |  |
| `AssuranceReadinessEngine._assess_standards_coverage` | crs, target_standard |  |
| `AssuranceReadinessEngine._derive_tier` | readiness_pct, blocking_count, level |  |
| `AssuranceReadinessEngine._derive_gaps_actions` | crs, blocking_gaps, entity |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ASSURANCE_LEVELS`, `CHECKLIST`, `PROVIDERS`, `READINESS`, `TABS`, `TRAIL`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Readiness Score | — | Self-assessment | Across 4 dimensions |
| Gap (Limited→Reasonable) | — | Model | Additional effort for reasonable vs limited assurance |

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/assurance-readiness/ref/criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_criteria', 'blocking_criteria', 'domains', 'reference'], 'n_keys': 4}`

**GET /api/v1/assurance-readiness/ref/csrd-timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['assurance_requirement', 'long_term_trajectory', 'waves', 'assurance_provider_eligibility', 'reference'], 'n_keys': 5}`

**GET /api/v1/assurance-readiness/ref/standards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'standards'], 'n_keys': 2}`

**POST /api/v1/assurance-readiness/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/assurance-readiness/assess/batch** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Assurance readiness scoring
**Headline formula:** `Readiness = Evidence(25) + Controls(25) + Lineage(25) + Documentation(25)`

ISAE 3000: assurance on sustainability information. ISAE 3410: assurance on GHG statements. Limited assurance = negative form ("nothing has come to our attention"). Reasonable assurance = positive form ("in our opinion, fairly presented").

**Standards:** ['ISAE 3000', 'ISAE 3410']
**Reference documents:** ISAE 3000 (Revised); ISAE 3410 GHG Assurance

**Engine `assurance_readiness_engine` — extracted transformation lines:**
```python
readiness_pct = total_weighted / _TOTAL_WEIGHT * 100
score_pct = earned_w / max(total_w, 0.001) * 100
score_pct = (met + partial * 0.5) / max(len(relevant), 1) * 100
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry gives the formula
> `Readiness = Evidence(25) + Controls(25) + Lineage(25) + Documentation(25)` — four dimensions of
> 25 points. Neither layer of the code implements that. The **frontend page** computes an
> unweighted mean of **7 hard-coded dimension scores**; the **backend engine**
> (`backend/services/assurance_readiness_engine.py`, "E10") computes a *weighted* score over
> **26 criteria across 8 domains** with per-criterion weights of 0.8–2.0. Also notable: the page
> makes **no API calls** — the backend engine (which is real and substantive) is exposed at
> `/api/v1/assurance-readiness/*` but this page renders only its own static seed arrays.

### 7.1 What the module computes

**Frontend (EP-CR3):** a static readiness dashboard. The only computed value is

```js
overallScore = Math.round(READINESS.reduce((s,r)=>s+r.score,0)/READINESS.length)
```

over 7 fixed dimensions: Evidence Availability 72, Internal Controls 65, Data Lineage 58,
Methodology Documentation 78, Process Maturity 68, Third-Party Verification 52, IT Systems 62 →
**overallScore = round(455/7) = 65**. The KPI card labels it "Ready for limited" when ≥ 70, else
"Needs work" — so the demo entity shows **65/100, Needs work**.

**Backend (`AssuranceReadinessEngine.assess`):** the real methodology. For an entity it scores 26
readiness criteria (each 0 / 0.5 / 1.0), applies per-criterion weights, and returns:

```python
readiness_pct = Σ(score_c × weight_c) / Σ(weight_c) × 100     # _TOTAL_WEIGHT = Σ weights
```

plus domain roll-ups, blocking-gap list, per-standard coverage, a readiness tier, and a remediation
plan with an estimated week count.

### 7.2 Parameterisation — criteria, weights, tiers

Backend criteria registry (26 criteria, 8 domains; weights and blocking flags quoted from code):

| Domain | Criteria (weight, B = blocking) |
|---|---|
| D1 Data governance & lineage | D1-1 lineage (1.5 B) · D1-2 audit log (1.2 B) · D1-3 PCAF DQS (1.0) · D1-4 3rd-party data (0.8) |
| D2 GHG & carbon | D2-1 Scope 1/2 + methodology (2.0 B) · D2-2 Scope 3 (1.5) · D2-3 boundary (1.2 B) · D2-4 prior period (1.0) |
| D3 EU Taxonomy | D3-1 eligibility/alignment (1.5 B) · D3-2 TSC/DNSH evidence (1.2 B) · D3-3 CapEx/OpEx/Turnover KPIs (1.0) |
| D4 ESRS datapoints | D4-1 ESRS 2 general (2.0 B) · D4-2 material DPs (1.5 B) · D4-3 double materiality (1.5 B) · D4-4 disclosure index (0.8) |
| D5 SFDR / PAI | D5-1 14 mandatory PAIs (1.2) · D5-2 Annex templates (0.8) |
| D6 Internal controls | D6-1 ICSR documented (1.5 B) · D6-2 error/restatement (1.0) · D6-3 mgmt sign-off (1.0 B) |
| D7 Materiality & scope | D7-1 boundary = consolidation (1.2 B) · D7-2 value-chain scope (1.0) |
| D8 Completeness | D8-1 statement complete (1.5 B) · D8-2 transition plan (1.0) · D8-3 provider engaged (0.8) · D8-4 comparatives (0.8) |

Criterion scores: `met = 1.0`, `partial = 0.5`, `not_met = 0`. Scores can be auto-derived from 23
platform boolean flags (`has_data_lineage → D1-1`, `has_scope1_scope2_data → D2-1`, …) or
overridden by explicit `CriterionInput` entries. Note a code quirk: the `_FLAG_CRITERION_MAP` dict
assigns `has_material_esrs_dps` and `has_prior_period_comparison` twice (D4-2/D8-1 and D2-4/D8-4);
because Python dict keys are unique, only the **later** mapping survives (D8-1, D8-4), leaving
D4-2 and D2-4 fed solely by explicit inputs.

Tier rubric (`_derive_tier`):

| Condition | Tier |
|---|---|
| blocking gaps > 5 | not_ready |
| blocking gaps > 2 | requires_remediation |
| pct ≥ 85 (limited) / 92 (reasonable) and 0 blocking | ready |
| pct ≥ 65 (limited) / 75 (reasonable) | nearly_ready |
| pct ≥ 45 | requires_remediation |
| else | not_ready |

Remediation estimate: 4 weeks per blocking gap + 2 per top-5 non-blocking gap + 1 per top-3
partial, capped at 52 (24 if CSRD Wave 1). All week-costs are engine-authored rough estimates
(inline comment: "4 weeks per blocking gap (rough estimate)").

### 7.3 Calculation walkthrough

1. `_build_score_map` — flags → auto scores; explicit `CriterionInput`s override; unaddressed
   criteria default to 0/"not_met".
2. Per-criterion `weighted_score = score × weight`; overall pct = Σ weighted / Σ weights × 100.
3. `_build_domain_results` — per-domain earned/total weight → domain %, met/partial/not-met counts.
4. `_assess_standards_coverage` — for each of 6 registered standards (ISAE 3000, ISAE 3410,
   ISSA 5000, CSRD Art 26a, AA1000 AS v3, GRI), coverage % = `(met + 0.5·partial) / relevant` over
   the criteria tagged to that standard (unweighted).
5. `_derive_tier` + `_derive_gaps_actions` → tier, top-10 gaps, top-6 priority actions, weeks.

### 7.4 Worked example — entity with all D1 + D2 flags true, nothing else

Flags set: `has_data_lineage, has_audit_log, has_pcaf_dqs, has_third_party_data_documented,
has_scope1_scope2_data, has_scope3_data, has_ghg_methodology, has_prior_period_comparison`.
Effective met criteria (after the duplicate-key quirk): D1-1…D1-4, D2-1, D2-2, D2-3, D8-4
(D2-4 stays not_met — its flag was shadowed by D8-4).

| Quantity | Computation | Result |
|---|---|---|
| Earned weight | 1.5+1.2+1.0+0.8 + 2.0+1.5+1.2 + 0.8 | 10.0 |
| Total weight | Σ all 26 weights | 31.5 |
| Readiness % | 10.0 / 31.5 × 100 | **31.7%** |
| Blocking gaps | D3-1, D3-2, D4-1, D4-2, D4-3, D6-1, D6-3, D7-1, D8-1 (9 not-met blockers) | 9 > 5 |
| Tier | blocking_count > 5 | **not_ready** |
| Remediation | 9×4 + 5×2 (top-5 non-blocking) | 46 weeks |

ISAE 3410 coverage in the same run: relevant criteria = {D1-3, D2-1…D2-4, D6-2, D8-4}; met =
5 of 7 → **71.4%**.

### 7.5 Frontend companion content (all static seed data)

- **ISAE 3000/3410 checklist** — 12 items with status (Complete/In Progress/Draft) and a 0–100
  "strength" bar (colour bands: ≥75 green, ≥50 amber, else red).
- **Limited vs Reasonable** — bar chart of demo effort levels (evidence 60→90, controls 50→85,
  documentation 65→92, cost $85k→$250k) — illustrating the guide's "15–25 point gap" claim only
  qualitatively.
- **Provider comparison** — 7 named providers (Deloitte/PwC/EY/KPMG Big-4 at $245–280k vs Bureau
  Veritas/SGS/DNV specialists at $135–155k) with experience/coverage/specialisation scores —
  synthetic editorial values, not survey data.
- **Audit-trail completeness** — 6 data areas; Scope 3 worst (45%, 8 gaps); page KPI sums gaps (24).

### 7.6 Data provenance & limitations

- Every frontend number is a **hard-coded seed constant** (no PRNG here, but equally synthetic);
  provider costs and readiness scores are illustrative, not market data.
- The page never calls the backend, so its 65/100 score and the engine's weighted score can
  disagree arbitrarily; the API (`POST /api/v1/assurance-readiness/assess`, `/assess/batch`,
  `GET …/ref/criteria|standards|csrd-timeline`) is consumed elsewhere/by tests.
- Backend flag auto-derivation is binary (met/not-met) — evidence *quality* ("none/weak/adequate/
  strong") is carried through but never affects the score.
- Remediation weeks are additive heuristics, not effort models.

### 7.7 Framework alignment

- **ISAE 3000 (Revised)** — IAASB's umbrella standard for assurance on non-financial information;
  the engine tags 10 criteria to it and distinguishes limited (negative-form conclusion) vs
  reasonable (positive-form) via different tier thresholds (85 vs 92).
- **ISAE 3410** — GHG-statement assurance; implemented via D1-3/D2-x criteria (boundary, emission
  factors, prior-period comparison) mirroring ISAE 3410's specific evidence requirements.
- **ISSA 5000** — IAASB's 2024-approved sustainability assurance standard superseding ISAE 3000
  for sustainability engagements (engine notes "~2026 effective"); tagged to 15 criteria.
- **CSRD Art 26a** — mandatory limited assurance on ESRS statements; the engine encodes the 4-wave
  phase-in (FY2025 → FY2028) and escalates urgency for Wave-1 entities.
- **AA1000 AS v3 / GRI** — registered in the standards catalogue (inclusivity, materiality,
  responsiveness, impact principles) but no criterion is tagged AA1000, so its coverage never
  appears in results.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its own real engine and auto-derive flags from platform state (analytics ladder: rung 1 → 3)

**What.** §7's central finding: the backend engine (E10, `services/assurance_readiness_engine.py`) is real and substantive — 26 weighted criteria across 8 domains, blocking-gap logic, 6-standard coverage, tier rubric, remediation estimates — but **the page never calls it**, rendering 7 hard-coded seed scores instead (65/100 "Needs work" regardless of any entity's actual state). Evolution A connects the layers and makes the flag inputs self-populating.

**How.** (1) Frontend calls `POST /api/v1/assurance-readiness/assess` (and `/ref/criteria`, `/ref/csrd-timeline` — all already live per the lineage traces; note both POST routes failed in the harness sweep, so first triage whether that is the platform-wide REQUIRE_AUTH POST blocker or a payload bug). (2) Fix the documented `_FLAG_CRITERION_MAP` duplicate-key quirk: `has_material_esrs_dps` and `has_prior_period_comparison` each appear twice, so D4-2 and D2-4 are silently unreachable via flags — a real scoring bug. (3) Auto-derive the 23 boolean flags from platform state instead of caller assertion: `has_data_lineage` from the lineage harness's trace coverage, `has_audit_log` from the audit_* tables, `has_pcaf_dqs` from the validation-summary engine's DQS usage — turning self-assessment into measured assessment (rung 3: scored against observed evidence). (4) Let evidence quality ("none/weak/adequate/strong", currently carried but ignored) modulate criterion scores.

**Prerequisites.** The POST-failure triage; a mapping audit of flag→platform-signal derivations (some flags have no measurable source and must stay explicit inputs — say so per flag). **Acceptance:** the dashboard score changes when an entity's underlying flags change; the §7.4 worked example (31.7%, not_ready, 46 weeks) reproduces via the API; D4-2 becomes reachable from its flag.

### 9.2 Evolution B — Readiness-gap remediation copilot (LLM tier 2)

**What.** The engine already produces the raw material an advisory copilot needs: top-10 gaps, top-6 priority actions, per-standard coverage, and week estimates. Evolution B turns "are we ready for CSRD Wave 1 limited assurance?" into a tool-called workflow: run `/assess`, read the tier and blocking gaps, cross-reference `/ref/csrd-timeline` for the entity's wave deadline, and draft a remediation plan document — every score, gap, and week figure from engine output, with the copilot adding only sequencing narrative and standard citations from the grounding corpus.

**How.** Tool schemas from the existing OpenAPI surface (`/assess`, `/assess/batch`, three ref routes); `/assess` is computational, not mutating, so it can run without confirmation gating. Grounding: this Atlas record — §7.2's full criteria/weight registry lets the copilot explain *why* D2-1 (Scope 1/2 + methodology, weight 2.0, blocking) matters more than D1-4 (0.8, non-blocking), and §7.7 supplies the ISAE 3000 vs ISSA 5000 transition context ("~2026 effective") for standard-choice questions. The copilot must disclose that remediation weeks are engine-authored additive heuristics (the code's own "rough estimate" comment), not effort models.

**Prerequisites.** Evolution A's POST triage (the tool is useless if `/assess` 500s); the frontend wiring is not required for the copilot but the flag auto-derivation makes its answers dramatically more grounded. **Acceptance:** every percentage, gap, and week count in a drafted plan traces to an `/assess` response; asked about AA1000 coverage, the copilot reports the documented registry gap (no criterion is tagged AA1000) rather than inventing a score.