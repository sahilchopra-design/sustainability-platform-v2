# ESG Data Quality Dashboard
**Module ID:** `esg-data-quality` · **Route:** `/esg-data-quality` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Multi-provider ESG data quality monitoring. Coverage completeness, timeliness scores, provider divergence analysis, and substitution logic for missing values.

> **Business value:** ESG data quality is the foundation of credible sustainable investment. Divergence between providers and incomplete coverage are major sources of uncertainty. This module enables systematic quality monitoring and evidence-based substitution decisions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `Inp`, `KpiCard`, `PIE_COLORS`, `Row`, `SECTORS`, `Section`, `Sel`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seededRandom` | `(seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };` |
| `base` | `hashStr(entity + sector + framework);` |
| `overall` | `Math.round(categories.reduce((sum, c) => sum + c.score, 0) / 4);` |
| `base` | `hashStr(entity + sector + 'provider');` |
| `chartData` | `providers.map((prov, pi) => {` |
| `gapRows` | `providers.map((prov, pi) => {` |
| `scores` | `dataTypes.map((_, di) => Math.round(s(pi * 9 + di + 1) * 40 + 40));` |
| `avgScore` | `Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);` |
| `base` | `hashStr(entity + sector + assurance + 'dqs');` |
| `sc1` | `parseFloat((s(1) * 1.5 + 1.5).toFixed(1));` |
| `sc2` | `parseFloat((s(2) * 1.5 + 1.5).toFixed(1));` |
| `sc3` | `parseFloat((s(3) * 2 + 2).toFixed(1));` |
| `weighted` | `parseFloat(((sc1 * 0.3 + sc2 * 0.3 + sc3 * 0.4)).toFixed(1));` |
| `dqsBar` | `assetClasses.map((ac, i) => ({ ac, dqs: parseFloat((s(i + 10) * 2 + 1.5).toFixed(1)) }));` |
| `base` | `hashStr(entity + framework + 'assurance');` |
| `base` | `hashStr(entity + sector + reportingYear + 'gap');` |

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
| `assess_data_quality` | entity_id, framework, reporting_year, disclosed_fields, assurance_level | Full ESG data quality assessment: |
| `verify_data_point` | field_name, reported_value, verification_source, comparison_data | Verifies a single ESG data point against peer/sector comparisons. |
| `recommend_assurance_approach` | entity_id, framework, size_tier | Recommends assurance standard and scope based on entity framework and size. |
| `impute_missing_data` | entity_id, missing_fields, sector, peer_data | AI-assisted imputation for missing ESG data fields. |
| `get_provider_coverage` | sector, data_types | Returns provider coverage rates for specified sector and data types. |
| `get_bcbs239_principles` |  |  |
| `get_assurance_standards` |  |  |
| `get_dqs_definitions` |  |  |

### 2.3 Engine `esg_data_quality_engine` (services/esg_data_quality_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ESGDataQualityEngine._dqs_weight` | level |  |
| `ESGDataQualityEngine._is_material` | indicator, sector | Determine indicator materiality from the reference material_sectors map. |
| `ESGDataQualityEngine.score_pillar` | entity_id, pillar, indicators_data, sector | Score a single ESG pillar (E/S/G) for coverage and quality. |
| `ESGDataQualityEngine.analyse_provider_divergence` | entity_id, bloomberg_data, msci_data, sustainalytics_data | Analyse ESG score divergence across data providers. |
| `ESGDataQualityEngine.calculate_dqs_profile` | entity_id, indicators_with_sources | Calculate PCAF-style DQS profile across all pillars. |
| `ESGDataQualityEngine.assess_bcbs239_compliance` | entity_id, data_governance_inputs | Assess BCBS 239 data governance compliance across 14 principles. |
| `ESGDataQualityEngine.run_full_report` | entity_id, entity_name, reporting_period, e_data, s_data, g_data | Run full ESG data quality assessment and return report dict. |
| `ESGDataQualityEngine.get_reference_data` |  | Return all reference constants. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `BRSR`, `FY2024` *(shared)*, `SET` *(shared)*, `__future__` *(shared)*, `disclosed`, `dme_brsr_submissions`, `esg_data_quality_indicators`, `esg_data_quality_reports`, `fastapi` *(shared)*, `non`, `pydantic` *(shared)*, `services` *(shared)*, `source`, `typing` *(shared)*
**Frontend seed datasets:** `PIE_COLORS`, `SECTORS`, `TABS`

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
Output: `{'type': 'object', 'keys': ['entity_id', 'bcbs239_score', 'compliance_tier', 'principle_scores', 'gaps', 'num_compliant', 'num_partial', 'num_non_compliant', 'assessed_at'], 'n_keys': 9}`

## 5 · Intermediate Transformation Logic
**Methodology:** ESG DQ composite scoring
**Headline formula:** `DQ = 0.4×Coverage + 0.3×Timeliness + 0.2×Accuracy + 0.1×Consistency`
**Standards:** ['PCAF DQ Framework', 'ISO 8000']

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