# Scope 3 Category Deep Analytics
**Module ID:** `scope3-category-analytics` · **Route:** `/scope3-category-analytics` · **Tier:** A (backend vertical) · **EP code:** EP-DN4 · **Sprint:** DN

## 1 · Overview
Provides deep-dive analytics for the highest-impact Scope 3 categories — Cat 1 (purchased goods), Cat 4 (upstream transport), Cat 11 (use of sold products), and Cat 15 (investments). Models reduction pathways, supplier engagement ROI, and product design changes for SBTi target alignment.

> **Business value:** Required for SBTi Scope 3 target setting (67% coverage), CDP leadership band, and CSRD ESRS E1 upstream/downstream disclosure. Pathfinder Framework integration enables industry-leading PCF precision for Cat 1 purchased goods.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `COMPANIES`, `DQ_METHODS`, `KpiCard`, `SCOPE3_CATEGORIES`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `DQ_METHODS` | `['Primary Data', 'Spend-Based', 'Hybrid', 'Activity-Based', 'IO Analysis', 'Supplier Data'];` |
| `categoryTotals` | `useMemo(() => SCOPE3_CATEGORIES.map(cat => {` |
| `totalEm` | `filteredCompanies.reduce((a, c) => a + c.categories[cat.id - 1].emissions, 0);` |
| `avgDQ` | `filteredCompanies.reduce((a, c) => a + c.categories[cat.id - 1].dataQuality, 0) / Math.max(1, filteredCompanies.length);` |
| `reportedCount` | `filteredCompanies.filter(c => c.categories[cat.id - 1].reported).length;` |
| `avgTarget` | `filteredCompanies.reduce((a, c) => a + c.categories[cat.id - 1].target2030, 0) / Math.max(1, filteredCompanies.length);` |
| `grandTotal` | `useMemo(() => categoryTotals.reduce((a, c) => a + c.totalEm, 0), [categoryTotals]);` |
| `upstreamTotal` | `useMemo(() => categoryTotals.filter(c => c.type === 'Upstream').reduce((a, c) => a + c.totalEm, 0), [categoryTotals]);` |
| `downstreamTotal` | `useMemo(() => categoryTotals.filter(c => c.type === 'Downstream').reduce((a, c) => a + c.totalEm, 0), [categoryTotals]);` |
| `avgOverallDQ` | `useMemo(() => categoryTotals.reduce((a, c) => a + c.avgDQ, 0) / Math.max(1, categoryTotals.length), [categoryTotals]);` |
| `methodBreakdown` | `useMemo(() => DQ_METHODS.map(m => {` |
| `sectorComparison` | `useMemo(() => SECTORS.map(sec => {` |
| `avgScope3` | `sups.reduce((a, c) => a + c.categories.reduce((s, cat) => s + cat.emissions, 0), 0) / sups.length;` |
| `avgCat1` | `sups.reduce((a, c) => a + c.categories[0].emissions, 0) / sups.length;` |
| `avgDQ` | `sups.reduce((a, c) => a + c.categories.reduce((s, cat) => s + cat.dataQuality, 0) / c.categories.length, 0) / sups.length;` |
| `top5Categories` | `useMemo(() => [...categoryTotals].sort((a, b) => b.totalEm - a.totalEm).slice(0, 5), [categoryTotals]);` |
| `targetEm` | `cat.totalEm * (1 - cat.avgTarget / 100);` |
| `reduction` | `cat.totalEm - targetEm;` |

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
**Frontend seed datasets:** `DQ_METHODS`, `SCOPE3_CATEGORIES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cat 1 Share of S3 | — | CDP Supply Chain 2023 | Category 1 (purchased goods/services) represents 35–60% of Scope 3 for manufacturers — primary target |
| Cat 11 Share for Consumer Goods | — | GHG Protocol Scope 3 Case Studies 2023 | Category 11 (use of sold products) dominates for electronics, appliances, and fossil fuel companies |
| Product Carbon Footprint Precision | — | WBCSD Pathfinder 2023 | Product-level carbon footprint data 4× more accurate for S3 Cat 1 vs spend-based EXIOBASE estimates |
- **Spend/activity data + supplier PCF data (Pathfinder)** → Category emissions calculation → **S3 emissions by category with PCAF DQ scores**
- **Reduction lever library (sector, category specific)** → Reduction pathway modelling → **Abatement potential by lever and adoption timeline**
- **SBTi validation criteria by category** → Target alignment check → **Proposed S3 target vs SBTi coverage and ambition requirements**

## 5 · Intermediate Transformation Logic
**Methodology:** Scope 3 Category Reduction Model
**Headline formula:** `S3reduction_cat_i = BaselineEmissions_i × (1 - ReductionLever_j × AdoptionRate_j); SupplierEngagementROI = EmissionsReduced × CarbonPrice / EngagementCost`
**Standards:** ['GHG Protocol Scope 3 Calculation Guidance per Category', 'SBTi FLAG and Buildings Sector S3 Guidance', 'CDP Technical Note — Scope 3 Category Calculations', 'WBCSD Pathfinder Framework v2.0 (Product Carbon Footprint)']

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
| `scope3-engine` | engine:scope3_analytics_engine |
| `scope3-materiality-engine` | engine:scope3_analytics_engine |
| `scope3-upstream-tracker` | engine:scope3_analytics_engine |