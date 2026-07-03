# Scope 3 Upstream Tracker
**Module ID:** `scope3-upstream-tracker` · **Route:** `/scope3-upstream-tracker` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Scope 3 upstream emission tracking across GHG Protocol Categories 1–8, combining supplier data, spend-based proxies and IO-LCA models for comprehensive value-chain accounting.

> **Business value:** Delivers comprehensive upstream Scope 3 accounting across all eight GHG Protocol categories with data quality tiering.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `COMPANY_NAMES`, `COUNTRIES`, `CTooltip`, `ENGAGEMENT_STAGES`, `KPI`, `METHODOLOGIES`, `Pill`, `SECTORS`, `SUPPLIER_PREFIXES`, `SUPPLIER_SUFFIXES`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `METHODOLOGIES` | `['Spend-based','Activity-based','Supplier-specific'];` |
| `genCompanies` | `() => COMPANY_NAMES.map((name, i) => {` |
| `sector` | `SECTORS[Math.floor(sr(seed) * SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(seed + 1) * COUNTRIES.length)];` |
| `revenue` | `Math.round(5000 + sr(seed + 2) * 195000);` |
| `totalScope3` | `Math.round(50000 + sr(seed + 3) * 4950000);` |
| `cats` | `CATEGORIES.map((c, ci) => {` |
| `share` | `c.avgShare * (0.5 + sr(seed + ci * 7) * 1.0);` |
| `spend` | `Math.round(share * revenue * (0.3 + sr(seed + ci * 11) * 0.4));` |
| `actFactor` | `0.6 + sr(seed + ci * 13) * 0.8;` |
| `suppFactor` | `0.4 + sr(seed + ci * 17) * 0.5;` |
| `spendEmissions` | `Math.round(totalScope3 * share);` |
| `normTotal` | `cats.reduce((a, c) => a + c.spendEmissions, 0);` |
| `seed` | `companyId * 10000 + i * 31;` |
| `cat` | `CATEGORIES[Math.floor(sr(seed) * CATEGORIES.length)];` |
| `prefix` | `SUPPLIER_PREFIXES[Math.floor(sr(seed + 1) * SUPPLIER_PREFIXES.length)];` |
| `suffix` | `SUPPLIER_SUFFIXES[Math.floor(sr(seed + 2) * SUPPLIER_SUFFIXES.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(seed + 3) * COUNTRIES.length)];` |

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
**Frontend seed datasets:** `CATEGORIES`, `COMPANY_NAMES`, `COUNTRIES`, `ENGAGEMENT_STAGES`, `METHODOLOGIES`, `SECTORS`, `SUPPLIER_PREFIXES`, `SUPPLIER_SUFFIXES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Categories Tracked | — | GHG Protocol | Number of upstream Scope 3 categories (Cat 1–8) with at least partial data coverage. |
| Supplier Coverage | — | Supplier portal | Share of procurement spend with primary supplier emission data versus spend-based proxy. |
| Total Upstream S3 | — | Calculated | Aggregated upstream Scope 3 emissions across categories 1–8 in reporting year. |
- **Procurement spend data, supplier emission disclosures, Exiobase IO tables** → Category mapping, primary/proxy data blending, aggregation → **Category emission totals, supplier scorecards, data quality flags**

## 5 · Intermediate Transformation Logic
**Methodology:** Spend-Based Category Emission
**Headline formula:** `Procurement Spend (£) × Emission Intensity (kgCO₂e/£)`
**Standards:** ['GHG Protocol Scope 3', 'Exiobase IO-LCA']

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
| `scope3-materiality-engine` | engine:scope3_analytics_engine |