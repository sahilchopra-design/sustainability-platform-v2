# ESG Ratings Hub
**Module ID:** `esg-ratings-hub` · **Route:** `/esg-ratings-hub` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Centralised management platform for ESG rating data across all asset classes, maintaining full rating history, peer comparisons, and provider change logs. Provides workflow tools for internal ESG rating committees, override documentation, and rating committee pack generation. Integrates with portfolio management systems, risk engines, and client reporting platforms as the authoritative ESG data master record.

> **Business value:** Serves as the single source of ESG rating truth for the entire investment organisation, ensuring consistent data governance, full audit trails for regulatory inspection, and efficient rating committee workflows that scale across large issuer universes.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AGREEMENT_TREND`, `ALERT_TYPES`, `COLORS`, `COMPANIES`, `COMPANY_NAMES`, `CONTROVERSIES`, `INIT_ALERTS`, `PROVIDERS`, `PROV_COLORS`, `Pill`, `QUARTERS`, `RATING_SCALE`, `SECTORS`, `SEVERITY_TIERS`, `SUB_MODULES`, `SevPill`, `TICKERS`, `TabBoardReport`, `TabConsensus`, `TabCoverage`, `TabExecutive`, `Toggle`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sect` | `SECTORS[Math.floor(sr(i*7)*SECTORS.length)];` |
| `numScores` | `PROVIDERS.map((_,pi)=>ratings[PROVIDERS[pi]]?RATING_SCALE.indexOf(ratings[PROVIDERS[pi]]):null).filter(v=>v!==null);` |
| `avgNum` | `numScores.length?numScores.reduce((a,b)=>a+b,0)/numScores.length:3;` |
| `maxDiv` | `numScores.length>1?Math.max(...numScores)-Math.min(...numScores):0;` |
| `history` | `QUARTERS.map((q,qi)=>{` |
| `base` | `avgNum+sr(i*200+qi*11)*1.5-0.75;` |
| `lastQ` | `history.length>1?history[history.length-1].score-history[history.length-2].score:0;` |
| `prov` | `PROVIDERS[Math.floor(sr(i*456)*PROVIDERS.length)];` |
| `AGREEMENT_TREND` | `QUARTERS.map((q,qi)=>{` |
| `base` | `62+sr(qi*17)*15;` |
| `avgR` | `active.reduce((a,c)=>a+c.avgScore,0)/n;` |
| `maxDiv` | `active.length?Math.max(...active.map(c=>c.maxDivergence)):0;` |
| `cov` | `active.filter(c=>c.coverage>=3).length/n*100;` |
| `integrity` | `+(100-maxDiv*8-gw*2).toFixed(1);` |
| `contExp` | `active.reduce((a,c)=>a+c.controversies,0);` |
| `firstMover` | `Object.entries(provScores).sort((a,b)=>b[1]-a[1])[0]?.[0]\|\|'MSCI';` |
| `topDiv` | `useMemo(()=>[...COMPANIES].sort((a,b)=>divDir?b[divSort]-a[divSort]:a[divSort]-b[divSort]).slice(0,10),[divSort,divDir]);` |
| `providerRadar` | `useMemo(()=>PROVIDERS.map(p=>{` |

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
**Frontend seed datasets:** `ALERT_TYPES`, `COLORS`, `COMPANY_NAMES`, `PROVIDERS`, `QUARTERS`, `RATING_SCALE`, `REPORT_SECTIONS`, `SECTORS`, `SEVERITY_TIERS`, `SUB_MODULES`, `TABS`, `TICKERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Internal Composite Rating (0â€“100) | — | ESG Ratings Hub | Master ESG score after provider blend and approved analyst overlay; sole authoritative source for downstream s |
| Rating Drift (12m change) | — | Historical Rating DB | Year-on-year change in ICR; large positive or negative drift triggers rating committee review obligation. |
| Override Frequency (%) | — | Internal Governance | Proportion of ratings with analyst overlay active; excessive override rate may indicate provider data quality  |
| Peer Percentile Rank (%) | — | Sector Peer Group | Issuer ICR rank within GICS sub-industry peer group; primary relative comparison metric for client reporting. |
- **External ESG provider feeds (MSCI, Sustainalytics, ISS, Bloomberg, Refinitiv)** → Daily ingest; normalise, timestamp, and store in immutable rating history table with source audit trail → **Provider score history per issuer with PIT reconstruction capability**
- **Analyst override submissions (rationale text, evidence attachments)** → Store in structured override log with reviewer, approval date, and expiry; compute ICR post-overlay → **ICR with overlay audit trail and committee approval record**
- **Portfolio management system (holdings and mandates)** → Push ICR and peer percentile to PM system via certified API; flag covenant breaches (ICR below mandate minimum) → **Daily ICR feed to downstream systems with change alerts**

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
**Methodology:** Internal Composite ESG Rating
**Headline formula:** `ICR = Σ(w_p × Provider_p) + Δ_analyst`
**Standards:** ['ESMA ESG Ratings Regulation 2024', 'PRI Reporting Framework 2023', 'FCA ESG Ratings Code 2023']

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
| `esg-ratings-comparator` | engine:esg_ratings_engine, table:Berg, table:ancillary, table:disclosure, table:multiple |