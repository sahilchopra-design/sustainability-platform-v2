# Scope 3 Category Deep Analytics
**Module ID:** `scope3-category-analytics` · **Route:** `/scope3-category-analytics` · **Tier:** A (backend vertical) · **EP code:** EP-DN4 · **Sprint:** DN

## 1 · Overview
Provides deep-dive analytics for the highest-impact Scope 3 categories — Cat 1 (purchased goods), Cat 4 (upstream transport), Cat 11 (use of sold products), and Cat 15 (investments). Models reduction pathways, supplier engagement ROI, and product design changes for SBTi target alignment.

> **Business value:** Required for SBTi Scope 3 target setting (67% coverage), CDP leadership band, and CSRD ESRS E1 upstream/downstream disclosure. Pathfinder Framework integration enables industry-leading PCF precision for Cat 1 purchased goods.

**How an analyst works this module:**
- Select Scope 3 category for deep dive analysis
- Quantify baseline emissions with methodology assessment
- Model reduction levers (supplier engagement, product redesign, materials switch)
- Calculate engagement ROI vs internal abatement
- Generate SBTi-compliant S3 reduction pathway

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `COMPANIES`, `DQ_METHODS`, `KpiCard`, `SCOPE3_CATEGORIES`, `SECTORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SCOPE3_CATEGORIES` | 16 | `name`, `type` |

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
| `cat1Total` | `useMemo(() => categoryTotals.find(c => c.id === 1)?.totalEm \|\| 0, [categoryTotals]);  const methodBreakdown = useMemo(() => DQ_METHODS.map(m => { let count = 0;` |
| `sectorComparison` | `useMemo(() => SECTORS.map(sec => {` |
| `avgScope3` | `sups.reduce((a, c) => a + c.categories.reduce((s, cat) => s + cat.emissions, 0), 0) / sups.length;` |
| `avgCat1` | `sups.reduce((a, c) => a + c.categories[0].emissions, 0) / sups.length;` |
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
| `Scope3AnalyticsEngine.assess_sbti_scope3` | entity_id, sector, scope3_tco2e, supplier_engagement_pct, downstream_coverage_pct, flag_tco2e, current_reduction_rate_pa |  |
| `Scope3AnalyticsEngine.calculate_avoided_emissions` | entity_id, product_type, annual_units_sold, baseline_product_emission_factor, product_emission_factor, methodology, displacement_factor, additionality_score |  |
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

Category-specific reduction levers modelled with adoption curves; supplier engagement ROI quantifies cost-effectiveness vs internal abatement; PCF data from Pathfinder Framework enables product-level precision

**Standards:** ['GHG Protocol Scope 3 Calculation Guidance per Category', 'SBTi FLAG and Buildings Sector S3 Guidance', 'CDP Technical Note — Scope 3 Category Calculations', 'WBCSD Pathfinder Framework v2.0 (Product Carbon Footprint)']
**Reference documents:** GHG Protocol Technical Guidance for Calculating Scope 3 Emissions 2013; WBCSD Pathfinder Framework v2.0 — Product Carbon Footprint Exchange; SBTi Scope 3 Target Validation Criteria 2023; CDP Technical Note — Scope 3 by Category 2023

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
| `scope3-engine` | engine:scope3_analytics_engine |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

The page maintains a synthetic universe of 50 companies (`COMPANIES`, generated once at module load via
the platform's seeded PRNG `sr(s) = frac(sin(s+1)×10⁴)`), each carrying all 15 GHG Protocol Scope 3
categories with per-category `emissions`, `dataQuality` (1–5), `method`, `target2030`, `baseYear` and a
`reported` flag. All aggregation is client-side `useMemo` arithmetic over this fixed array — there is no
backend call (`trace_labels` is empty); `backend/services/scope3_analytics_engine.py` exists but is not
wired to this page.

```js
totalEm   = Σ companies[c].emissions                        // per category, filtered by sector
avgDQ     = Σ companies[c].dataQuality / max(1, N)           // simple mean, not PCAF-weighted
reportingPct = reportedCount / N × 100
avgTarget = Σ companies[c].target2030 / max(1, N)
```

`grandTotal`, `upstreamTotal` (Cat 1–8) and `downstreamTotal` (Cat 9–15) sum `categoryTotals`; `cat1Total`
and `top5Categories` (sorted descending) drive the headline KPI strip.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| 15 Scope 3 categories, Upstream/Downstream split | Cat 1–8 upstream, 9–15 downstream | GHG Protocol Corporate Value Chain Standard (canonical) |
| Cat 1 emissions range | `sr()×100,000 + 5,000` | Synthetic — Cat 1 deliberately seeded larger than other categories to reproduce the "Cat 1 dominance" stylised fact |
| Other categories | `sr()×30,000 + 1,000` | Synthetic demo value |
| `dataQuality` | `sr()×4 + 1` → 1.0–5.0 | Synthetic; mimics a PCAF-style 1(best)–5(worst) scale but is a flat random draw, not method-derived |
| `DQ_METHODS` (6 labels: Primary Data, Spend-Based, Hybrid, Activity-Based, IO Analysis, Supplier Data) | fixed list | GHG Protocol Ch.7 method taxonomy (names only; assignment is random) |
| `target2030` | `sr()×50 + 10` → 10–60% | Synthetic — no linkage to SBTi validation logic |
| `reported` flag | `sr() > 0.25` → ~75% reporting rate | Synthetic |
| 10 sectors | fixed list | Descriptive labels only, no GICS mapping |

### 7.3 Calculation walkthrough

1. `sectorFilter` narrows `COMPANIES` to `filteredCompanies`.
2. `categoryTotals` (one row per of the 15 categories) sums/averages the four metrics above across
   `filteredCompanies`.
3. Headline KPIs derive purely from `categoryTotals`: grand total, upstream/downstream share, Cat 1 share
   of total, average DQ across categories, and Cat 1's average 2030 target.
4. Tab 4 ("Reduction Targets") computes `targetEm = totalEm × (1 − avgTarget/100)` and
   `reduction = totalEm − targetEm` per category — a straight-line percentage cut, not a modelled abatement
   curve.
5. Tab 5 ("Sector Comparison") recomputes `avgScope3`/`avgCat1`/`avgDQ` per sector directly from the
   unfiltered `COMPANIES` array (independent of the sector-filter buttons used elsewhere on the page).

### 7.4 Worked example

Take Cat 1 with `totalEm = 2,450,000 tCO₂e` (illustrative sum for the current sector filter) and
`avgTarget = 42%`:

| Step | Computation | Result |
|---|---|---|
| Target emissions | `2,450,000 × (1 − 0.42)` | 1,421,000 tCO₂e |
| Reduction volume | `2,450,000 − 1,421,000` | 1,029,000 tCO₂e |
| Cat 1 dominance KPI | `cat1Total / grandTotal × 100` | e.g. if `grandTotal = 9.8M`, → 25% |
| Upstream share KPI | `upstreamTotal / grandTotal × 100` | sums Cat 1–8 totals over grand total |

All figures are illustrative because the underlying company array is randomly seeded on each app load
context — see §7.7.

### 7.5 Companion analytics on the page

- **Method Breakdown** (Tab 3) counts occurrences of each of the 6 `DQ_METHODS` labels across all
  `filteredCompanies × 15` category cells and expresses each as a share of `filteredCompanies.length × 15`.
- **Methodology tab** (Tab 6) is static reference text pairing each category with a "preferred method" —
  this is a cosmetic `DQ_METHODS[i % 6]` cycling assignment, not a real method-suitability lookup.
- **Disclosure Status** (Tab 7) colour-codes each category's `reportingPct` (green ≥70%, amber ≥50%, red
  below) — a simple threshold rubric, no statistical basis given.

### 7.6 Data provenance & limitations

- **All company and category data is synthetic**, generated once via `sr(seed) = frac(sin(seed+1)×10⁴)`
  and held constant for the session — it does not represent real disclosures.
- Data-quality scores are uniform random draws, not derived from the `method` field they sit beside (a
  "Primary Data" cell can show DQ 1.5 while a "Spend-Based" cell shows DQ 4.5 purely by chance, so the two
  columns are not internally consistent in the demo data).
- No PCAF-style materiality weighting: `avgOverallDQ` is a flat mean across categories rather than
  emissions-weighted, understating the influence of large categories like Cat 1 and Cat 11.
- Reduction-target arithmetic is a static percentage cut with no adoption curve, cost curve, or year-by-year
  trajectory — contrast with the guide's stated formula
  `S3reduction_cat_i = BaselineEmissions_i × (1 − ReductionLever_j × AdoptionRate_j)`, which is not
  implemented in this page (the lever/adoption-rate structure described in the guide lives conceptually in
  `scope3_analytics_engine.py`'s `calculate_avoided_emissions`, but that function is not called from this
  page either).
- The backend `Scope3AnalyticsEngine.assess_dqs` implements a genuinely weighted DQS (3× weight for
  sector-dominant categories, honest nulls where inputs are absent) — a materially better methodology than
  this page's flat mean — but it is not wired to this route.

**Framework alignment:** GHG Protocol Corporate Value Chain (Scope 3) Standard 2011 for the 15-category
taxonomy and upstream/downstream split · GHG Protocol Technical Guidance 2013 for method taxonomy names ·
SBTi Scope 3 Guidance for the "material category" concept (>5% of total, referenced in guide text, not
enforced in code) · CDP Technical Note structure informs the disclosure-status framing. The page implements
the taxonomy and presentation layer of these standards; it does not implement their quantitative
calculation methods (spend-based EEIO factors, supplier PCF blending, PCAF Cat 15 attribution).

## 9 · Future Evolution

### 9.1 Evolution A — Wire the analytics engine with consistent DQ and weighted aggregation (analytics ladder: rung 1 → 2)

**What.** §7 finds a tier-A label over a client-side page: 50 seeded companies with all 15 Scope 3 categories, zero backend calls despite `scope3_analytics_engine.py` existing unwired; data-quality scores are uniform random draws internally inconsistent with the `method` field beside them (a "Primary Data" cell can show DQ 4.5-worse than a "Spend-Based" cell by chance); `avgOverallDQ` is a flat mean rather than emissions-weighted, understating Cat 1/Cat 11 influence; and reduction targets are static percentage cuts with no year-by-year path. Evolution A wires the engine and makes the deep-dive categories (1, 4, 11, 15) genuinely deep.

**How.** (1) Company/category data comes from `scope3-engine`'s deterministic estimation over real portfolio holdings (that sibling already computes all 15 categories from `GLOBAL_COMPANY_MASTER` financials — this module should consume its output, not maintain a second seeded universe). (2) DQ derived from method: a documented method→DQ-band mapping (primary data 1–2, activity-based 2–3, spend-based 4–5, per PCAF/Pathfinder conventions) so the two columns can't contradict; user overrides allowed with evidence notes. (3) Aggregation emissions-weighted (`Σ DQ×emissions / Σ emissions`) as §7.6 prescribes. (4) Category deep-dives gain their promised mechanics via the unwired engine: Cat 1 supplier-engagement ROI from supplier-level intensity spreads, Cat 11 use-phase modelling from product energy assumptions, Cat 15 delegating to the platform's PCAF financed-emissions logic. (5) Reduction pathways become year-by-year trajectories with named levers.

**Prerequisites.** Sibling-engine output contract; method→DQ mapping documented. **Acceptance:** a company's Cat-1 figure here equals `scope3-engine`'s for the same inputs; DQ is consistent with method by construction; weighted DQ shifts when a large category's quality changes while the flat mean wouldn't.

### 9.2 Evolution B — Category-strategy copilot for reduction planning (LLM tier 2)

**What.** The module's four focus categories each have distinct reduction playbooks; the copilot matches diagnosis to play: "Cat 1 is 62% of our footprint at DQ 4.1 — sequence the data-quality uplift and supplier-engagement moves, with the emissions-weighted DQ improvement each step buys", "model Cat 11 under a 20% product-efficiency improvement" — each quantified via tool calls to the engagement-ROI and pathway endpoints.

**How.** Tier-2 tool schemas over the Evolution-A endpoints; recommendations draw from a per-category lever library (supplier data programs, logistics modal shift, product design, portfolio reallocation) grounded in the GHG Protocol category guidance chunked into the corpus, with each suggested lever's impact computed, not asserted. DQ-uplift sequencing uses the weighted-aggregation math so the copilot targets high-emissions categories first — the analytically right order the flat mean obscured. SBTi coverage checks (67% Scope 3 threshold) evaluate the actual computed shares. All tonnes and percentages validated against tool output.

**Prerequisites (hard).** Evolution A — sequencing advice from internally contradictory seeded DQ would be wrong in direction, not just magnitude; lever library authored. **Acceptance:** every lever impact reproduces from an endpoint call; DQ-uplift plans order by emissions weight verifiably; SBTi coverage claims match computed shares.