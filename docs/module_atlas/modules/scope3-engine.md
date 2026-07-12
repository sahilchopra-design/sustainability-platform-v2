# Scope 3 Emissions Engine
**Module ID:** `scope3-engine` · **Route:** `/scope3-engine` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
GHG Protocol Scope 3 Standard implementation covering all 15 value chain categories. Includes supplier engagement module, hotspot analysis, category materiality assessment, and SBTi Scope 3 target guidance.

> **Business value:** Scope 3 typically represents 70-90% of total corporate emissions but is the least measured. This engine enables companies to identify material value chain hotspots, prioritise supplier engagement, and set credible SBTi Scope 3 targets required for net-zero claims.

**How an analyst works this module:**
- Category Overview shows all 15 categories with emissions and method
- Hotspot Analysis identifies top 3 material categories
- Supplier Engagement tracks primary data collection from top suppliers
- SBTi Guidance shows Scope 3 target options (67% reduction / 5.1% p.a.)
- FLAG Accounting adds land use for agriculture/food/forestry companies

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_SECTORS`, `Badge`, `CONF_COLORS`, `CONF_ORDER`, `CatTooltip`, `KpiCard`, `SCOPE3_CATEGORIES`, `SECTOR_EMISSION_FACTORS`, `SectionHeader`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SCOPE3_CATEGORIES` | 16 | `name`, `upstream`, `method`, `description`, `factor_description`, `avg_pct_of_total` |

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
| `sectorCompareData` | `useMemo(() => { const top5 = [...scope3Data].sort((a, b) => b.estimated_mt - a.estimated_mt).slice(0, 5);` |
| `portfolioS3` | `useMemo(() => { return holdings.map(h => { const cats = estimateScope3(h.company);` |
| `attribution` | `evicOrMktCap > 0 ? (h.exposure_usd_mn \|\| 0) / evicOrMktCap : 0;` |
| `totalPortfolioS3` | `portfolioS3.reduce((s, p) => s + p.attributed, 0);` |
| `heatmapData` | `useMemo(() => { return holdings.slice(0, 15).map(h => { const cats = estimateScope3(h.company);` |
| `maxVal` | `Math.max(...heatmapData.map(r => r[`cat${cid}`] \|\| 0), 0.001);` |
| `intensity` | `Math.min(val / maxVal, 1);` |

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
| `Scope3AnalyticsEngine.assess_sbti_scope3` | entity_id, sector, scope3_tco2e, supplier_engagement_pct, downstream_coverage_pct, flag_tco2e, current_reduction_rate_pa |  |
| `Scope3AnalyticsEngine.calculate_avoided_emissions` | entity_id, product_type, annual_units_sold, baseline_product_emission_factor, product_emission_factor, methodology, displacement_factor, additionality_score |  |
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

Category coverage varies by sector: Cat 11 (use of sold products) dominates for O&G, Cat 1 (purchased goods) dominates for consumer goods. Sector average emission factors used where primary data absent. FLAG sectors need additional land-use accounting.

**Standards:** ['GHG Protocol Scope 3 Standard', 'ISO 14064-3', 'SBTi FLAG']
**Reference documents:** GHG Protocol Corporate Value Chain (Scope 3) Standard; SBTi Corporate Net-Zero Standard; SBTi FLAG Guidance; ISO 14064-3

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
| `scope3-upstream-tracker` | engine:scope3_analytics_engine |
| `scope3-materiality-engine` | engine:scope3_analytics_engine |
| `scope3-category-analytics` | engine:scope3_analytics_engine |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Unlike most Scope 3 pages on the platform, this engine runs on **real portfolio holdings** — it reads
`localStorage` (`ra_portfolio_v1`) and joins against `GLOBAL_COMPANY_MASTER` for actual `revenue_usd_mn`,
`scope1_mt`, `scope2_mt`, `sector`, `market_cap_usd_mn`/`evic_usd_mn`; if no portfolio exists it falls back
to a 20-company demo slice of the same master file (flagged with a "DEMO DATA" badge). The core function
`estimateScope3(company, overrides)` computes all 15 GHG Protocol categories per company via a
deterministic (non-random) sector-emission-factor model:

```js
Cat 1  = revenue × EF.cat1 / 1e6                         // spend-based
Cat 3  = (scope1 + scope2) × EF.cat3                     // energy-based, "10–20% of S1+S2" proxy
Cat 6  = employees × EF.cat6 / 1e6                        // employee-based (travel)
Cat 7  = employees × EF.cat7 / 1e6                        // employee-based (commuting)
Cat 11 = revenue × EF.cat11 / 1e6                         // product-based (use-phase)
Cat 15 = cat15_dominant ? revenue×0.3×150/1e6 : revenue×0.02×50/1e6   // PCAF-style, Financials only
...                                                        // Cat 2/4/5/8/9/10/12/13/14: fixed revenue-share × flat EF
```

Every category is overridable per-company via a manual input persisted to `localStorage`
(`scope3_overrides`), which sets `confidence = 'Reported'` and bypasses the modelled estimate entirely.

### 7.2 Parameterisation — sector emission-factor table

| Sector | Cat 1 EF | Cat 11 EF | S3 multiplier | Notes |
|---|---|---|---|---|
| Energy | 320 | 850 | 4.5× | Use-phase (Cat 11) dominant — combustion of sold fuel |
| Utilities | 150 | 650 | 5.0× | Highest S3 multiplier in the table |
| Financials | 25 | 5 | 1.2× | `cat15_dominant: true` — Cat 15 formula switches to `revenue×0.3×150` |
| IT | 45 | 35 | 1.8× | Lowest Cat 1 EF |
| Materials | 280 | 120 | 3.2× | |

Units are declared as "tCO₂e per USD Mn revenue," attributed in code comments to "DEFRA/EPA databases,"
but **the specific numeric values (320, 850, 45, 0.15 …) are not traceable to a cited DEFRA/EPA table
row in the code** — they are internally consistent, sector-differentiated constants that reproduce
directionally correct stylised facts (energy/utilities Cat 11-heavy, financials Cat 15-heavy) rather than
verified per-sector EEIO coefficients. Category confidence labels (`High`/`Medium`/`Low`) are hardcoded per
category-index in the `switch` statement, not derived from any statistical measure of estimation error.

| Category | Formula driver | Confidence assigned |
|---|---|---|
| Cat 3 (Fuel & Energy) | `(S1+S2) × EF.cat3` | High — anchored to reported Scope 1+2 |
| Cat 1, 6, 7, 11 | revenue or employee × EF | Medium (Cat 11: High if `EF.cat11 > 100`) |
| Cat 2, 4, 5, 8, 9, 10, 12, 13, 14, 15 (non-Financial) | fixed revenue-share × flat EF | Low (default) |
| Any category | manual override present | Reported |

### 7.3 Calculation walkthrough

1. `estimateScope3` runs once per selected company (or once per holding for portfolio aggregation).
2. `pct_of_total` normalises each category's `estimated_mt` against that company's own 15-category sum.
3. Headline KPIs: `totalS3` (Σ all 15 cats), `s3Ratio = totalS3/(s1+s2)` guarded at zero, `s3Intensity =
   totalS3/revenue×1e6` guarded at zero, `confWeighted` = emissions-weighted average of a confidence→score
   map (`Reported=100, High=75, Medium=50, Low=25`), guarded by `(totalS3 || 1)`.
4. **Portfolio Scope 3 Aggregation (§ Section 10)** applies PCAF-style attribution:
   `attribution = exposure_usd_mn / (EVIC or market_cap or revenue)`, capped at 1.0, then
   `attributed = totalS3 × min(attribution, 1)`. This is the platform's standard PCAF attribution-factor
   pattern (financed-emissions share of investee), reused here for Scope 3 rather than the investee's own
   Scope 1+2 — i.e. it attributes the *investee's* Scope 3 footprint to the investor's ownership share,
   which is the PCAF Category 15 logic applied recursively.
5. **Sector Comparison (§ Section 9)** builds a synthetic "sector-median company" from the median revenue
   of same-sector peers in `GLOBAL_COMPANY_MASTER`, feeds it back through `estimateScope3`, and charts the
   top-5 categories against the selected company.
6. **Category Heatmap** finds the portfolio-wide top-5 categories by aggregate Mt, then intensity-shades
   each holding's value against the row-wise (`top5CatIds`) column maximum.

### 7.4 Worked example

Take an Energy-sector company with `revenue = $12,000M`, `scope1 = 8.0 Mt`, `scope2 = 1.5 Mt`,
`employees = 24,000` (default `revenue×2` since not disclosed):

| Category | Formula | Result |
|---|---|---|
| Cat 1 | `12,000 × 320 / 1e6` | 3.840 Mt |
| Cat 3 | `(8.0+1.5) × 0.15` | 1.425 Mt |
| Cat 6 | `24,000 × 3.5 / 1e6` | 0.084 Mt |
| Cat 11 | `12,000 × 850 / 1e6` | **10.200 Mt** (largest — High confidence, `EF.cat11=850>100`) |
| totalS3 (all 15, abbreviated) | Σ | ≈ 16.5 Mt (illustrative) |
| `s3Ratio` | `16.5 / (8.0+1.5)` | **1.74×** |
| `s3Intensity` | `16.5e6 / 12,000` | ≈ 1,375 tCO₂e / $Mn revenue |

Cat 11 (use of sold fuel) correctly dominates for an Energy-sector obligor, consistent with the sector
profile encoded in `SECTOR_EMISSION_FACTORS.Energy`.

### 7.5 Companion analytics on the page

- **Manual Override Panel** — persists user-entered "actual reported" values per category per company to
  `localStorage`; overrides immediately flip `confidence` to `'Reported'` and recompute `pct_of_total`.
- **Cross-Module Navigation** links to Supply Chain ESG Mapping, Carbon Budget, Scenario Stress Test,
  Controversy Monitor and Stranded Assets — these are UI links only; no live data payload is passed.

### 7.6 Data provenance & limitations

- **Company financials are real** (from `GLOBAL_COMPANY_MASTER`) when a user portfolio exists; the
  20-company fallback samples the same real master list, only the *selection* is a fixed demo slice, not
  randomly generated. No `sr()` PRNG is used anywhere in this file.
- **Emission factors are static, hand-authored constants** presented as sourced from "DEFRA/EPA databases"
  but with no per-value citation; they should be treated as illustrative sector proxies, not audit-grade
  EEIO factors. A production system would source these from a versioned table (DEFRA 2024 GHG Conversion
  Factors, EPA EEIOv2, or Exiobase) with explicit vintage and currency-conversion metadata — several of
  which are already catalogued (unused) in `backend/services/scope3_analytics_engine.py`'s
  `EMISSION_FACTOR_DATABASES` dict.
- Confidence labels are rule-based heuristics on estimation *method*, not empirical error bounds; the page
  itself states "+/-30-50%" uncertainty for spend-based estimates in its own Methodology Notes panel.
- `sectorAvg` computes a single "median-revenue company" rather than a full peer distribution, so the
  Sector Comparison chart shows one benchmark point, not a percentile range.
- No live backend call: `backend/services/scope3_analytics_engine.py` exists with a materially more
  rigorous DQS/materiality/double-counting framework (honest-null design — see
  `scope3-category-analytics.md` §7.6) but is not wired to this route.

**Framework alignment:** GHG Protocol Corporate Value Chain (Scope 3) Standard for the 15-category
structure and spend/activity/hybrid method taxonomy · GHG Protocol Technical Guidance 2013 for
category-specific calculation approaches (spend-based, distance-based, average-data) · PCAF Standard Part A
for the attribution-factor pattern reused in the Portfolio Aggregation section · DEFRA/EPA/IEA are named as
factor sources in the UI copy but the actual numeric factors are not traceably sourced in code.

## 9 · Future Evolution

### 9.1 Evolution A — Versioned EEIO factor tables behind the deterministic estimator (analytics ladder: rung 2 → 3)

**What.** §7 distinguishes this engine from its Scope 3 siblings: it runs on real portfolio holdings (localStorage portfolio joined to `GLOBAL_COMPANY_MASTER` financials, honest DEMO badge on the fallback slice, no PRNG anywhere) with a deterministic sector-factor model across all 15 categories. Its documented ceiling is factor provenance: emission factors are static hand-authored constants "presented as sourced from DEFRA/EPA databases but with no per-value citation" — illustrative sector proxies, not audit-grade EEIO factors — and §7.6 notes the unwired `scope3_analytics_engine.py` already catalogues the right sources (DEFRA GHG Conversion Factors, EPA EEIO, Exiobase). Evolution A builds that factor layer.

**How.** (1) A versioned `ref_scope3_factors` table: DEFRA annual conversion factors (free, published) and US EPA EEIO v2 (free) loaded with vintage, unit, currency-year, and source-row citation per factor; the in-page constants retired to a labelled legacy set. (2) `estimateScope3` ports server-side (`POST /api/v1/scope3/estimate`) reading the factor table, response carrying factor vintage per category — the provenance stamp audit-grade Scope 3 requires; currency/inflation adjustment for spend-based categories documented. (3) Category-method upgrades where data allows: Cat 6/7 from headcount, Cat 15 delegated to PCAF attribution logic — each an incremental honest improvement over the revenue proxy. (4) bench_quant pins a reference company across a factor-version change so drift is visible, not silent.

**Prerequisites.** Factor ingestion (DEFRA/EPA formats are stable CSVs); currency-conversion metadata. **Acceptance:** every category estimate cites its factor row and vintage; re-running under a new DEFRA vintage produces a diffable, explained change; the bench company's estimate reproduces exactly per version.

### 9.2 Evolution B — Scope 3 methodology copilot with estimation transparency (LLM tier 2)

**What.** Scope 3 numbers are contested in every review; the defense is methodology transparency, which this engine's deterministic chain enables: "walk the auditor through our Cat 1 estimate — factor source, vintage, revenue basis, what would change with supplier-specific data", "which categories should we prioritize for primary data collection, by materiality and estimation uncertainty?", "explain why our Cat 11 dwarfs everything" (sector factor structure, mechanically).

**How.** Tier-2 tool calls to `POST /estimate` and the factor table; walkthrough answers quote the actual factor row, vintage, and financial input per category — the audit conversation as a grounded dialogue. Prioritization combines computed category shares with the method-based uncertainty bands (spend-based > activity-based > primary), the same mapping the category-analytics sibling adopts, giving one consistent story across both modules. Guardrails: estimates are always labelled estimation-method-and-vintage; the copilot distinguishes screening estimates from reported inventories and refuses to present the former as the latter — the GHG Protocol distinction that matters most in assurance contexts.

**Prerequisites.** Evolution A's factor provenance (a transparency copilot needs citations to quote); uncertainty-band conventions shared with the sibling. **Acceptance:** every factor claim in a walkthrough resolves to a table row; prioritization ordering reproduces from shares × uncertainty; the screening-vs-reported distinction appears whenever totals are quoted.