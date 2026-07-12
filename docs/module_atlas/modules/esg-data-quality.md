# ESG Data Quality Dashboard
**Module ID:** `esg-data-quality` · **Route:** `/esg-data-quality` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Multi-provider ESG data quality monitoring. Coverage completeness, timeliness scores, provider divergence analysis, and substitution logic for missing values.

> **Business value:** ESG data quality is the foundation of credible sustainable investment. Divergence between providers and incomplete coverage are major sources of uncertainty. This module enables systematic quality monitoring and evidence-based substitution decisions.

**How an analyst works this module:**
- Coverage Dashboard shows ESG data availability per holding
- Divergence Analysis compares MSCI vs Sustainalytics scores
- Timeliness Monitor flags stale data points
- Substitution Log shows where proxies were applied
- Gap Remediation prioritises data collection effort

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `Chk`, `DQ_API`, `FRONTEND_TO_BACKEND_SECTOR`, `Inp`, `KpiCard`, `PIE_COLORS`, `Row`, `SECTORS`, `STANDARD_KEYS`, `STANDARD_LABELS`, `Section`, `Sel`, `StatusBadge`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `DQ_API` | ``${API}/api/v1/esg-data-quality`;` |
| `seededRandom` | `(seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };` |
| `nums` | `String(str).replace(/,/g, '').match(/\d+/g);` |
| `base` | `hashStr(entity + sector + framework);` |
| `overall` | `Math.round(categories.reduce((sum, c) => sum + c.score, 0) / 4);` |
| `chartData` | `providers.map((prov, pi) => {` |
| `gapRows` | `providers.map((prov, pi) => {` |
| `scores` | `dataTypes.map((_, di) => Math.round(s(pi * 9 + di + 1) * 40 + 40));` |
| `avgScore` | `Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);` |
| `sc1` | `parseFloat((s(1) * 1.5 + 1.5).toFixed(1));` |
| `sc2` | `parseFloat((s(2) * 1.5 + 1.5).toFixed(1));` |
| `sc3` | `parseFloat((s(3) * 2 + 2).toFixed(1));` |
| `weighted` | `parseFloat(((sc1 * 0.3 + sc2 * 0.3 + sc3 * 0.4)).toFixed(1));` |
| `categories` | `Object.entries(liveResult.bcbs239_category_scores).map(([dimension, score]) => ({ dimension, score: Math.round(score / 5 * 100), raw: score }));` |
| `principles` | `liveResult.bcbs239_principle_detail.map(p => ({ principle: p.principle_id, name: p.name, score: Math.round(p.maturity_score / 5 * 100), maturityLevel: p.maturity_level }));` |
| `providers` | `providerLive.providers; // ['CDP','MSCI','Bloomberg','Refinitiv','ISS']` |
| `dataTypes` | `providerLive.data_types;  // ['GHG','water','waste','diversity','board','remuneration','controversy']` |
| `labels` | `STANDARD_KEYS.map(k => STANDARD_LABELS[k]);` |
| `costChartData` | `STANDARD_KEYS.map(k => ({` |
| `pieData` | `Object.entries(riskCounts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));` |
| `gaps` | `liveResult.gap_analysis.map(g => {` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/esg-data-quality/report` | `run_full_report` | api/v1/routes/esg_data_quality.py |
| POST | `/api/v1/esg-data-quality/provider-divergence` | `analyse_provider_divergence` | api/v1/routes/esg_data_quality.py |
| POST | `/api/v1/esg-data-quality/bcbs239` | `assess_bcbs239` | api/v1/routes/esg_data_quality.py |
| GET | `/api/v1/esg-data-quality/reports/{entity_id}` | `list_reports` | api/v1/routes/esg_data_quality.py |
| GET | `/api/v1/esg-data-quality/report/{report_id}` | `get_report` | api/v1/routes/esg_data_quality.py |
| GET | `/api/v1/esg-data-quality/ref/indicators` | `get_indicators` | api/v1/routes/esg_data_quality.py |
| GET | `/api/v1/esg-data-quality/ref/dqs-levels` | `get_dqs_levels` | api/v1/routes/esg_data_quality.py |

### 2.3 Engine `esg_data_quality_assurance_engine` (services/esg_data_quality_assurance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_bcbs239_category_score` | principles_used, maturity_scores | Compute weighted category scores from principle maturity levels. |
| `_overall_dqs` | scope_coverage | Weighted average DQS across scopes. |
| `assess_data_quality` | entity_id, framework, reporting_year, disclosed_fields, assurance_level | Full ESG data quality assessment: - BCBS 239 principle scoring (14 principles) - PCAF DQS by scope - Provider coverage estimate for sector - Overall quality tier - Gap analysis and remediation plan |
| `verify_data_point` | field_name, reported_value, verification_source, comparison_data | Verifies a single ESG data point against peer/sector comparisons. Returns variance analysis, flag type, and BCBS239 principle mapping. |
| `recommend_assurance_approach` | entity_id, framework, size_tier | Recommends assurance standard and scope based on entity framework and size. size_tier: micro / small / medium / large / very_large |
| `impute_missing_data` | entity_id, missing_fields, sector, peer_data | AI-assisted imputation for missing ESG data fields. Returns imputed values with confidence scores for each method. |
| `get_provider_coverage` | sector, data_types | Returns provider coverage rates for specified sector and data types. |
| `get_bcbs239_principles` |  |  |
| `get_assurance_standards` |  |  |
| `get_dqs_definitions` |  |  |

**Engine `esg_data_quality_assurance_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `DQS_QUALITY_TIERS` | `{1: 'excellent', 2: 'good', 3: 'adequate', 4: 'poor', 5: 'insufficient'}` |

### 2.3 Engine `esg_data_quality_engine` (services/esg_data_quality_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ESGDataQualityEngine._dqs_weight` | level |  |
| `ESGDataQualityEngine._is_material` | indicator, sector | Determine indicator materiality from the reference material_sectors map. Returns True/False when a sector is supplied (real lookup against ESG_PILLARS), or None (honest null) when no sector context is available — materiality is entity/sector-specific and cannot be inferred otherwise. |
| `ESGDataQualityEngine.score_pillar` | entity_id, pillar, indicators_data, sector | Score a single ESG pillar (E/S/G) for coverage and quality. Coverage and quality are computed from ``indicators_data`` — a mapping of indicator_id -> {"value", "dqs_level", "method"}. An indicator is treated as reported only when a caller-supplied value is present; absent indicators are honestly "not reported" (no fabricated presence, DQS, or value). ``sector`` (optional) drives real materiality l |
| `ESGDataQualityEngine.analyse_provider_divergence` | entity_id, bloomberg_data, msci_data, sustainalytics_data | Analyse ESG score divergence across data providers. Divergence (spread, average, outlier flags) is computed only from the provider score dicts actually supplied by the caller. When fewer than two providers are available, no divergence can be measured and metrics are returned as honest nulls with ``insufficient_data`` status — nothing is fabricated to stand in for a missing provider feed. |
| `ESGDataQualityEngine.calculate_dqs_profile` | entity_id, indicators_with_sources | Calculate PCAF-style DQS profile across all pillars. The profile is built solely from ``indicators_with_sources`` — a list of {"pillar", "dqs_level"} rows. Pillars with no supplied source rows yield a null breakdown (``insufficient_data``); no synthetic DQS distribution is fabricated. Improvement priorities are derived deterministically from which pillars actually score poorly, drawn from a fixed  |
| `ESGDataQualityEngine.assess_bcbs239_compliance` | entity_id, data_governance_inputs | Assess BCBS 239 data governance compliance across 14 principles. Each principle is scored only from a caller-supplied ``data_governance_inputs["principle_<id>"]["score"]``. Principles with no supplied score are honestly marked ``not_assessed`` (score None) rather than assigned a random value. The weighted compliance score is computed over the assessed principles and re-normalised by their weight s |
| `ESGDataQualityEngine.run_full_report` | entity_id, entity_name, reporting_period, e_data, s_data, g_data | Run full ESG data quality assessment and return report dict. Optional keyword args (all backward-compatible, default absent): - ``sector``: drives real indicator materiality lookup. - ``data_governance_inputs``: per-principle BCBS 239 scores. - ``provider_scores``: mapping of provider name -> {"E","S","G","overall"} for real divergence analysis. Sections without supplied inputs return honest nulls |
| `ESGDataQualityEngine.get_reference_data` |  | Return all reference constants. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `BRSR`, `FY2024` *(shared)*, `SET` *(shared)*, `__future__` *(shared)*, `disclosed`, `dme_brsr_submissions`, `esg_data_quality_indicators`, `esg_data_quality_reports`, `fastapi` *(shared)*, `non`, `pydantic` *(shared)*, `services` *(shared)*, `source`, `typing` *(shared)*
**Frontend seed datasets:** `PIE_COLORS`, `SECTORS`, `STANDARD_KEYS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Coverage Rate | — | Assessment | Percentage of holdings with primary ESG data |
| Provider Divergence | — | Cross-provider analysis | Score difference between top-2 ESG raters |
| Timeliness | — | Data freshness | Average data age relative to reporting date |
- **Multi-provider ESG data** → Coverage and freshness assessment → **DQ score per company**
- **DQ scores** → Substitution rule application → **Best-available ESG dataset**
- **ESG dataset** → Portfolio analytics → **Quality-adjusted output metrics**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/esg-data-quality/ref/dqs-levels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dqs_levels', 'estimation_methods', 'notes'], 'n_keys': 3}`

**GET /api/v1/esg-data-quality/ref/indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pillars', 'total_count', 'material_indicator_sets'], 'n_keys': 3}`

**GET /api/v1/esg-data-quality/report/{report_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/esg-data-quality/reports/{entity_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/esg-data-quality/bcbs239** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['entity_id', 'bcbs239_score', 'compliance_tier', 'principle_scores', 'gaps', 'num_compliant', 'num_partial', 'num_non_compliant', 'num_not_assessed', 'assessed_at'], 'n_keys': 10}`

**POST /api/v1/esg-data-quality/provider-divergence** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['entity_id', 'pillar_divergence', 'overall_divergence_score', 'divergence_status', 'providers_available', 'outlier_flags', 'recommended_primary_provider', 'benchmarks', 'assessed_at'], 'n_keys': 9}`

**POST /api/v1/esg-data-quality/report** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** ESG DQ composite scoring
**Headline formula:** `DQ = 0.4×Coverage + 0.3×Timeliness + 0.2×Accuracy + 0.1×Consistency`

Provider divergence: score difference between MSCI and Sustainalytics averages 25-35 points for same company. Substitution logic: if primary provider missing, use secondary → sector median → regional average.

**Standards:** ['PCAF DQ Framework', 'ISO 8000']
**Reference documents:** PCAF Data Quality Scale; CFA Institute ESG Data Guidance; IOSCO ESG Data Recommendations

**Engine `esg_data_quality_assurance_engine` — extracted transformation lines:**
```python
cat_scores[cat] = sum(s * w for s, w in items) / total_w if total_w > 0 else 0.0
raw = base_maturity + assurance_bonus
variance_pct = abs(reported_value - peer_mean) / abs(peer_mean) * 100
z_score = (reported_value - peer_mean) / peer_stdev if peer_stdev > 0 else 0.0
adjusted_cost = round(base_cost * (0.5 + complexity), -3)
avg_coverage = sum(coverages) / len(coverages)
prov_avg = {p: round(sum(v) / len(v), 3) for p, v in provider_averages.items()}  # type: ignore[union-attr]
```

**Engine `esg_data_quality_engine` — extracted transformation lines:**
```python
coverage_pct = round(reported_count / total * 100, 1) if total > 0 else 0
estimated_pct = round(estimated_count / reported_count * 100, 1) if reported_count > 0 else 0
pillar_score = round(coverage_pct * (dqs_sum / reported_count if reported_count > 0 else 0), 1)
spread = max(scores) - min(scores)
avg = sum(scores) / len(scores)
overall_divergence = round(sum(measured_spreads) / len(measured_spreads), 1)
mean_dev = sum(devs) / len(devs)
weighted = sum(self._dqs_weight(lvl) * cnt for lvl, cnt in counts.items())
q = weighted / max(1, total_rep)
pillar_score = round(5 - 4 * q, 2)
overall_dqs = round(sum(measured_scores) / len(measured_scores), 2)
bcbs239_score = round(total_weighted / assessed_weight, 1)
overall_coverage = round(reported_total / total_indicators * 100, 1) if total_indicators > 0 else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **2** other module(s).

| Connected module | Shared via |
|---|---|
| `sll-slb-v2` | table:FY2024 |
| `tnfd-leap` | table:SET |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code (frontend) mismatch.** The guide's headline DQ formula
> `DQ = 0.4·Coverage + 0.3·Timeliness + 0.2·Accuracy + 0.1·Consistency` is **not** what the rendered
> page computes. Every score displayed in the frontend — BCBS 239 dimension/principle scores, provider
> coverage, PCAF DQS bars, weighted DQS, assurance readiness — is fabricated client-side with
> `seededRandom(hashStr(entity+sector+framework)+n)` (`sr(s)=frac(sin(s+1)×10⁴)`). The `axios.post`
> to the assessment API is **fire-and-forget** (result discarded; comment: *"API fallback to seed
> data"*). **However**, the two backend engines it *nominally* targets
> (`esg_data_quality_engine.py`, `esg_data_quality_assurance_engine.py`) are genuinely
> standards-grounded — real PCAF DQS 1–5 weights, real BCBS 239 14-principle weights, and honest
> null-handling ("no fabricated presence"). This module is the classic split: **correct engine,
> disconnected synthetic UI.** §7 documents both layers.

### 7.1 What the module computes

**Frontend (what the user sees — synthetic):**

```js
base = hashStr(entity+sector+framework)          // deterministic per-entity seed
s(n) = seededRandom(base + n)                     // frac(sin(base+n+1)×10⁴)
BCBS category score = round(s(k)×~30 + ~52)       // Governance/Architecture/Accuracy/Reporting
BCBS overall        = mean(4 categories)          // → Platinum≥80/Gold≥65/Silver≥50/Bronze
DQS scope scores    = sc1,sc2,sc3 = s(1..3)×1.5+1.5  (∈1.5–3.5, PCAF-like)
weighted DQS        = sc1×0.3 + sc2×0.3 + sc3×0.4    // 0.3/0.3/0.4 = Scope 1/2/3 weights
provider gap        = per (provider × dataType) s(pi*9+di)×40+40; gaps = #(score<60)
```

**Backend (what a wired build would compute — genuine):**

`score_pillar` (quality engine): for each E/S/G pillar,
```python
coverage_pct = reported_count / total × 100
pillar_score = coverage_pct × (Σ dqs_weight(level) / reported_count)   # coverage × mean DQ weight
```
with `dqs_weight = {1:1.0, 2:0.8, 3:0.5, 4:0.3, 5:0.0}` (PCAF-style, level-1 best). Un-reported
indicators are honestly recorded as null — no invented presence or DQS. BCBS 239 composite uses the
real 14-principle weight vector (Governance 0.12, Architecture 0.10, … Home/host 0.04, summing to 1).

### 7.2 Parameterisation / scoring rubric

**PCAF DQS levels** (backend, authentic — DQS 1 = highest quality):

| DQS | Meaning | Quality weight |
|---|---|---|
| 1 | Audited/verified primary data | 1.0 |
| 2 | Reported unverified | 0.8 |
| 3 | Estimated from company data | 0.5 |
| 4 | Sector-average proxy | 0.3 |
| 5 | Missing / most uncertain | 0.0 |

**BCBS 239 principle weights** (backend): P1 Governance 0.12, P2 Data architecture 0.10, P3 Accuracy
0.10, P4 Completeness 0.08, P5 Timeliness 0.08 … P14 Home/host 0.04 (14 principles, Σ = 1.00). The
frontend shows 14 principle *names* but scores them with `s(i+10)×35+45`.

**Weighted-DQS Scope weights** `0.3/0.3/0.4` (frontend): Scope 1 / 2 / 3 — matches the guide and PCAF
financed-emissions convention, but applied to random scope-DQS draws.

**Provider divergence** (backend `esg_data_quality_engine`): typical MSCI↔Sustainalytics divergence
25%, Bloomberg 40%, CDP 18% — real published-order-of-magnitude figures; the guide's "25–35 pts"
band. Frontend renders a synthetic provider gap table instead.

### 7.3 Calculation walkthrough (as rendered)

1. User sets entity, sector, framework, reporting year, assurance level.
2. `getBCBSData` seeds off `hashStr(entity+sector+framework)` → 4 category scores → overall → tier.
3. `getDQS` → three scope DQS + `weighted = 0.3·sc1+0.3·sc2+0.4·sc3` → radial "quality %".
4. Provider tab: 5 providers × data types → synthetic coverage/gap grid.
5. `runAssessment` fires `POST /assess` but discards the response and keeps the seeded data.

### 7.4 Worked example — "Acme Corp PLC" / Banking / CSRD

`base = hashStr("Acme Corp PLCBankingCSRD")` (a fixed integer). Then `s(1)=frac(sin(base+2)×10⁴)`.
Say `s(1)=0.42, s(2)=0.61, s(3)=0.28` →
`sc1 = 0.42×1.5+1.5 = 2.13`, `sc2 = 0.61×1.5+1.5 = 2.42`, `sc3 = 0.28×2+2 = 2.56`;
`weighted = 2.13×0.3 + 2.42×0.3 + 2.56×0.4 = 0.639 + 0.726 + 1.024 = 2.39` → displayed "Weighted DQS
2.4" and radial "quality" `(5−2.39)/4×100 = 65%`. Deterministic for that exact entity string, but
carries no information about Acme's real data quality.

### 7.5 Data provenance & limitations

- **Frontend scores are fully synthetic** (`hashStr`+`seededRandom`); changing the entity name changes
  the seed and hence all "scores", so numbers move with the label, not with reality.
- **Backend engines are correct and honest** — PCAF DQS weighting, BCBS 239 weights, and a deliberate
  no-fabrication policy for un-reported indicators — but the UI does not consume their output.
- The guide's DQ formula (`0.4·Coverage+0.3·Timeliness+0.2·Accuracy+0.1·Consistency`) is implemented
  by *neither* layer as stated; the backend uses `coverage × mean(DQS weight)`, a different (and
  arguably better) composition.

**Framework alignment:** **PCAF Data Quality Score (Part A, 2022)** — DQS 1–5 hierarchy with quality
weights, the backend's core; PCAF derives DQS by data-source hierarchy (verified > reported >
physical-activity-estimated > economic-activity-estimated > asset-turnover-proxy). **BCBS 239** —
14 principles across Governance / Aggregation / Reporting / Supervisory, weighted composite (backend
authentic). **ISO 8000** (data quality) referenced conceptually. **IOSCO ESG data recommendations**
inform the provider-divergence framing.

### 8 · Model Specification

**Status: specification — not yet implemented in the rendered UI** (the backend implements most of
it; the frontend must be wired to consume it).

**8.1 Purpose & scope.** Produce a defensible, per-holding and portfolio ESG data-quality score
combining coverage, provenance (DQS), timeliness and cross-provider agreement, to prioritise data
remediation and quantify uncertainty passed into downstream analytics (financed emissions, ratings).

**8.2 Conceptual approach.** Mirror **PCAF DQS** (source-hierarchy quality weighting) for provenance,
**BCBS 239** for governance maturity, and a **provider-divergence** term à la the academic
"aggregate confusion" literature (Berg, Kölbel & Rigobon) — combining a coverage×provenance base with
a timeliness decay and a divergence penalty.

**8.3 Mathematical specification.**
- Indicator quality: `q_k = 1{reported}·w_{DQS}(level_k)·τ(age_k)`, `τ(age)=e^{−age/12mo}` (timeliness).
- Pillar score: `P_p = (Σ_{k∈p} q_k / |p|) × 100` (coverage × mean provenance × timeliness).
- Composite DQ: `DQ = Σ_p m_p·P_p − λ·D`, `m_p` = SASB materiality pillar weight, `D` = mean pairwise
  provider score dispersion (0–100), `λ` a divergence penalty.
- BCBS 239 governance overlay: `G = Σ_i w_i·principle_i` (w_i the real 14-weights), reported alongside.

| Parameter | Value / source |
|---|---|
| DQS weights 1.0/0.8/0.5/0.3/0.0 | PCAF Part A (backend already encodes) |
| Timeliness half-life | 12 mo (guide "6–12 month lag") |
| Materiality m_p | SASB industry weights |
| Divergence penalty λ | calibrate to Berg et al. divergence magnitudes |
| BCBS weights | backend `BCBS239_PRINCIPLES` (Σ=1) |

**8.4 Data requirements.** Per-indicator reported flag, DQS level, reporting date, and ≥2 provider
scores per holding. The backend already ingests DQS levels and provider divergence; frontend must POST
real holdings and render the returned assessment.

**8.5 Validation & benchmarking plan.** Reconcile DQS distribution against PCAF benchmark reports;
back-test that low-DQ holdings correlate with larger financed-emissions restatements; sensitivity of
DQ to λ and timeliness half-life; benchmark provider divergence against published MSCI/Sustainalytics
correlation studies.

**8.6 Limitations & model risk.** Provider divergence conflates methodology and measurement error;
timeliness decay is a convention; missing indicators forced to DQS 5 (weight 0) can over-penalise
small firms; the frontend↔backend disconnect must be fixed before any figure is decision-grade.

## 9 · Future Evolution

### 9.1 Evolution A — Finish the honest-nulls exemplar: real inputs for every section (analytics ladder: rung 2 → 3)

**What.** This module's engines are the platform's honest-nulls reference implementation — the docstrings are explicit that pillar coverage counts only caller-supplied indicators, provider divergence returns `insufficient_data` below two providers, unassessed BCBS 239 principles score `None`, and materiality is a real ESG_PILLARS lookup "or honest null." It also has genuine persistence (`esg_data_quality_reports`, `esg_data_quality_indicators`, BRSR submissions). The residual gap is upstream and in the page: several charts still render `seededRandom` provider scores and gap rows (`scores = round(s(pi·9+di)·40+40)`), and the engines' scrupulous input contracts mostly receive… no inputs, because indicator data and provider scores aren't systematically collected.

**How.** (1) Page cleanup: the seeded provider-comparison and gap-row charts either bind to `POST /provider-divergence` output or render the engine's `insufficient_data` state — the engine already models honesty; the page should stop papering over it. (2) Input supply: indicator data flows from real disclosures — the BRSR submissions table already wired here, plus `esg-report-parser` extractions and refdata ESRS/GRI catalogs for the indicator dictionary. Provider scores enter via licensed-feed upload with provenance. (3) Rung 3: benchmark the divergence analytics against the published literature's provider-correlation findings (the Berg et al. "Aggregate Confusion" ~0.5 correlation is the canonical anchor) and pin the DQS weighting arithmetic in `bench_quant.py`. (4) The `impute_missing_data` method gets §8 model-card treatment before any imputed value reaches a report — imputation without disclosure would undo the module's whole ethic.

**Prerequisites.** Indicator-collection UX; provider-data licensing decisions (divergence analysis needs ≥2 real feeds or stays honestly null). **Acceptance:** zero `seededRandom` in the page; a report for an entity with partial data shows explicit `not_assessed`/`insufficient_data` sections; imputed values always carry method and confidence fields.

### 9.2 Evolution B — Data-quality remediation planner (LLM tier 2)

**What.** The engine already emits gap analyses and remediation plans; the LLM evolution makes them actionable: a tool-calling planner that reads an entity's full report (`POST /report`), prioritizes gaps by materiality (the engine's real sector lookup) × assurance impact (its `recommend_assurance_approach`), and produces the collection campaign — which indicators to chase, from which internal owners, to lift which DQS tier and BCBS 239 principle — with effort estimates tied to the standard-cost data the page already charts.

**How.** Tools: `run_full_report`, `verify_data_point`, `recommend_assurance_approach`, `get_provider_coverage`, `list_reports` (for progress tracking across reporting periods). Grounding corpus = this Atlas record's §2.3 — the engine docstrings' input contracts double as the copilot's honesty rules: it must never present an imputed or unassessed value as reported, mirroring the engine's own conventions. Progress narratives compare persisted reports across periods, quoting DQS tier movements from stored rows.

**Prerequisites.** Evolution A's input supply (a remediation planner over empty inputs would produce the same generic plan for everyone); prompt-cached reference data. **Acceptance:** a golden entity's plan prioritizes exactly the engine's material-and-poor-scoring indicators; every DQS/BCBS figure quoted matches report rows; the plan never recommends "improving" an indicator the materiality lookup marks immaterial without saying why.