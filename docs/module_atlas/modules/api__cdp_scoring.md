# Api::Cdp_Scoring
**Module ID:** `api::cdp_scoring` · **Route:** `/api/v1/cdp` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/cdp/assess-climate` | `assess_climate` | api/v1/routes/cdp_scoring.py |
| POST | `/api/v1/cdp/assess-water` | `assess_water` | api/v1/routes/cdp_scoring.py |
| POST | `/api/v1/cdp/compare-peers` | `compare_peers` | api/v1/routes/cdp_scoring.py |
| GET | `/api/v1/cdp/ref/climate-modules` | `ref_climate_modules` | api/v1/routes/cdp_scoring.py |
| GET | `/api/v1/cdp/ref/water-modules` | `ref_water_modules` | api/v1/routes/cdp_scoring.py |
| GET | `/api/v1/cdp/ref/scoring-methodology` | `ref_scoring_methodology` | api/v1/routes/cdp_scoring.py |
| GET | `/api/v1/cdp/ref/score-bands` | `ref_score_bands` | api/v1/routes/cdp_scoring.py |
| GET | `/api/v1/cdp/ref/activity-groups` | `ref_activity_groups` | api/v1/routes/cdp_scoring.py |
| GET | `/api/v1/cdp/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/cdp_scoring.py |
| GET | `/api/v1/cdp/ref/peer-benchmarks` | `ref_peer_benchmarks` | api/v1/routes/cdp_scoring.py |
| GET | `/api/v1/cdp/ref/module-catalog` | `ref_module_catalog` | api/v1/routes/cdp_scoring.py |

### 2.3 Engine `cdp_scoring_engine` (services/cdp_scoring_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CDPScoringEngine.assess_climate` | entity_name, reporting_year, activity_group, responses | Score the CDP Climate Change questionnaire for an entity. Args: entity_name: Legal name of the reporting entity. reporting_year: The CDP reporting cycle year (e.g. 2025). activity_group: CDP Activity Group code (e.g. "AG01"). If None, defaults to "AG08" (Technology). responses: Optional dict keyed by module code (e.g. "C1") with sub-keys per scoring level: {"C1": {"disclosure": 80, "awareness": 65 |
| `CDPScoringEngine.assess_water` | entity_name, reporting_year, responses | Score the CDP Water Security questionnaire for an entity. Args: entity_name: Legal name of the reporting entity. reporting_year: The CDP reporting cycle year. responses: Optional dict keyed by module code (e.g. "W1") with sub-keys per scoring level. Missing modules default to 0. Returns: CDPWaterAssessment with module scores, grade, water risk profile, gaps, and recommendations. |
| `CDPScoringEngine.compare_to_peers` | entity_name, activity_group, entity_score_pct | Compare an entity's CDP score against activity group median benchmarks. Args: entity_name: Legal name of the entity. activity_group: CDP Activity Group code (e.g. "AG01"). entity_score_pct: The entity's overall score percentage. Returns: Dict with rank_label, delta_vs_median, peer benchmark details. |
| `CDPScoringEngine._score_module` | code, title, category, resp | Score a single questionnaire module across all four levels. |
| `CDPScoringEngine._pct_to_grade` | pct | Convert a percentage score to a CDP letter grade and label. |
| `CDPScoringEngine._water_risk_level` | w1_resp, w2_resp | Derive overall water risk level from W1 and W2 module responses. |
| `CDPScoringEngine._identify_climate_gaps` | module_scores, verification_status, sbti_alignment | Identify disclosure and performance gaps in climate assessment. |
| `CDPScoringEngine._identify_water_gaps` | module_scores, water_risk, facility_accounting | Identify disclosure and performance gaps in water assessment. |
| `CDPScoringEngine._generate_climate_recommendations` | grade, scoring_breakdown, gaps, sbti_alignment, verification_status | Generate prioritised improvement recommendations for climate score. |
| `CDPScoringEngine._generate_water_recommendations` | grade, scoring_breakdown, gaps, water_risk | Generate prioritised improvement recommendations for water score. |
| `CDPScoringEngine.get_climate_modules` |  | Return all 15 CDP Climate Change questionnaire modules. |
| `CDPScoringEngine.get_water_modules` |  | Return all 9 CDP Water Security questionnaire modules. |
| `CDPScoringEngine.get_scoring_methodology` |  | Return the CDP four-level scoring methodology. |
| `CDPScoringEngine.get_score_bands` |  | Return all CDP letter-grade score bands (A through D-). |
| `CDPScoringEngine.get_activity_groups` |  | Return all 12 CDP Activity Group classifications. |
| `CDPScoringEngine.get_cross_framework_map` |  | Return CDP-to-TCFD/GRI/ISSB/SASB cross-framework mapping. |
| `CDPScoringEngine.get_peer_benchmarks` |  | Return activity group peer benchmark medians. |
| `CDPScoringEngine.get_module_catalog` |  | Flat combined catalog of all Climate + Water modules for UI dropdowns. |

**Engine `cdp_scoring_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `CDP_CLIMATE_MODULES` | `[{'code': 'C0', 'title': 'Introduction', 'category': 'governance', 'disclosures': 3}, {'code': 'C1', 'title': 'Governance', 'category': 'governance', 'disclosures': 8}, {'code': 'C2', 'title': 'Risks and Opportunities', 'category': 'risks_opportunities', 'disclosures': 6}, {'code': 'C3', 'title': 'B` |
| `CDP_WATER_MODULES` | `[{'code': 'W0', 'title': 'Introduction', 'category': 'governance', 'disclosures': 3}, {'code': 'W1', 'title': 'Current State', 'category': 'context', 'disclosures': 5}, {'code': 'W2', 'title': 'Business Impacts', 'category': 'risks', 'disclosures': 4}, {'code': 'W3', 'title': 'Procedures', 'category` |
| `CDP_SCORING_METHODOLOGY` | `{'disclosure': {'label': 'Disclosure', 'weight': 0.25, 'description': 'Completeness and quality of information provided', 'min_score_for_level': 0}, 'awareness': {'label': 'Awareness', 'weight': 0.25, 'description': 'Evidence of understanding environmental issues', 'min_score_for_level': 30}, 'manag` |
| `CDP_SCORE_BANDS` | `[{'grade': 'A', 'label': 'Leadership', 'min_pct': 80, 'description': 'Best practice environmental stewardship'}, {'grade': 'A-', 'label': 'Leadership', 'min_pct': 70, 'description': 'Implementing current best practices'}, {'grade': 'B', 'label': 'Management', 'min_pct': 60, 'description': 'Taking co` |
| `CDP_ACTIVITY_GROUPS` | `[{'code': 'AG01', 'name': 'Financial Services', 'sectors': ['Banking', 'Insurance', 'Investment Management']}, {'code': 'AG02', 'name': 'Fossil Fuels', 'sectors': ['Oil & Gas', 'Coal']}, {'code': 'AG03', 'name': 'Power Generation', 'sectors': ['Electric Utilities', 'Independent Power']}, {'code': 'A` |
| `CDP_CROSS_FRAMEWORK_MAP` | `[{'cdp_module': 'C1', 'cdp_title': 'Governance', 'tcfd': 'Governance a) and b)', 'gri': 'GRI 2-9 to 2-21 (Governance)', 'issb_s2': 'IFRS S2 para 5-6 (Governance)', 'sasb': '—'}, {'cdp_module': 'C2', 'cdp_title': 'Risks and Opportunities', 'tcfd': 'Strategy a) and Risk Management a)', 'gri': 'GRI 201` |
| `CDP_PEER_BENCHMARK_MEDIANS` | `[{'activity_group': 'AG01', 'median_score_pct': 58.0, 'median_grade': 'B-', 'avg_disclosure_pct': 72.0, 'avg_scope12_verified_pct': 65.0, 'avg_target_coverage_pct': 55.0}, {'activity_group': 'AG02', 'median_score_pct': 52.0, 'median_grade': 'B-', 'avg_disclosure_pct': 68.0, 'avg_scope12_verified_pct` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/cdp/ref/activity-groups** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['activity_groups'], 'n_keys': 1}`

**GET /api/v1/cdp/ref/climate-modules** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['climate_modules'], 'n_keys': 1}`

**GET /api/v1/cdp/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cross_framework_mapping'], 'n_keys': 1}`

**GET /api/v1/cdp/ref/module-catalog** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['module_catalog'], 'n_keys': 1}`

**GET /api/v1/cdp/ref/peer-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['peer_benchmarks'], 'n_keys': 1}`

**GET /api/v1/cdp/ref/score-bands** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['score_bands'], 'n_keys': 1}`

**GET /api/v1/cdp/ref/scoring-methodology** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scoring_methodology'], 'n_keys': 1}`

**GET /api/v1/cdp/ref/water-modules** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['water_modules'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `cdp_scoring_engine` — extracted transformation lines:**
```python
delta = round(entity_score_pct - median, 1)
total_input = disc + awar + mgmt + lead
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

Grounded in `backend/services/cdp_scoring_engine.py` (routes: `api/v1/routes/cdp_scoring.py`,
mounted at `/api/v1/cdp`). A CDP (Carbon Disclosure Project) scoring engine for the Climate Change
(C0–C14) and Water Security (W0–W8) questionnaires, implementing CDP's four-level scoring
(Disclosure → Awareness → Management → Leadership) and A→D- letter grades, with peer benchmarking,
cross-framework mapping, gap analysis, and recommendations.

### 7.1 What the domain computes

Note the **exposed API surface is reference-data only** — the eight `GET /ref/*` endpoints in the
trace serve the static tables (module catalogues, scoring methodology, score bands, activity
groups, cross-framework map, peer benchmarks). The scoring calculators (`assess_climate`,
`assess_water`, `compare_to_peers`) are engine methods consumed internally; they define what the
reference data means.

```
module_overall = disc·w_disc + awar·w_awar + mgmt·w_mgmt + lead·w_lead   (category-specific weights)
level_avg[L]   = mean over modules of level-L score
overall_pct    = Σ level_avg[L] × 0.25                                    (four equal level weights)
grade          = highest band whose min_pct ≤ overall_pct
```

### 7.2 Parameterisation (cited to CDP Scoring Methodology 2024)

**Four scoring levels**, each weighted 0.25, with a minimum-score threshold to reach the level:
Disclosure (0), Awareness (30), Management (50), Leadership (75).

**Score bands** (letter ← min %): A ← 80 · A- ← 70 · B ← 60 · B- ← 50 · C ← 40 · C- ← 30 · D ← 10
· D- ← 0. Grade labels group into Leadership/Management/Awareness/Disclosure.

**Category scoring weights** (`_CATEGORY_SCORING_WEIGHTS`) — per module category, how the four
levels combine into the module score. Examples:

| Category | disc | awar | mgmt | lead |
|---|---|---|---|---|
| governance | 0.40 | 0.30 | 0.20 | 0.10 |
| emissions | 0.35 | 0.25 | 0.25 | 0.15 |
| targets | 0.15 | 0.20 | 0.30 | 0.35 |
| strategy | 0.20 | 0.25 | 0.30 | 0.25 |
| engagement | 0.20 | 0.25 | 0.30 | 0.25 |

Disclosure-heavy for governance/emissions (basic reporting), leadership-heavy for targets
(ambition matters most) — mirroring CDP's emphasis that higher levels require demonstrated action.

**Modules**: 15 Climate (C0 Introduction … C6 Emissions Data (10 disclosures) … C14 Signoff) and 9
Water (W0 … W5 Facility Water Accounting … W8 Targets), each with category and disclosure count.
**12 Activity Groups** (AG01 Financial Services … AG12 Mining & Metals). **Peer benchmark medians**
for 6 groups (e.g. AG08 Technology median 62% grade B; AG12 Mining 45% grade C) with avg
disclosure/verification/target-coverage. **Cross-framework map**: CDP modules → TCFD / GRI / ISSB
S2 / SASB (e.g. C6 Emissions → TCFD Metrics&Targets a, GRI 305-1..4, IFRS S2 para 29).

### 7.3 Calculation walkthrough

1. **Per module** (`_score_module`): the four level inputs (0–100) are clamped, combined with the
   category weights into `overall`; status = `not_disclosed` (all zero) / `partial` (disclosure
   < 30 or overall < 20) / `complete`.
2. **Aggregate**: each level is averaged across all modules; `overall_pct` = Σ level_avg × 0.25.
3. **Grade**: first band whose `min_pct ≤ overall_pct`.
4. **Derived flags**: verification from C10 (Scope 1/2 verified if C10 disclosure ≥ 50; ISO
   14064-3); SBTi alignment from C4 (`has_sbti_target` if C4 management ≥ 60; net-zero if C4
   leadership ≥ 75); water risk level from W1/W2 (`0.4·W1_awar + 0.3·W2_awar + 0.3·W2_mgmt` → high
   ≥ 70 / medium ≥ 40 / low). Cross-framework mappings are filtered to responded modules.
5. **Peer comparison**: `delta = entity − activity-group median`; above ≥ +5, at within ±5, else
   below. **Gaps** and **recommendations** are grade- and gap-driven (capped at 10 / 8 items).

### 7.4 Worked example (Technology entity, AG08)

Suppose module-averaged levels come out disclosure 70, awareness 55, management 48, leadership 35:

| Level | avg | × weight 0.25 |
|---|---|---|
| Disclosure | 70 | 17.5 |
| Awareness | 55 | 13.75 |
| Management | 48 | 12.0 |
| Leadership | 35 | 8.75 |
| **Overall** | | **52.0%** |

52.0 ≥ 50 → grade **B-** (Management). Peer comparison vs AG08 median 62%: delta = 52 − 62 =
−10 → **below_median**. A single governance module scored disclosure 40 / awareness 30 / management
20 / leadership 10 would give `40×0.40 + 30×0.30 + 20×0.20 + 10×0.10 = 16 + 9 + 4 + 1 = 30.0`
overall — status complete (disclosure ≥ 30). If C4 management were 65 → `has_sbti_target = True`;
if leadership < 75 → net-zero gap flagged and a recommendation to develop a net-zero transition
plan is emitted.

### 7.5 Data provenance & limitations

- **No synthetic/PRNG numeric data.** Level scores are caller-supplied (or default 0); the only
  `hashlib` use is generating a stable assessment ID from name+year — not a fabricated metric.
  Peer benchmark medians are curated reference values (labelled as activity-group medians), not
  live CDP data.
- The engine scores **self-assessed 0–100 level inputs**, not raw questionnaire responses: a
  caller (or upstream mapping) must translate actual CDP answers into per-module Disclosure/
  Awareness/Management/Leadership scores. It does not parse the CDP questionnaire itself.
- CDP's real scoring is question-and-points based with category weightings, gateway/exclusion
  criteria, and level-gating (you cannot score Management points without passing Awareness); here
  levels are simply averaged with equal 0.25 weights and the `min_score_for_level` thresholds are
  reference metadata, **not enforced** as gates in the aggregation.
- Derived flags (verification, SBTi, water risk) use single-module heuristics with fixed
  thresholds, not the multi-question logic CDP applies.
- Peer benchmarks cover only 6 of 12 activity groups; others return `benchmark_available: false`.

### 7.6 Framework alignment

- **CDP Scoring Methodology 2024 (Climate Change & Water Security)** — the four-level structure
  (Disclosure/Awareness/Management/Leadership), the A→D- band cut-offs, module structure (C0–C14,
  W0–W8) and Activity Classification System are CDP's own; the engine approximates CDP's weighted,
  gated points system with category-weighted level averaging.
- **CDP Activity Classification System (2023)** — 12 activity groups used for peer benchmarking,
  since CDP scores are only comparable within an activity group.
- **TCFD (2017/2021)** — cross-framework map ties CDP modules to the four TCFD pillars (C1↔
  Governance, C2/C3↔Strategy & Risk Management, C4/C6↔Metrics & Targets).
- **IFRS S2 / ISSB (2023)** — CDP modules mapped to S2 paragraphs (governance 5-6, risks 10-12,
  strategy 13-22, Scope 1/2/3 emissions para 29, targets 33-36), reflecting the CDP–ISSB
  interoperability.
- **GRI 305 (Emissions) / GRI 303 (Water) / GRI 302 (Energy)** and **SASB** — module-level
  mappings for disclosure interoperability.
- **SBTi** — target status inferred from C4 (approved/committed/no_target) and net-zero flag,
  reflecting CDP's Leadership-band requirement for science-based targets.

## 9 · Future Evolution

### 9.1 Evolution A — Enforce CDP level-gating and parse raw questionnaire responses (analytics ladder: rung 1 → 3)

**What.** A CDP scoring engine for the Climate (C0–C14) and Water (W0–W8) questionnaires,
implementing the four-level structure (Disclosure→Awareness→Management→Leadership), A→D- bands, peer
benchmarking, cross-framework mapping and recommendations — deterministic, no PRNG (the only
`hashlib` use is a stable assessment ID). §7.5 names the fidelity gaps: the engine scores
**self-assessed 0–100 level inputs**, not raw questionnaire responses (a caller must translate CDP
answers into per-module scores); CDP's real scoring is question-and-points based with **level-gating**
(you cannot score Management without passing Awareness), but here levels are simply averaged at equal
0.25 weights and the `min_score_for_level` thresholds are reference metadata **not enforced as
gates**; and peer benchmarks cover only 6 of 12 activity groups. Evolution A enforces the level
gates and adds a raw-response scorer.

**How.** `_score_module` gates higher-level points on passing the lower level's `min_score_for_level`
(Awareness ≥30 before Management counts, etc.), matching CDP's cascade; a new `assess_from_responses`
maps raw questionnaire answers to level scores so callers needn't pre-translate. Rung 3: complete the
peer-benchmark medians for all 12 activity groups from published CDP score distributions, and validate
grade outputs against actual CDP disclosures. The exposed surface today is reference-data-only — the
scoring endpoints (`assess-climate`, `assess-water`, `compare-peers`) become first-class.

**Prerequisites.** The scoring calculators are consumed internally (§7.1) — expose and harness-test
`POST /assess-climate` and `/assess-water`; document that category weights and thresholds approximate
CDP's proprietary weighted system. **Acceptance:** the §7.4 worked example (52.0% → B-) reproduces
under equal weighting, but enabling gating lowers scores where a level is skipped; a raw-response
input produces the same grade as its pre-translated equivalent; all 12 activity groups return a
benchmark.

### 9.2 Evolution B — CDP disclosure copilot with tool-called scoring (LLM tier 1 → 2)

**What.** A copilot for sustainability teams answering "what's our likely CDP climate grade?"
(tool-calls `/assess-climate`), "how do we compare to our activity-group peers?" (`/compare-peers`),
"what gaps are dragging our score?" (the engine's gap analysis), and "how does CDP C6 map to ISSB
S2?" (the cross-framework map) — narrating the engine's real module scores, grade bands and
prioritised recommendations.

**How.** Tier-1 roadmap pattern for explanation (the 8 `ref/*` endpoints — module catalogues,
scoring methodology, score bands, activity groups, cross-framework map, peer benchmarks — are ideal
RAG grounding), graduating to tier 2 once the scoring endpoints are exposed (Evolution A) so the
copilot runs real assessments. The no-fabrication validator checks every percentage and grade against
tool output; the copilot must state that it scores self-assessed level inputs and approximates CDP's
proprietary weighted/gated system, not the official score. Composable into a disclosure-readiness
workflow alongside `csrd_reports` and `analyst_portfolios`.

**Prerequisites.** Evolution A's exposed scoring endpoints and gating; Atlas + `ref/*` corpus
embedded (roadmap D3). **Acceptance:** every figure cited traces to an engine tool call; the grade
matches `/assess-climate`; a cross-framework question resolves to the real CDP→TCFD/ISSB/GRI/SASB
mapping; the copilot flags its output as an approximation of CDP's official methodology.