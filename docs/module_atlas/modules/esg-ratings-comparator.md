# ESG Ratings Comparator
**Module ID:** `esg-ratings-comparator` · **Route:** `/esg-ratings-comparator` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Enables systematic cross-provider ESG rating comparison across MSCI, Sustainalytics, ISS, Bloomberg, and Refinitiv for individual issuers and portfolio universes. Quantifies inter-provider rating disagreement, identifies divergence drivers, and produces consensus scores with confidence intervals. Informs provider selection, due diligence processes, and client disclosure on data sources used for ESG integration.

> **Business value:** Provides investors with an objective, multi-provider lens on ESG quality that reduces single-provider dependency, improves rating confidence for high-divergence issuers, and satisfies regulatory requirements to disclose ESG data sources and methodological limitations.

**How an analyst works this module:**
- Search for issuer by name or ISIN and load all available provider ESG ratings.
- Review consensus score, divergence index, and pillar-level heatmap showing agreement and disagreement by E, S, G dimension.
- Drill into divergence diagnosis: scope differences, measurement approach, or weighting â€” using the Berg et al. framework.
- Export provider comparison matrix for investment committee ESG data source disclosure or manager selection due diligence.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `API`, `CDP_LEVELS`, `COMPANIES`, `CONTROVERSIES`, `COUNTRIES`, `ESG_COVERAGE`, `KPI`, `METHODOLOGY_DATA`, `MSCI_LEVELS`, `PAGE_SIZE`, `PCOLORS`, `PIECLRS`, `PROVIDERS`, `RATINGS_API`, `SECTORS`, `SectionHead`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `RATINGS_API` | ``${API}/api/v1/esg-ratings`;` |
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.crea` |
| `CDP_LEVELS` | `['A','A-','B','B-','C','C-','D','D-'];` |
| `msciIdx` | `Math.max(0,Math.min(6,Math.round((100-msciRaw)/100*6)));` |
| `sustVal` | `Math.max(5,Math.min(90,Math.round(100-sustRaw)));` |
| `issVal` | `+(Math.max(1,Math.min(10,(100-issRaw)/100*9+1)).toFixed(1));` |
| `cdpIdx` | `Math.max(0,Math.min(7,Math.round((100-cdpRaw)/100*7)));` |
| `drift` | `sr(i*100+q*17);` |
| `consensus` | `Math.round((msciNum+sustNorm+issNorm+cdpNum+spVal+bbgVal)/6);` |
| `diverg` | `Math.round(Math.max(msciNum,sustNorm,issNorm,cdpNum,spVal,bbgVal)-Math.min(msciNum,sustNorm,issNorm,cdpNum,spVal,bbgVal));` |
| `ESG_COVERAGE` | `getCoverageStats(COMPANIES.map(c=>c.ticker));` |
| `types` | `['Environmental Incident','Labor Rights Violation','Data Privacy Breach','Corruption/Bribery','Product Safety','Tax Avoidance','Human Rights','Supply Chain','Governance Failure','Greenwashing'];` |
| `coIdx` | `Math.floor(sr(seed)*COMPANIES.length);` |
| `paged` | `filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE_SIZE);` |
| `avgConsensus` | `Math.round(COMPANIES.reduce((s,c)=>s+c.consensus,0)/COMPANIES.length);` |
| `avgDivergence` | `Math.round(COMPANIES.reduce((s,c)=>s+c.divergence,0)/COMPANIES.length);` |
| `matrix` | `provKeys.map(p1=>({provider:p1.l,...Object.fromEntries(provKeys.map(p2=>[p2.l,corr(p1.k,p2.k)]))}));` |
| `divBuckets` | `[{range:'0-10',count:0},{range:'10-20',count:0},{range:'20-30',count:0},{range:'30-40',count:0},{range:'40-50',count:0},{range:'50+',count:0}];` |
| `avgDiv` | `Math.round(COMPANIES.reduce((s,c)=>{` |
| `biasData` | `sectors.map(sec=>{` |
| `avgs` | `provKeys.map(k=>Math.round(cos.reduce((s,c)=>s+c[k],0)/cos.length));` |
| `overallAvg` | `Math.round(avgs.reduce((s,v)=>s+v,0)/6);` |
| `zScoreData` | `biasData.map(s=>{` |
| `stdDev` | `Math.sqrt(vals.reduce((sum,v)=>sum+(v-mean)**2,0)/vals.length)\|\|1;` |
| `wSum` | `portWeights.reduce((s,w)=>s+w,0);` |
| `portAvg` | `portCos.length?Math.round(portCos.reduce((s,c)=>s+wgtConsensus(c),0)/portCos.length):0;` |
| `sevDist` | `{};CONTROVERSIES.forEach(c=>{sevDist[c.severity]=(sevDist[c.severity]\|\|0)+1;});` |
| `typeDist` | `{};CONTROVERSIES.forEach(c=>{typeDist[c.type]=(typeDist[c.type]\|\|0)+1;});` |
| `leadLag` | `PROVIDERS.map(p=>({provider:p,avgDays:Math.round(CONTROVERSIES.reduce((s,c)=>s+c.leadLagDays*(0.5+sr(PROVIDERS.indexOf(p)*31)*1),0)/CONTROVERSIES.length)}));` |
| `scores` | `[Math.round(40+sr(i*73)*55),Math.round(50+sr(i*79)*45),Math.round(30+sr(i*83)*60),Math.round(35+sr(i*89)*55),Math.round(45+sr(i*97)*50)];` |
| `overall` | `Math.round(scores.reduce((s,v)=>s+v,0)/scores.length);` |

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
| `detect_rating_bias` | entity_id, scores, entity_size, region, sector, reporting_bias_adjustment, peer_stats |  |
| `compute_composite_rating` | entity_id, provider_scores, methodology, provider_market_weights |  |
| `assess_e_pillar_divergence` | entity_id, scores_by_pillar |  |
| `benchmark_against_peers` | entity_id, sector, composite_score, n_peers, peer_scores |  |
| `generate_divergence_report` | entity_id, entity_name, sector, ratings, peer_scores |  |

**Engine `esg_ratings_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `ESRA_REQUIREMENTS` | `[{'id': 'R01', 'category': 'governance', 'requirement': 'Separation of ancillary services from ratings', 'weight': 0.15}, {'id': 'R02', 'category': 'methodology', 'requirement': 'Methodology publication and transparency', 'weight': 0.15}, {'id': 'R03', 'category': 'data_sources', 'requirement': 'Dat` |
| `PROVIDER_SCALE_NORMALISATION` | `{'msci': {'min': 0, 'max': 100, 'direction': 'higher_better'}, 'sustainalytics': {'min': 0, 'max': 50, 'direction': 'lower_better'}, 'sp': {'min': 0, 'max': 100, 'direction': 'higher_better'}, 'bloomberg': {'min': 0, 'max': 100, 'direction': 'higher_better'}, 'refinitiv': {'min': 0, 'max': 100, 'dir` |
| `COMPOSITE_RATING_THRESHOLDS` | `[(85, 'AAA'), (75, 'AA'), (65, 'A'), (55, 'BBB'), (45, 'BB'), (35, 'B'), (0, 'CCC')]` |
| `SECTOR_PEER_DISTRIBUTION` | `{'oil_gas': {'mean': 45, 'std': 18}, 'utilities': {'mean': 52, 'std': 16}, 'mining': {'mean': 42, 'std': 20}, 'finance': {'mean': 60, 'std': 15}, 'technology': {'mean': 65, 'std': 14}, 'healthcare': {'mean': 58, 'std': 16}, 'retail': {'mean': 55, 'std': 17}, 'manufacturing': {'mean': 48, 'std': 18},` |
| `E_PILLAR_SUBPILLARS` | `['carbon_E1', 'water_E2', 'biodiversity_E3', 'waste_E4', 'energy_E5']` |
| `SIZE_BIAS_ADJUSTMENTS` | `{'large': -3.0, 'mid': 0.0, 'small': +4.0, 'micro': +7.0}` |
| `REGION_BIAS_ADJUSTMENTS` | `{'western_europe': -2.0, 'north_america': -1.5, 'asia_pacific': +2.5, 'emerging_markets': +5.0, 'other': +3.0}` |
| `SECTOR_BIAS_ADJUSTMENTS` | `{'services': -3.0, 'manufacturing': +2.5, 'extractives': +4.0, 'finance': -1.0, 'technology': -2.5, 'other': 0.0}` |

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
| Divergence Index (CoV) | — | Berg et al. Framework | Coefficient of variation across providers; above 0.25 indicates high disagreement warranting manual analyst override. |
| Score Range (max−min) | — | Provider Database | Difference between highest and lowest provider score for issuer; context metric for rating disagreement magnitude. |
| Provider Coverage Count (1â€“5) | — | ESG Data Vendors | Number of providers rating the issuer; partial coverage is itself a data quality risk signal, especially for EM issuers. |
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

**POST /api/v1/esg-ratings/divergence-analysis** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['normalised_scores', 'divergence_score', 'divergence_sources', 'correlation_matrix', 'correlation_data_available', 'consensus_rating', 'average_normalised_score', 'confidence_interval', 'missing_scores'], 'n_keys': 9}`

**POST /api/v1/esg-ratings/divergence-report** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/esg-ratings/e-pillar-divergence** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Inter-Provider Divergence Index
**Headline formula:** `DI = σ(Score_1, Score_2, ..., Score_N) / μ(Score_1, ..., Score_N)`

Coefficient of variation across normalised provider scores measures rating disagreement. High DI (>0.25) indicates material provider disagreement requiring analyst review rather than mechanical reliance on any single provider. Berg et al. attribute divergence to scope, measurement, and weight differences; the comparator diagnoses the dominant divergence source for each issuer.

**Standards:** ['Berg et al. â€” Aggregate Confusion 2022', 'ESMA ESG Ratings Regulatory Consultation 2023', 'FCA ESG Data and Ratings Code 2023']
**Reference documents:** Berg, Koelbel & Rigobon â€” Aggregate Confusion: The Divergence of ESG Ratings (2022); ESMA Consultation on ESG Ratings Regulation 2023; FCA ESG Data and Ratings Code of Conduct 2023; Chatterji et al. â€” Do Ratings of Firms Converge? (2016); IOSCO Report on ESG Ratings and Data Providers 2021

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
gap_to_median = _round(sector_median - entity_score, 1)
gap_to_leader = _round(sector_leader - entity_score, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **3** other module(s).
**Shared engines (edits propagate!):** `esg_ratings_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `esg-ratings-uplift` | engine:esg_ratings_engine, table:Berg, table:ancillary, table:disclosure, table:multiple |
| `esg-ratings-hub` | engine:esg_ratings_engine, table:Berg, table:ancillary, table:disclosure, table:multiple |
| `credit-spread-climate-monitor` | table:multiple |

## 7 · Methodology Deep Dive

This tier-A module is stronger than most: it decodes **six real ESG-rating provider methodologies**
(MSCI IVA, Sustainalytics ESG Risk, ISS QualityScore, CDP, S&P Global CSA, Bloomberg) with accurate
scales, normalisation rules, pillar weights and coverage, and runs a genuine cross-provider divergence
+ Pearson-correlation analysis over a real security universe. The scores use `getEsgRatings` which
**prefers real EODHD ESG data**, falling back to `sr()` seeds. A backend (`esg_ratings_engine.py`)
implements an even more rigorous divergence model (Berg-et-al decomposition, honest missing-score
handling) but the frontend does **not** call it (0 axios/fetch). One caveat below on the divergence
metric.

> ⚠️ **Metric note (not a full mismatch).** The guide's **Inter-Provider Divergence Index** is a
> *coefficient of variation* `DI = σ(scores)/μ(scores)`. The frontend computes divergence as a simple
> **range** `max − min` of the six normalised scores, not the CV. The backend `analyse_rating_divergence`
> uses the correct **standard deviation** (`statistics.stdev`) with a Berg-et-al 56/23/21 scope/weight/
> measurement decomposition — so the *rigorous* metric exists server-side but the rendered page shows
> the cruder range.

### 7.1 What the module computes

Per company (from the real security universe, first 150 equities):

```js
realRatings = getEsgRatings(ticker, sector, i)      // real EODHD if available, else sr() seed
// normalise back to provider-native scales for display, then:
consensus  = round( (msci + sust + iss + cdp + sp + bbg) / 6 )     // 6-provider mean, 0–100
divergence = round( max(scores) − min(scores) )                    // RANGE (not CV, not σ)
// quarterly history: 12 quarters of deterministic drift from the base score
```

Portfolio KPIs: `avgConsensus`, `avgDivergence`, `highDiv = #(divergence>40)`.
Correlation tab: pairwise Pearson `ρ = cov / √(var₁·var₂)` across companies for each provider pair.
Sector-bias tab: per-sector mean and `stdDev = √(Σ(v−mean)²/n)` of provider scores.

### 7.2 Parameterisation — real provider methodology reference

`METHODOLOGY_DATA` is accurate, curated reference content:

| Provider | Scale | Normalisation | Key issues | Pillar weights |
|---|---|---|---|---|
| MSCI IVA | AAA–CCC (7-pt) | 14.3–100 linear | 35 per GICS sub-industry | E .33 / S .33 / G .34 |
| Sustainalytics | 0–100 (lower=better) | `100 − raw` | 20 MEIs | Exposure .5 / Mgmt .5 |
| ISS QualityScore | 1–10 decile (1=best) | `(10−raw)/9×100` | 16 themes | E .30 / S .30 / G .40 |
| CDP | A…D- (8-pt) | `(8−idx)/7×100` | 11 | Disclosure/Aware/Mgmt/Lead |
| S&P Global CSA | 0–100 | direct | 61 criteria | E .30 / S .30 / G&E .40 |
| Bloomberg | 0–100 | direct | disclosure completeness | — |

These normalisation formulas are **correct and provider-authentic** (e.g. Sustainalytics is an
inverted *risk* score, so higher-is-better requires `100 − raw`; ISS is a 1=best decile). This is the
module's most valuable content.

### 7.3 Calculation walkthrough

1. Build 150 companies from `SECURITY_UNIVERSE`; each score via `getEsgRatings` (real→seed fallback).
2. Convert normalised 0–100 back to each provider's native display scale (MSCI letter, ISS 1–10, etc.).
3. `consensus` = mean of six normalised scores; `divergence` = max−min range.
4. Correlation tab: Pearson ρ across the company panel for each provider pair (this is a *genuine*
   cross-sectional correlation — the correct way to measure provider agreement).
5. Sector-bias tab: mean ± stdev of scores by sector; Portfolio Lab: weighted consensus + divergence
   alerts above a user threshold.

### 7.4 Worked example — a company with six scores

Normalised scores `MSCI 72, Sustainalytics 68, ISS 55, CDP 80, S&P 74, Bloomberg 61`:
`consensus = round((72+68+55+80+74+61)/6) = round(68.3) = 68`; `divergence = 80 − 55 = 25` (amber
band, "material disagreement"). The guide's CV would instead be `σ/μ`: `σ ≈ 8.5`, `μ = 68.3`, `CV ≈
0.125` — a different (dimensionless) figure. The backend would report `σ ≈ 8.5` and split it 56/23/21
into scope (4.8) / weight (2.0) / measurement (1.8) per Berg et al.

### 7.5 Data provenance & limitations

- **Scores prefer real EODHD ESG data**, `sr()`-seeded only as fallback — better provenance than most
  ESG modules. Quarterly history is deterministic drift (`sr()`-jittered).
- **Provider methodology descriptions are accurate real reference content.**
- Divergence = range (max−min) is cruder than the guide's CV or the backend's σ; a single outlier
  provider dominates it.
- The rigorous backend (`esg_ratings_engine.py`: stdev, Berg decomposition, honest missing scores,
  bias detection) is **not wired** to the frontend.

**Framework alignment:** the six providers are decoded faithfully — **MSCI ESG Ratings** (exposure×
management across 35 industry key issues, controversies as deduction, AAA–CCC), **Sustainalytics ESG
Risk Rating** (unmanaged-risk = exposure − management, 0–100 lower-better), **ISS QualityScore**
(governance-heavy decile ranking), **CDP** (4-level disclosure/awareness/management/leadership),
**S&P CSA** (61 criteria, DJSI selection), **Bloomberg** (disclosure-completeness). The divergence
analysis reflects the **Berg, Kölbel & Rigobon (2022) "Aggregate Confusion"** finding that ESG-rating
disagreement decomposes ~56% scope / ~23% weight / ~21% measurement — implemented exactly in the
backend.

### 8 · Model Specification

**Status: specification — not yet implemented in the rendered UI** (backend implements the rigorous
version; frontend uses range + seed fallback).

**8.1 Purpose & scope.** Quantify inter-provider ESG-rating disagreement per issuer, decompose its
sources, and flag issuers where mechanical single-provider reliance is unsafe.

**8.2 Conceptual approach.** Coefficient-of-variation / standard-deviation divergence on normalised
scores, with **Berg-et-al scope/weight/measurement decomposition** and cross-sectional Pearson
correlation for provider agreement — the industry-standard "aggregate confusion" framework.

**8.3 Mathematical specification.**
- Normalise each provider to 0–100 higher-better via its published scale (table §7.2).
- Divergence: `DI_i = σ(scores_i)/μ(scores_i)` (CV) or `σ(scores_i)` (absolute); flag `DI>0.25`.
- Source split: `σ_scope = 0.56σ`, `σ_weight = 0.23σ`, `σ_meas = 0.21σ`.
- Consensus: `μ_i`; 95% CI `μ_i ± 1.96·σ_i/√n`.
- Provider agreement: `ρ_{pq} = corr(score_p, score_q)` across the issuer panel.

| Parameter | Source |
|---|---|
| Normalisation scales | provider methodology docs (METHODOLOGY_DATA) |
| Decomposition 56/23/21 | Berg, Kölbel & Rigobon (2022) |
| Divergence flag 0.25 | guide threshold |
| Panel for ρ | cross-issuer score matrix |

**8.4 Data requirements.** ≥2 provider raw scores per issuer (EODHD partially supplies), issuer→GICS,
a multi-issuer panel for correlations. Backend already ingests these.

**8.5 Validation & benchmarking plan.** Reconcile ρ against published provider-correlation studies
(~0.4–0.6); verify decomposition sums to σ; sensitivity of consensus to provider inclusion.

**8.6 Limitations & model risk.** Normalisation across ordinal (letter/decile) and cardinal scales is
lossy; missing providers bias μ/σ; CV unstable when μ→0; single-snapshot correlation is undefined
(needs the panel).

## 9 · Future Evolution

### 9.1 Evolution A — Feed the divergence engine real provider ratings (analytics ladder: rung 2 → 3)

**What.** The backend is a legitimate divergence vertical: `esg_ratings_engine` normalizes provider scales (MSCI letters, Sustainalytics inverted risk scores, ISS 1–10, CDP bands → common 0–100), analyzes divergence per the Berg et al. framework, detects size/region/sector bias, computes weighted composites, and generates divergence reports across 10 endpoints with ESRA-compliance assessment — methodologically the most literate ratings module on the platform. But the page feeds it synthetic inputs: company provider scores derive from seeded raws with `sr()` drift, controversies are generated, and the provider lead-lag analysis multiplies by `sr()` factors. The engine is real; its diet is fabricated.

**How.** (1) The `esg_score_history` store from `esg-momentum-scanner`'s Evolution A is the shared fix — persisted per-provider ratings with dates, from licensed feeds plus public sources (CDP scores are public; Refinitiv/S&P have free tiers for some universes). The engine's honest design (caller-supplied `ratings` dicts) means zero engine changes — only real callers. (2) Provider correlation inputs to `analyse_rating_divergence` become computed from the stored panel rather than assumed. (3) Rung 3: validate the computed cross-provider correlations against the published Berg et al. "Aggregate Confusion" benchmarks (~0.38–0.71 pairwise) — the module cites this research; now it can reproduce the finding on its own panel. (4) The seeded controversy/lead-lag tab either binds to `esg-controversy`'s incident store or is cut.

**Prerequisites.** Provider licensing decisions (the honest floor: CDP-only plus one licensed feed still permits two-provider divergence); scale-normalization pins in `bench_quant.py` (the letter-grade mappings are exactly the kind of arithmetic that silently drifts). **Acceptance:** a real issuer's divergence index computes from stored provider rows; the panel's pairwise correlations are published beside the Berg et al. benchmarks; zero `sr()` in scores.

### 9.2 Evolution B — Divergence-diagnosis copilot for manager selection and disclosure (LLM tier 2)

**What.** The module's analytical crown — diagnosing *why* providers disagree (scope vs measurement vs weighting, per Berg et al.) — is where an LLM adds real value: "MSCI has them AA, Sustainalytics high-risk — diagnose it." The copilot pulls the engine's divergence analysis and pillar decomposition (`assess_e_pillar_divergence`), maps the disagreement to the methodology differences documented in `ref/provider-methodologies`, and drafts the data-source disclosure paragraph regulators increasingly require — every score and correlation from tool output, every methodology claim from the ref data.

**How.** Tools: the module's 10 existing endpoints (Pydantic-typed, tier-2-ready today). Grounding corpus = this Atlas record's §2.3 plus `ref/divergence-research` (the engine ships its own literature summary — rare and useful). Diagnosis discipline: the copilot must attribute divergence to a named methodological difference from the ref data or say "driver unidentified — flag for manual review"; the Berg taxonomy is a classification, not a license to speculate. ESRA-compliance answers quote `ref/esra-requirements` verbatim.

**Prerequisites (hard).** Evolution A — diagnosing divergence between seeded scores explains noise; and the copilot must display each rating's as-of date (stale-rating comparisons are the field's classic error). **Acceptance:** a golden issuer's diagnosis cites only ref-data methodology differences; all numerics match endpoint outputs; two-provider cases produce narrower claims than six-provider cases, reflecting the engine's own confidence fields.