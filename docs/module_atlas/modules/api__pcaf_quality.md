# Api::Pcaf_Quality
**Module ID:** `api::pcaf_quality` · **Route:** `/api/v1/pcaf-quality` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pcaf-quality/score-holding` | `score_holding` | api/v1/routes/pcaf_quality.py |
| POST | `/api/v1/pcaf-quality/score-portfolio` | `score_portfolio` | api/v1/routes/pcaf_quality.py |
| POST | `/api/v1/pcaf-quality/assess-data-quality` | `assess_data_quality` | api/v1/routes/pcaf_quality.py |
| GET | `/api/v1/pcaf-quality/ref/asset-classes` | `ref_asset_classes` | api/v1/routes/pcaf_quality.py |
| GET | `/api/v1/pcaf-quality/ref/dqs-levels` | `ref_dqs_levels` | api/v1/routes/pcaf_quality.py |
| GET | `/api/v1/pcaf-quality/ref/quality-dimensions` | `ref_quality_dimensions` | api/v1/routes/pcaf_quality.py |
| GET | `/api/v1/pcaf-quality/ref/emission-factors` | `ref_emission_factors` | api/v1/routes/pcaf_quality.py |
| GET | `/api/v1/pcaf-quality/ref/attribution-methods` | `ref_attribution_methods` | api/v1/routes/pcaf_quality.py |
| GET | `/api/v1/pcaf-quality/ref/improvement-paths` | `ref_improvement_paths` | api/v1/routes/pcaf_quality.py |
| GET | `/api/v1/pcaf-quality/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/pcaf_quality.py |
| GET | `/api/v1/pcaf-quality/ref/benchmarks` | `ref_benchmarks` | api/v1/routes/pcaf_quality.py |

### 2.3 Engine `pcaf_quality_engine` (services/pcaf_quality_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PCAFQualityEngine.score_holding` | holding | Score a single holding across all PCAF quality dimensions. |
| `PCAFQualityEngine.score_portfolio` | portfolio | Score an entire portfolio and produce regulatory disclosures. |
| `PCAFQualityEngine.assess_data_quality` | entity_name, reporting_year, data_inventory | Assess data quality for an entity without full emissions calc. |
| `PCAFQualityEngine._score_emissions_quality` | reported, phys_data, revenue, verification | Score the emissions data quality dimension (1-5). |
| `PCAFQualityEngine._score_completeness` | reported | Score data completeness dimension (1-5). |
| `PCAFQualityEngine._score_timeliness` | data_year, reporting_year | Score data timeliness dimension (1-5). |
| `PCAFQualityEngine._score_granularity` | reported, phys_data, revenue | Score data granularity dimension (1-5). |
| `PCAFQualityEngine._score_methodology` | asset_class, verification, reported | Score methodology robustness dimension (1-5). |
| `PCAFQualityEngine._dqs_to_confidence` | weighted_dqs | Map weighted DQS (1-5) to confidence weight (1.0-0.2). |
| `PCAFQualityEngine._estimate_emissions` | reported, phys_data, revenue, nace, outstanding, asset_class | Estimate total entity emissions (tCO2e) using best available data. |
| `PCAFQualityEngine._compute_attribution` | holding, outstanding | Compute the PCAF attribution factor for a holding. |
| `PCAFQualityEngine._identify_gaps` | reported, phys_data, revenue, verification, data_year, reporting_year | Identify data gaps for a holding. |
| `PCAFQualityEngine._get_improvement_actions` | overall_dqs, gaps | Return prioritised improvement actions based on current DQS and gaps. |
| `PCAFQualityEngine._portfolio_uncertainty` | scored, total_outstanding | Compute exposure-weighted average uncertainty percentage. |
| `PCAFQualityEngine._build_improvement_roadmap` | scored, total_outstanding | Build a prioritised quality improvement roadmap. |
| `PCAFQualityEngine._map_source_to_dqs` | emissions_source, verification | Map an emissions data source string to a DQS level. |
| `PCAFQualityEngine._score_scope_coverage` | scopes, verification | Score completeness based on scope coverage list. |
| `PCAFQualityEngine._edq_rationale` | emissions_source, verification | Generate rationale text for emissions data quality score. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `DQS`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/pcaf-quality/ref/asset-classes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['asset_classes'], 'n_keys': 1}`

**GET /api/v1/pcaf-quality/ref/attribution-methods** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['attribution_methods'], 'n_keys': 1}`

**GET /api/v1/pcaf-quality/ref/benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['benchmarks'], 'n_keys': 1}`

**GET /api/v1/pcaf-quality/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cross_framework_map'], 'n_keys': 1}`

**GET /api/v1/pcaf-quality/ref/dqs-levels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dqs_levels'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `pcaf_quality_engine` — extracted transformation lines:**
```python
financed_emissions = round(estimated_emissions * attribution_factor, 4)
pai_2 = round(total_financed / (aum_for_pai / 1_000_000), 4) if aum_for_pai > 0 else 0.0
weight = s.outstanding_amount / total_outstanding if total_outstanding > 0 else 0.0
lag = reporting_year - data_year
rev_meur = revenue / 1_000_000
outs_meur = outstanding / 1_000_000
estimated_denom = outstanding / 0.3 if outstanding > 0 else 1.0
lag = reporting_year - data_year
weight = s.outstanding_amount / total_outstanding
improvement_potential = dqs_level - max(1, dqs_level - 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).