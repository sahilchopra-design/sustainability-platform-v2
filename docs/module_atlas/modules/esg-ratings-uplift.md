# ESG Ratings Uplift Analytics
**Module ID:** `esg-ratings-uplift` · **Route:** `/esg-ratings-uplift` · **Tier:** A (backend vertical) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Analyses gaps between current ESG scores and peer benchmarks across MSCI, Sustainalytics, CDP, and ISS rating systems, quantifies the impact of controversies, and models achievable score uplift through disclosure improvements. Accounts for the known 0.61 average Spearman correlation between major ESG data providers when synthesising cross-provider recommendations.

> **Business value:** Used by investor relations officers, sustainability managers, and ESG advisory teams to prioritise disclosure investments and set measurable ESG rating improvement targets.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEFAULTS`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalW` | `s.issues.reduce((x, i) => x + i.weight, 0) \|\| 1;` |
| `currentScoreRaw` | `s.issues.reduce((x, i) => x + i.current * i.weight, 0) / totalW;` |
| `peerScore` | `s.issues.reduce((x, i) => x + i.peer * i.weight, 0) / totalW;` |
| `currentScore` | `Math.max(0, Math.min(100, currentScoreRaw + controvAdj));` |
| `gap` | `peerScore - currentScore;` |
| `plan` | `useMemo(() => [...s.actions].map(a => ({ ...a, roi: a.costMn > 0 ? a.uplift / a.costMn : 0 })).sort((a, b) => b.roi - a.roi), [s.actions]);` |
| `totalUplift` | `plan.reduce((x, a) => x + a.uplift, 0) * (totalW > 0 ? 15 / totalW : 0);` |
| `projectedScore` | `Math.min(100, currentScore + totalUplift);` |
| `totalCost` | `plan.reduce((x, a) => x + a.costMn, 0);` |
| `agencyCurrent` | `useMemo(() => Object.keys(AGENCY_CROSSWALK).reduce((x, ag) => {` |
| `agencyProjected` | `useMemo(() => Object.keys(AGENCY_CROSSWALK).reduce((x, ag) => {` |
| `MSCI_ORDER` | `AGENCY_CROSSWALK.MSCI.map(b => b[2]);` |
| `uplifts` | `Math.max(0, projMsciIdx - curMsciIdx);` |
| `actionNames` | `s.actions.map(a => a.action);` |
| `indexElig` | `useMemo(() => Object.entries(INDEX_ELIGIBILITY).map(([name, cfg]) => {` |
| `unlock` | `projEligible && !curEligible ? s.aumPassive * (cfg.flowPctPerNotch / 100) * 3 : (projEligible ? s.aumPassive * (cfg.flowPctPerNotch / 100) * uplifts :` |
| `totalIndexUnlock` | `indexElig.reduce((x, r) => x + r.unlock, 0);` |
| `percentile` | `Math.round(Math.max(0, Math.min(100, 50 + (currentScore - sectorMedian) * 2)));` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/esg-ratings/esra-compliance` | `esra_compliance_endpoint` | api/v1/routes/esg_ratings.py |
| POST | `/api/v1/esg-ratings/divergence-analysis` | `divergence_analysis_endpoint` | api/v1/routes/esg_ratings.py |
| POST | `/api/v1/esg-ratings/bias-detection` | `bias_detection_endpoint` | api/v1/routes/esg_ratings.py |
| POST | `/api/v1/esg-ratings/composite-rating` | `composite_rating_endpoint` | api/v1/routes/esg_ratings.py |
| POST | `/api/v1/esg-ratings/e-pillar-divergence` | `e_pillar_divergence_endpoint` | api/v1/routes/esg_ratings.py |
| POST | `/api/v1/esg-ratings/peer-benchmark` | `peer_benchmark_endpoint` | api/v1/routes/esg_ratings.py |
| POST | `/api/v1/esg-ratings/divergence-report` | `divergence_report_endpoint` | api/v1/routes/esg_ratings.py |
| GET | `/api/v1/esg-ratings/ref/esra-requirements` | `get_esra_requirements` | api/v1/routes/esg_ratings.py |
| GET | `/api/v1/esg-ratings/ref/provider-methodologies` | `get_provider_methodologies` | api/v1/routes/esg_ratings.py |
| GET | `/api/v1/esg-ratings/ref/divergence-research` | `get_divergence_research` | api/v1/routes/esg_ratings.py |

### 2.3 Engine `esg_ratings_engine` (services/esg_ratings_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | val, lo, hi |  |
| `_round` | val, digits |  |
| `_normalise_score` | provider, raw_score | Normalise provider score to 0-100 scale (higher = better). |
| `_composite_rating` | score |  |
| `assess_esra_compliance` | entity_id, provider_name, methodology_published, conflict_mgmt, regulatory_supervised, requirement_status |  |
| `analyse_rating_divergence` | entity_id, ratings, provider_correlations |  |
| `detect_rating_bias` | entity_id, scores, entity_size, region, sector, reporting_bias_adjustment |  |
| `compute_composite_rating` | entity_id, provider_scores, methodology, provider_market_weights |  |
| `assess_e_pillar_divergence` | entity_id, scores_by_pillar |  |
| `benchmark_against_peers` | entity_id, sector, composite_score, n_peers, peer_scores |  |
| `generate_divergence_report` | entity_id, entity_name, sector, ratings, peer_scores |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `Berg` *(shared)*, `ancillary` *(shared)*, `disclosure` *(shared)*, `fastapi` *(shared)*, `multiple` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Score Gap vs Peer Median | `company_score − GICS_sector_peer_median` | MSCI/Sustainalytics/CDP benchmarks | Negative values indicate underperformance vs sector peers; gaps >15 pts signal material rating risk. |
| Achievable Uplift Score | `Σ(weight_i × max_disclosure_gain_i)` | Provider methodology weights | Maximum score improvement achievable through disclosure gap closure alone, without operational change; sets re |
| Provider Divergence Index | `1 − avg(Spearman ρ across provider pairs)` | Cross-provider rating comparison | Higher values indicate greater inter-provider disagreement; >0.5 suggests the company sits in contested scorin |
- **MSCI/Sustainalytics/CDP/ISS score feeds → company ESG scores** → Peer group median calculation → gap decomposition → uplift weighting → **Prioritised ESG improvement roadmap with estimated score impact per action**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/esg-ratings/ref/divergence-research** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['primary_study', 'key_finding', 'divergence_sources', 'esra_impact', 'additional_studies'], 'n_keys': 5}`

**GET /api/v1/esg-ratings/ref/esra-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'regulator', 'entry_into_force', 'authorisation_deadline', 'scope', 'requirements'], 'n_keys': 6}`

**GET /api/v1/esg-ratings/ref/provider-methodologies** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'providers'], 'n_keys': 2}`

**POST /api/v1/esg-ratings/bias-detection** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/esg-ratings/composite-rating** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Score Gap Decomposition & Uplift Modelling
**Headline formula:** `uplift = Σ(weight_i × disclosure_gap_i) + Σ(weight_j × controversy_discount_j)`
**Standards:** ['MSCI ESG Ratings Methodology 2024', 'Sustainalytics ESG Risk Rating Framework', 'Berg et al. (2022) Aggregate Confusion']

**Engine `esg_ratings_engine` — extracted transformation lines:**
```python
norm = (raw_score - lo) / (hi - lo) * 100
norm = 100 - norm
compliance_score = _round(weighted_score / assessable_weight, 1) if assessable_weight > 0 else None
ci_half_width = 1.96 * (divergence_score / math.sqrt(len(scores))) if scores else 10.0
REPORTING_BIAS_MODEL_CONSTANT = -2.5  # midpoint of Berg et al. (2022) -4.0..-1.0 range
bias_adjusted_score = _round(_clamp(raw_composite + total_adjustment), 1)
weights = {p: _round(1.0 / n, 4) for p in providers} if n else {}
weights = {p: _round(usable[p] / total, 4) for p in providers}
weights = {p: _round(1.0 / n, 4) for p in providers} if n else {}
each = remaining / len(non_spec) if non_spec else 0
weights = {p: _round(1.0 / n, 4) for p in providers} if n else {}
rank = sum(1 for s in clean_peers if s < entity_score) + 1
percentile = _round(rank / (actual_n + 1) * 100, 1)
p75_idx = min(actual_n - 1, int(actual_n * 0.75))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **2** other module(s).
**Shared engines (edits propagate!):** `esg_ratings_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `esg-ratings-hub` | engine:esg_ratings_engine, table:Berg, table:ancillary, table:disclosure, table:multiple |
| `esg-ratings-comparator` | engine:esg_ratings_engine, table:Berg, table:ancillary, table:disclosure, table:multiple |
**Shared UI wrappers:** `AdvisoryReference`, `AdvisoryToolkit`