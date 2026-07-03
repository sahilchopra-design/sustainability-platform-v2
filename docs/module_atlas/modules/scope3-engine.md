# Scope 3 Emissions Engine
**Module ID:** `scope3-engine` · **Route:** `/scope3-engine` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
GHG Protocol Scope 3 Standard implementation covering all 15 value chain categories. Includes supplier engagement module, hotspot analysis, category materiality assessment, and SBTi Scope 3 target guidance.

> **Business value:** Scope 3 typically represents 70-90% of total corporate emissions but is the least measured. This engine enables companies to identify material value chain hotspots, prioritise supplier engagement, and set credible SBTi Scope 3 targets required for net-zero claims.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_SECTORS`, `Badge`, `CONF_COLORS`, `CONF_ORDER`, `CatTooltip`, `KpiCard`, `SCOPE3_CATEGORIES`, `SECTOR_EMISSION_FACTORS`, `SectionHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `employees` | `company.employees \|\| (rev * 2);` |
| `cats` | `SCOPE3_CATEGORIES.map(cat => {` |
| `total` | `cats.reduce((s, c) => s + c.estimated_mt, 0);` |
| `holdings` | `p.holdings.map(h => {` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `waterfallData` | `useMemo(() => [...filteredCats].sort((a, b) => b.estimated_mt - a.estimated_mt), [filteredCats]);` |
| `totalS3` | `scope3Data.reduce((s, c) => s + c.estimated_mt, 0);` |
| `s3Ratio` | `(s1 + s2) > 0 ? totalS3 / (s1 + s2) : 0;` |
| `largestCat` | `scope3Data.reduce((mx, c) => c.estimated_mt > (mx?.estimated_mt \|\| 0) ? c : mx, scope3Data[0]);` |
| `upstreamTotal` | `scope3Data.filter(c => c.upstream).reduce((s, c) => s + c.estimated_mt, 0);` |
| `downstreamTotal` | `scope3Data.filter(c => !c.upstream).reduce((s, c) => s + c.estimated_mt, 0);` |
| `s3Intensity` | `(selectedCompany?.revenue_usd_mn \|\| 0) > 0 ? (totalS3 / selectedCompany.revenue_usd_mn) * 1e6 : 0; // tCO2e per USD Mn` |
| `confWeighted` | `scope3Data.reduce((s, c) => {` |
| `avgCompany` | `{ revenue_usd_mn: medianRev, scope1_mt: medianRev * 0.05, scope2_mt: medianRev * 0.02, sector, employees: medianRev * 2 };` |
| `top5` | `[...scope3Data].sort((a, b) => b.estimated_mt - a.estimated_mt).slice(0, 5);` |
| `total` | `cats.reduce((s, c) => s + c.estimated_mt, 0);` |
| `attribution` | `evicOrMktCap > 0 ? (h.exposure_usd_mn \|\| 0) / evicOrMktCap : 0;` |

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
**Frontend seed datasets:** `CONF_ORDER`, `SCOPE3_CATEGORIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Categories Covered | — | GHG Protocol | All upstream (1-8) and downstream (9-15) categories |
| Cat 1 Hotspot | — | Sector analysis | Purchased goods typically largest Scope 3 category for manufacturers |
| Cat 11 Dominance | — | O&G sector | Use of sold products dominates for fossil fuel companies |
| Data Quality Avg | — | GHG Protocol | Majority rely on spend-based or hybrid methods |
- **Supplier spend data** → Spend-based emission factors → **Category 1-8 estimates**
- **Product sales volumes** → Lifecycle emission factors → **Category 9-11 estimates**
- **PCAF Standard** → Attribution calculation → **Category 15 financed emissions**

## 5 · Intermediate Transformation Logic
**Methodology:** GHG Protocol Scope 3 by category
**Headline formula:** `S3_total = Σ(Cat_1..15); Cat15 = Σ(AF_i × Investee_Emissions_i)`
**Standards:** ['GHG Protocol Scope 3 Standard', 'ISO 14064-3', 'SBTi FLAG']

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
| `scope3-materiality-engine` | engine:scope3_analytics_engine |
| `scope3-upstream-tracker` | engine:scope3_analytics_engine |