# Api::Tcfd_Metrics
**Module ID:** `api::tcfd_metrics` · **Route:** `/api/v1/tcfd-metrics` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/tcfd-metrics/assess` | `assess` | api/v1/routes/tcfd_metrics.py |
| POST | `/api/v1/tcfd-metrics/assess/pillar` | `assess_pillar` | api/v1/routes/tcfd_metrics.py |
| POST | `/api/v1/tcfd-metrics/assess/batch` | `assess_batch` | api/v1/routes/tcfd_metrics.py |
| GET | `/api/v1/tcfd-metrics/ref/recommendations` | `ref_recommendations` | api/v1/routes/tcfd_metrics.py |
| GET | `/api/v1/tcfd-metrics/ref/pillars` | `ref_pillars` | api/v1/routes/tcfd_metrics.py |
| GET | `/api/v1/tcfd-metrics/ref/sector-supplements` | `ref_sector_supplements` | api/v1/routes/tcfd_metrics.py |
| GET | `/api/v1/tcfd-metrics/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/tcfd_metrics.py |

### 2.3 Engine `tcfd_metrics_engine` (services/tcfd_metrics_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `RecommendationAssessment.to_dict` |  |  |
| `PillarResult.to_dict` |  |  |
| `TCFDResult.to_dict` |  |  |
| `TCFDMetricsEngine.assess` | entity_id, entity_name, sector, disclosure_year, recommendation_inputs | Full 11-recommendation TCFD assessment. recommendation_inputs keys: G1/G2/S1/S2/S3/RM1/RM2/RM3/MT1/MT2/MT3 Each value: { "disclosed": bool, "disclosure_quality": str ("none"/"partial"/"full"), "elements_covered": list[str] } |
| `TCFDMetricsEngine.assess_pillar` | pillar_id, entity_id, entity_name, rec_inputs | Single-pillar assessment. |
| `TCFDMetricsEngine.get_recommendations` |  |  |
| `TCFDMetricsEngine.get_pillars` |  |  |
| `TCFDMetricsEngine.get_sector_supplements` |  |  |
| `TCFDMetricsEngine.get_maturity_levels` |  |  |
| `TCFDMetricsEngine.get_cross_framework` |  |  |
| `TCFDMetricsEngine._build_rec_assessment` | rec_id, rec_def, raw |  |
| `TCFDMetricsEngine._build_pillar_result` | pillar_id, pillar_def, rec_assessments |  |
| `TCFDMetricsEngine._resolve_maturity` | score |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/tcfd-metrics/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['csrd_esrs_e1', 'issb_s2', 'cdp_c_modules', 'gri_305', 'sec_reg_sk_1501'], 'n_keys': 5}`

**GET /api/v1/tcfd-metrics/ref/maturity-levels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': [1, 2, 3, 4, 5], 'n_keys': 5}`

**GET /api/v1/tcfd-metrics/ref/pillars** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['governance', 'strategy', 'risk_management', 'metrics_targets'], 'n_keys': 4}`

**GET /api/v1/tcfd-metrics/ref/recommendations** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['G1', 'G2', 'S1', 'S2', 'S3', 'RM1', 'RM2', 'RM3', 'MT1', 'MT2', 'MT3'], 'n_keys': 11}`

**GET /api/v1/tcfd-metrics/ref/sector-supplements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['financial_institutions', 'energy', 'transport', 'buildings', 'agriculture'], 'n_keys': 5}`

**POST /api/v1/tcfd-metrics/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/tcfd-metrics/assess/batch** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/tcfd-metrics/assess/pillar** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `tcfd_metrics_engine` — extracted transformation lines:**
```python
completeness_pct = (len(valid_covered) / total * 100.0) if total > 0 else 0.0
pillar_score = (weighted_score_sum / weight_sum) if weight_sum > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/tcfd_metrics_engine.py` (E13) scores an entity's disclosure against the full **TCFD framework: 4 pillars, 11 recommendations** (G1/G2, S1/S2/S3, RM1/RM2/RM3, MT1/MT2/MT3). The caller submits, per recommendation, `{disclosed: bool, disclosure_quality, elements_covered: [...]}`; the engine computes:

```
completeness_pct(rec) = |valid elements covered| / |defined disclosure elements| × 100
pillar_score          = Σ weight_r × completeness_r / Σ weight_r        (weight_r = 1.5 if blocking else 1.0)
overall_score         = 0.20·Gov + 0.30·Strategy + 0.25·RiskMgmt + 0.25·Metrics&Targets
maturity(level 1–5)   = highest level whose score_range floor ≤ overall_score
```

Endpoints: `POST /assess` (full 11-rec), `POST /assess/pillar` (single pillar), `POST /assess/batch`, and five `ref/*` endpoints returning the reference dictionaries (pillars, recommendations, sector supplements, maturity levels, cross-framework map).

### 7.2 Parameterisation

**Disclosure elements per recommendation** (`TCFD_RECOMMENDATIONS`): each rec defines 3–5 named elements — e.g. MT2 requires Scope 1 tCO₂e, Scope 2 market-based, Scope 3 material categories, and intensity metrics; MT3 requires absolute vs intensity targets, base year, target year, progress, SBT alignment. Only elements that exactly match the defined list count toward completeness (`valid_covered` filter).

**Blocking classification:** 9 of 11 recommendations are `blocking: true`; only **S3 (Scenario Resilience)** and **RM3 (ERM integration)** are non-blocking. This is an engine design choice (the TCFD itself does not rank recommendations); blocking recs get **1.5× weight** in pillar scores and any blocking rec below 80% completeness is emitted as a `blocking_gap` and feeds the top-3 `priority_actions` (sorted by lowest completeness).

**Pillar weights** (`_PILLAR_WEIGHTS`, engine-authored): Governance 0.20, Strategy 0.30, Risk Management 0.25, Metrics & Targets 0.25.

**Maturity ladder** (`TCFD_MATURITY_LEVELS`):

| Level | Name | Score range |
|---|---|---|
| 1 | Initial | 0–30 |
| 2 | Emerging | 30–55 |
| 3 | Defined | 55–75 |
| 4 | Advanced | 75–90 |
| 5 | Leading | 90–100 |

**Sector supplements** (`SECTOR_SUPPLEMENTS`): descriptive metric lists for 5 sectors from the TCFD 2021 Annex / 2020 financial-sector guidance (e.g. financial_institutions → financed emissions Scope 3 Cat 15, portfolio temperature alignment, climate VaR; buildings → kWh/m², EPC distribution, CRREM alignment). These are attached to the result verbatim, **not scored**.

### 7.3 Calculation walkthrough

1. **Consistency guards** in `_build_rec_assessment`: if `disclosed=false`, completeness is forced to 0 and all elements marked missing regardless of input; if disclosed but quality omitted, quality auto-labels from completeness (≥80% full, ≥30% partial).
2. **Pillar rollup** (`_build_pillar_result`): counts fully (≥80%), partially (30–80%), and not (<30%) disclosed recs; computes the blocking-weighted mean.
3. **Overall + maturity**: weighted pillar sum → `_resolve_maturity` scans levels 5→1 and returns the first whose floor is ≤ score.

### 7.4 Worked example

Entity disclosing: G1 full (3/3 elements), G2 partial (1/3), S1 full (4/4), S2 half (2/4), S3 not disclosed, RM1 full (3/3), RM2 2/3, RM3 not disclosed, MT1 2/4, MT2 full (4/4), MT3 3/5.

| Pillar | Per-rec completeness (weight) | Pillar score |
|---|---|---|
| Governance | G1 100 (1.5), G2 33.3 (1.5) | (150+50)/3 = **66.67** |
| Strategy | S1 100 (1.5), S2 50 (1.5), S3 0 (1.0) | (150+75+0)/4 = **56.25** |
| Risk Mgmt | RM1 100 (1.5), RM2 66.7 (1.5), RM3 0 (1.0) | (150+100)/4 = **62.5** |
| Metrics & Targets | MT1 50 (1.5), MT2 100 (1.5), MT3 60 (1.5) | (75+150+90)/4.5 = **70.0** |

Overall = 0.20×66.67 + 0.30×56.25 + 0.25×62.5 + 0.25×70.0 = 13.33 + 16.88 + 15.63 + 17.50 = **63.33** → maturity **Level 3 "Defined"** (55–75). Blocking gaps: G2 (33%), S2 (50%), RM2 (67%), MT1 (50%), MT3 (60%); priority actions list the three lowest — G2, then MT1/S2.

### 7.5 Data provenance & limitations

- **Fully deterministic, no PRNG, no seed data** — all numbers derive from caller-supplied element coverage. Scores measure *disclosure completeness*, not disclosure *quality* or truthfulness (a company disclosing all elements badly still scores 100).
- Blocking flags, 1.5× weight, pillar weights, and maturity band boundaries are engine calibration choices — the TCFD framework itself prescribes none of these numbers.
- Element checklists are condensed (3–5 items per rec) relative to the TCFD's full guidance text; sector-supplement metrics are informational only.
- Stateless; no persistence or year-over-year maturity tracking despite `disclosure_year` being captured.

### 7.6 Framework alignment

- **TCFD Final Recommendations (2017) + 2021 Annex** — the 4-pillar / 11-recommendation structure and per-rec disclosure elements are a direct transcription; sector supplements follow the 2021 Annex and the 2020 financial-sector guidance.
- **IFRS S2 (ISSB)** — cross-framework map notes S2 incorporates all 11 TCFD recommendations as its architectural foundation (which is factually how ISSB built S2).
- **CSRD ESRS E1** — mapped near 1:1 (S3 ↔ E1 scenario analysis); the map is descriptive metadata returned with each assessment, not a scored crosswalk.
- **CDP / GRI 305 / SEC Reg S-K Item 1500s** — descriptive mappings only (e.g. CDP C6 ↔ MT2 GHG; SEC 1502 ↔ S1/S2). Real CDP scoring uses its own leveled methodology (Disclosure→Awareness→Management→Leadership); this engine approximates the same idea with its 5-level maturity ladder over completeness percentages.

## 9 · Future Evolution

### 9.1 Evolution A — Evidence-graded elements and maturity trajectory (analytics ladder: rung 1 → 2)

**What.** The E13 engine scores disclosure against the full TCFD framework — 4 pillars, 11
recommendations (G1/G2, S1–S3, RM1–RM3, MT1–MT3), each with 3–5 named disclosure elements:
`completeness(rec) = covered/defined × 100`, pillar scores weighted (blocking ×1.5),
`overall = 0.20·Gov + 0.30·Strategy + 0.25·RiskMgmt + 0.25·M&T`, mapped to a 5-level maturity
ladder. Clean and honest, but inputs are caller-asserted booleans/quality flags per element, and
with TCFD now absorbed into ISSB, the module's distinct value is the element-level granularity and
the maturity ladder. Evolution A grounds elements in evidence and adds trajectory.

**How.** (1) Auto-grade the metric-bearing elements from platform data: MT2's Scope 1/2/3 elements
check against the entity's actual computed emissions (PCAF/GHG engines), S3's scenario-analysis
element against stored scenario runs — so `elements_covered` is verified where the platform holds
the evidence, with an `evidence_tier` per element. (2) Persist assessments so maturity is a
trajectory (level 2 → 3 year-over-year), the story boards actually want. (3) Reuse assessments
across frameworks via the existing `/ref/cross-framework` map (ESRS E1, ISSB S2, CDP, GRI 305,
SEC) so a TCFD assessment pre-fills its successors — this module becomes the platform's
climate-disclosure rosetta stone. (4) Bench-pin the pillar weighting and maturity mapping.

**Prerequisites.** Links to emissions/scenario engines for element verification; an assessment
store for trajectories. **Acceptance:** MT2 elements auto-verify against computed emissions with an
evidence tier; maturity returns a multi-year trajectory for a persisted entity; cross-framework
pre-fill demonstrated into `issb_s2`; scoring bench-pinned.

### 9.2 Evolution B — TCFD maturity copilot with cross-framework migration (LLM tier 2)

**What.** A copilot that runs `/assess` and explains the verdict — "you're maturity level 3;
Strategy (weighted 0.30) is your weak pillar because S3's resilience element is missing; here's
what closes it" — and answers the question every reporter now asks: "we did TCFD; what's left for
ISSB S2 / CSRD?" using the cross-framework map.

**How.** Three POST endpoints (`/assess`, `/assess/pillar`, `/assess/batch`) plus five reference
GETs (the 11 recommendations with their named elements, pillars, sector supplements, maturity
levels, cross-framework) — a complete grounding corpus, so the copilot cites the exact missing
element (e.g. "MT2: Scope 3 material categories") rather than vague gaps. Batch supports
subsidiary roll-ups; sector supplements tailor the narrative. Pairs with the `issb_s2` and
`regulatory_reports` copilots for the migration story.

**Prerequisites.** None hard — the engine is honest and reference-complete today; evidence-graded
narration and trajectories need Evolution A. **Acceptance:** every pillar score, maturity level,
and named gap traces to an `/assess` response; cross-framework claims come from the mapping
endpoint, not model memory; the copilot discloses that element coverage is self-asserted
(pre-Evolution-A) and refuses to state regulatory compliance from a voluntary-framework score.