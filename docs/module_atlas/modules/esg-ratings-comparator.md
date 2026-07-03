# ESG Ratings Comparator
**Module ID:** `esg-ratings-comparator` · **Route:** `/esg-ratings-comparator` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Enables systematic cross-provider ESG rating comparison across MSCI, Sustainalytics, ISS, Bloomberg, and Refinitiv for individual issuers and portfolio universes. Quantifies inter-provider rating disagreement, identifies divergence drivers, and produces consensus scores with confidence intervals. Informs provider selection, due diligence processes, and client disclosure on data sources used for ESG integration.

> **Business value:** Provides investors with an objective, multi-provider lens on ESG quality that reduces single-provider dependency, improves rating confidence for high-divergence issuers, and satisfies regulatory requirements to disclose ESG data sources and methodological limitations.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `CDP_LEVELS`, `COMPANIES`, `CONTROVERSIES`, `COUNTRIES`, `ESG_COVERAGE`, `KPI`, `METHODOLOGY_DATA`, `MSCI_LEVELS`, `PAGE_SIZE`, `PCOLORS`, `PIECLRS`, `PROVIDERS`, `SECTORS`, `SectionHead`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))]` |
| `CDP_LEVELS` | `['A','A-','B','B-','C','C-','D','D-'];` |
| `msciIdx` | `Math.max(0,Math.min(6,Math.round((100-msciRaw)/100*6)));` |
| `sustVal` | `Math.max(5,Math.min(90,Math.round(100-sustRaw)));` |
| `issVal` | `+(Math.max(1,Math.min(10,(100-issRaw)/100*9+1)).toFixed(1));` |
| `cdpIdx` | `Math.max(0,Math.min(7,Math.round((100-cdpRaw)/100*7)));` |
| `drift` | `sr(i*100+q*17);` |
| `consensus` | `Math.round((msciNum+sustNorm+issNorm+cdpNum+spVal+bbgVal)/6);` |
| `diverg` | `Math.round(Math.max(msciNum,sustNorm,issNorm,cdpNum,spVal,bbgVal)-Math.min(msciNum,sustNorm,issNorm,cdpNum,spVal,bbgVal));` |
| `ESG_COVERAGE` | `getCoverageStats(COMPANIES.map(c=>c.ticker));` |
| `types` | `['Environmental Incident','Labor Rights Violation','Data Privacy Breach','Corruption/Bribery','Product Safety','Tax Avoidance','Human Rights','Supply ` |
| `coIdx` | `Math.floor(sr(seed)*COMPANIES.length);` |
| `paged` | `filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE_SIZE);` |
| `avgConsensus` | `Math.round(COMPANIES.reduce((s,c)=>s+c.consensus,0)/COMPANIES.length);` |
| `avgDivergence` | `Math.round(COMPANIES.reduce((s,c)=>s+c.divergence,0)/COMPANIES.length);` |
| `matrix` | `provKeys.map(p1=>({provider:p1.l,...Object.fromEntries(provKeys.map(p2=>[p2.l,corr(p1.k,p2.k)]))}));` |

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
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `Berg` *(shared)*, `ancillary` *(shared)*, `disclosure` *(shared)*, `fastapi` *(shared)*, `multiple` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CDP_LEVELS`, `COUNTRIES`, `MSCI_LEVELS`, `PCOLORS`, `PIECLRS`, `PROVIDERS`, `SECTORS`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Consensus ESG Score (0â€“100) | — | Equal-Weighted Blend | Equal-weighted average of all available provider scores on common 0â€“100 scale; primary summary metric. |
| Divergence Index (CoV) | — | Berg et al. Framework | Coefficient of variation across providers; above 0.25 indicates high disagreement warranting manual analyst ov |
| Score Range (max−min) | — | Provider Database | Difference between highest and lowest provider score for issuer; context metric for rating disagreement magnit |
| Provider Coverage Count (1â€“5) | — | ESG Data Vendors | Number of providers rating the issuer; partial coverage is itself a data quality risk signal, especially for E |
- **MSCI, Sustainalytics, ISS, Bloomberg, Refinitiv ESG rating feeds** → Normalise all provider scores to common 0â€“100 scale using linear mapping; align on common ISIN universe → **Provider-normalised score matrix per issuer**
- **Pillar-level sub-scores from each provider** → Decompose overall divergence into E, S, G pillar contributions using variance decomposition → **Divergence diagnosis by pillar (scope vs. measurement vs. weight)**
- **Coverage universe metadata (provider, date, rating methodology version)** → Flag stale ratings >12 months; calculate coverage completeness by region and sector → **Coverage quality score and staleness flags per issuer**

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
**Methodology:** Inter-Provider Divergence Index
**Headline formula:** `DI = σ(Score_1, Score_2, ..., Score_N) / μ(Score_1, ..., Score_N)`
**Standards:** ['Berg et al. â€” Aggregate Confusion 2022', 'ESMA ESG Ratings Regulatory Consultation 2023', 'FCA ESG Data and Ratings Code 2023']

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
| `esg-ratings-uplift` | engine:esg_ratings_engine, table:Berg, table:ancillary, table:disclosure, table:multiple |
| `esg-ratings-hub` | engine:esg_ratings_engine, table:Berg, table:ancillary, table:disclosure, table:multiple |