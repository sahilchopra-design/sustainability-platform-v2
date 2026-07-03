# Scope 3 Materiality Engine
**Module ID:** `scope3-materiality-engine` · **Route:** `/scope3-materiality-engine` · **Tier:** A (backend vertical) · **EP code:** EP-CM4 · **Sprint:** CM

## 1 · Overview
15 Scope 3 categories with sector-level materiality ranking, data quality scoring, and improvement roadmap.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `DQ_COLORS`, `DQ_LABELS`, `SECTORS`, `SECTOR_DATA`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `DQ_LABELS` | `['N/A','Primary Supplier','Verified Secondary','Industry Average','Spend-Based','Extrapolated'];` |
| `matData` | `CATEGORIES.map((c, i) => ({ ...c, materiality: sd.mat[i], dq: sd.dq[i] })).sort((a, b) => b.materiality - a.materiality);` |
| `dqDist` | `[1, 2, 3, 4, 5].map(q => ({ level: DQ_LABELS[q], count: sd.dq.filter(d => d === q).length }));` |
| `benchmarkData` | `CATEGORIES.slice(0, 8).map(c => {` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/scope3/category-coverage` | `category_coverage` | api/v1/routes/scope3_analytics.py |
| POST | `/api/v1/scope3/calculate` | `calculate_scope3` | api/v1/routes/scope3_analytics.py |
| POST | `/api/v1/scope3/dqs-assessment` | `dqs_assessment` | api/v1/routes/scope3_analytics.py |
| POST | `/api/v1/scope3/sbti-scope3` | `sbti_scope3` | api/v1/routes/scope3_analytics.py |
| POST | `/api/v1/scope3/avoided-emissions` | `avoided_emissions` | api/v1/routes/scope3_analytics.py |
| POST | `/api/v1/scope3/double-counting` | `double_counting` | api/v1/routes/scope3_analytics.py |
| GET | `/api/v1/scope3/ref/categories` | `ref_categories` | api/v1/routes/scope3_analytics.py |
| GET | `/api/v1/scope3/ref/sector-profiles` | `ref_sector_profiles` | api/v1/routes/scope3_analytics.py |
| GET | `/api/v1/scope3/ref/ef-databases` | `ref_ef_databases` | api/v1/routes/scope3_analytics.py |

### 2.3 Engine `scope3_analytics_engine` (services/scope3_analytics_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `Scope3AnalyticsEngine.assess_category_coverage` | entity_id, sector, reported_categories, total_scope3_tco2e, scope12_total_tco2e |  |
| `Scope3AnalyticsEngine.calculate_scope3` | entity_id, sector, category_inputs, flag_share, revenue_musd |  |
| `Scope3AnalyticsEngine.assess_dqs` | entity_id, sector, category_methods |  |
| `Scope3AnalyticsEngine.assess_sbti_scope3` | entity_id, sector, scope3_tco2e, supplier_engagement_pct, downstream_coverage_pct, flag_tco2e |  |
| `Scope3AnalyticsEngine.calculate_avoided_emissions` | entity_id, product_type, annual_units_sold, baseline_product_emission_factor, product_emission_factor, methodology |  |
| `Scope3AnalyticsEngine.assess_double_counting` | entity_id, sector, category_data |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CATEGORIES`, `DQ_COLORS`, `DQ_LABELS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Scope 3 Categories | — | GHG Protocol | Per Corporate Value Chain Standard |
| Avg DQ Score | — | PCAF scale | Most categories using estimated data |

## 5 · Intermediate Transformation Logic
**Methodology:** Category materiality assessment
**Headline formula:** `Materiality = EmissionsShare × DataAvailability × InfluenceCapacity`
**Standards:** ['GHG Protocol Scope 3', 'CDP Supply Chain']

**Engine `scope3_analytics_engine` — extracted transformation lines:**
```python
missing_set = all_categories - reported_set
material_threshold = 0.05 * (total_scope3_tco2e + scope12_total_tco2e)
per_cat_avg = total_scope3_tco2e / max(1, len(reported_set))
coverage_score = round(len(reported_set) / 15 * 100, 2)
scope3_ratio = round(total_scope3_tco2e / max(1, scope12_total_tco2e), 2)
flag_tco2e = round(total_tco2e * share, 2)
scope3_intensity = round(total_tco2e / float(revenue_musd), 4)
weighted_dqs = round(total_weighted / max(1, total_weight), 2)
flag_target_met = (flag_tco2e / max(1, scope3_tco2e) < 0.5) if flag_relevant else True
delta_ef = baseline_product_emission_factor - product_emission_factor
avoided_emissions_tco2e = round(max(0, delta_ef * annual_units_sold), 2)
adjusted_avoided = round(avoided_emissions_tco2e * displacement_factor, 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **3** other module(s).
**Shared engines (edits propagate!):** `scope3_analytics_engine` (used by 4 modules)

| Connected module | Shared via |
|---|---|
| `scope3-category-analytics` | engine:scope3_analytics_engine |
| `scope3-engine` | engine:scope3_analytics_engine |
| `scope3-upstream-tracker` | engine:scope3_analytics_engine |