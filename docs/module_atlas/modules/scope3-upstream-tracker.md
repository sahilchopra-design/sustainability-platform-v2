# Scope 3 Upstream Tracker
**Module ID:** `scope3-upstream-tracker` · **Route:** `/scope3-upstream-tracker` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Scope 3 upstream emission tracking across GHG Protocol Categories 1–8, combining supplier data, spend-based proxies and IO-LCA models for comprehensive value-chain accounting.

> **Business value:** Delivers comprehensive upstream Scope 3 accounting across all eight GHG Protocol categories with data quality tiering.

**How an analyst works this module:**
- Map procurement spend to GHG Protocol Scope 3 categories 1–8.
- Collect primary emission data via supplier portal; apply spend-based factors for gaps.
- Apply IO-LCA emission intensities from Exiobase for categories lacking supplier data.
- Aggregate by category, supplier tier and geography; report against prior year baseline.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `COMPANY_NAMES`, `COUNTRIES`, `CTooltip`, `ENGAGEMENT_STAGES`, `KPI`, `METHODOLOGIES`, `Pill`, `SECTORS`, `SUPPLIER_PREFIXES`, `SUPPLIER_SUFFIXES`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CATEGORIES` | 9 | `name`, `short`, `color`, `avgShare` |

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
| `emissions` | `Math.round(spend * (50 + sr(seed + 5) * 450));` |
| `fmt` | `n => { if (n >= 1e6) return (n/1e6).toFixed(1)+'M'; if (n >= 1e3) return (n/1e3).toFixed(1)+'K'; return String(n); };` |
| `pagedSuppliers` | `useMemo(() => filteredSuppliers.slice(suppPage * 25, (suppPage + 1) * 25), [filteredSuppliers, suppPage]);` |
| `engagementPipeline` | `useMemo(() => genEngagementPipeline(), []);  /* ── Category aggregates ──────────────────────────────────────────────────── */ const categoryAgg = useMemo(() => { const methKey = selMethodology === 'Spend-based' ? 'spendEmissions' : selMethodology === 'Activity-based' ? 'activityEmissions' : 'supplierSpecific';` |
| `vals` | `filteredCompanies.map(c => { const cc = c.categories.find(x => x.catId === cat.id); return cc ? cc[methKey] : 0; });` |
| `total` | `vals.reduce((a, b) => a + b, 0);` |
| `avg` | `Math.round(total / (filteredCompanies.length \|\| 1));` |
| `totalUpstream` | `useMemo(() => categoryAgg.reduce((a, c) => a + c.total, 0), [categoryAgg]);` |
| `stackedBarData` | `useMemo(() => { const methKey = selMethodology === 'Spend-based' ? 'spendEmissions' : selMethodology === 'Activity-based' ? 'activityEmissions' : 'supplierSpecific';` |
| `sorted` | `[...filteredCompanies].sort((a, b) => b.totalScope3 - a.totalScope3).slice(0, 30);` |
| `row` | `{ name: c.name.length > 12 ? c.name.slice(0, 12) + '..' : c.name, companyId: c.id };` |
| `hotspotData` | `useMemo(() => { const methKey = selMethodology === 'Spend-based' ? 'spendEmissions' : selMethodology === 'Activity-based' ? 'activityEmissions' : 'supplierSpecific';` |
| `supplierConcentration` | `useMemo(() => { const sorted = [...suppliers].sort((a, b) => b.emissions - a.emissions);` |
| `totalEm` | `sorted.reduce((a, s) => a + s.emissions, 0);` |
| `top10Em` | `sorted.slice(0, 10).reduce((a, s) => a + s.emissions, 0);` |
| `val` | `m === 'Spend-based' ? c.spendEmissions : m === 'Activity-based' ? c.activityEmissions : c.supplierSpecific;` |
| `scatterData` | `useMemo(() => [ { method:'Spend-based', accuracy:35, effort:10, color:'#0ea5e9' }, { method:'Activity-based', accuracy:65, effort:50, color:'#f59e0b' }, { method:'Supplier-specific', accuracy:92, effort:85, color:'#10b981' }, ], []);` |
| `scenarioResult` | `useMemo(() => { const sorted = [...suppliers].sort((a, b) => b.emissions - a.emissions);` |
| `topEm` | `topN.reduce((a, s) => a + s.emissions, 0);` |
| `reduction` | `Math.round(topEm * scenarioReduction / 100);` |
| `newTotal` | `totalEm - reduction;` |
| `stageCounts` | `useMemo(() => ENGAGEMENT_STAGES.map(s => ({` |
| `qLabel` | ``Q${(q%4)+1} ${2021+Math.floor(q/4)}`;` |

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

Applies sector-specific spend-based emission factors to procurement expenditure when primary supplier data is unavailable.

**Standards:** ['GHG Protocol Scope 3', 'Exiobase IO-LCA']
**Reference documents:** GHG Protocol Corporate Value Chain (Scope 3) Standard 2011; GHG Protocol Scope 3 Calculation Guidance 2013; Exiobase 3 Multi-Regional IO Table; ISO 14064-1:2018

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
| `scope3-materiality-engine` | engine:scope3_analytics_engine |
| `scope3-engine` | engine:scope3_analytics_engine |
| `scope3-category-analytics` | engine:scope3_analytics_engine |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

A synthetic universe of 120 named real-world-style companies (`COMPANY_NAMES`, e.g. "Apple Inc", "Shell
plc") each generated via the platform's seeded PRNG `sr(s)=frac(sin(s+1)×10⁴)` with `seed = i×137`. For
each company the engine produces sector, country, revenue, and per-category (Cat 1–8 only — **upstream
categories exclusively**) `spend`, `spendEmissions`, `activityEmissions`, `supplierSpecific` and a
1–5 `dqs` (data-quality score). A second generator produces 200 synthetic suppliers per company on demand
(`genSuppliers`, reseeded `companyId×10000 + i×31`), and a third produces a 40-row supplier engagement
pipeline independent of company selection.

```js
share          = catAvgShare × (0.5 + sr()×1.0)              // ±50% jitter around CATEGORIES[c].avgShare
spend          = share × revenue × (0.3 + sr()×0.4)
spendEmissions = totalScope3 × share                          // normalised to company totalScope3
activityEmissions   = spendEmissions × (0.6 + sr()×0.8)        // actFactor 0.6–1.4×
supplierSpecific     = spendEmissions × (0.4 + sr()×0.5)       // suppFactor 0.4–0.9×
```

`totalScope3` for each company is itself `Math.round(50,000 + sr()×4,950,000)`, i.e. an independent random
draw *before* the per-category shares are normalised back against it (`normTotal`), so the categories
always sum exactly to the company's own random `totalScope3`.

### 7.2 Parameterisation

| Category | `avgShare` | Colour |
|---|---|---|
| Cat 1 Purchased Goods | 0.42 | blue |
| Cat 8 Leased Assets | 0.14 | violet |
| Cat 3 Fuel & Energy | 0.12 | amber |
| Cat 4 Upstream Transport | 0.09 | green |
| Cat 2 Capital Goods | 0.08 | purple |
| Cat 6 Business Travel | 0.06 | pink |
| Cat 7 Commuting | 0.05 | cyan |
| Cat 5 Waste | 0.04 | red |

These 8 shares sum to 1.00 and set the *expected* category mix before the ±50% `sr()` jitter is applied —
directionally consistent with GHG Protocol guidance that Cat 1 dominates upstream Scope 3 for most sectors,
but the specific decimal weights are platform-authored, not sourced from a named study.

| Methodology (Tab 3 scatter) | Accuracy | Effort |
|---|---|---|
| Spend-based | 35 | 10 |
| Activity-based | 65 | 50 |
| Supplier-specific | 92 | 85 |

These 3 points are hardcoded constants (`scatterData`), illustrating the standard GHG Protocol accuracy/
effort trade-off narrative (spend-based = cheap & noisy, supplier-specific = expensive & precise) as a
fixed 3-point chart, not derived from the page's own generated data.

### 7.3 Calculation walkthrough

1. `genCompanies()` runs once (`useMemo([])`) producing the fixed 120-company universe for the session.
2. `selMethodology` (`Spend-based` / `Activity-based` / `Supplier-specific`) selects which of the three
   parallel emissions series (`spendEmissions` / `activityEmissions` / `supplierSpecific`) feeds every
   downstream aggregate — `categoryAgg`, `stackedBarData`, `hotspotData` all key off the same
   `methKey` switch, so **the "Methodology Comparison" tab is really a re-slice of the same underlying
   random seeds through three different scaling multipliers**, not three independently estimated pipelines.
3. `categoryAgg` sums the selected methodology's emissions across `filteredCompanies` per category, and
   `avg = total / filteredCompanies.length` (guarded).
4. `supplierConcentration`: sorts the 200 generated suppliers for the selected (or default id=1) company by
   `emissions` descending, then computes `top10Em / totalEm` — a supply-chain Pareto/HHI-style
   concentration read.
5. **Scenario tool** (`scenarioResult`): user picks `scenarioTop` (N largest suppliers) and
   `scenarioReduction` (% cut); `reduction = topEm × scenarioReduction/100`, `newTotal = totalEm −
   reduction` — a simple "engage top-N suppliers for X% cut" what-if, not an adoption-curve or cost-based
   model.
6. **Engagement Pipeline** stage counts (`stageCounts`) tally the fixed 40-row `engagementPipeline` across
   the 6 `ENGAGEMENT_STAGES` (Identified → Contacted → Data Shared → Target Set → Reducing → Verified).

### 7.4 Worked example

Company `id=1` ("Apple Inc"), seed base `137`: `revenue = round(5000 + sr(139)×195000)`,
`totalScope3 = round(50000 + sr(140)×4950000)`. For Cat 1 (`ci=0`, `avgShare=0.42`):

| Step | Computation | Result (illustrative, using representative `sr()` draws) |
|---|---|---|
| Jittered share | `0.42 × (0.5 + sr(137+0×7)×1.0)` | e.g. `0.42 × 1.1 ≈ 0.462` |
| `spendEmissions` | `totalScope3 × 0.462` | e.g. `2,100,000 × 0.462 ≈ 970,200` tCO₂e |
| `activityEmissions` | `spendEmissions × (0.6+sr()×0.8)` | e.g. `× 1.15 ≈ 1,115,730` tCO₂e |
| `supplierSpecific` | `spendEmissions × (0.4+sr()×0.5)` | e.g. `× 0.72 ≈ 698,544` tCO₂e |

The three methodology columns for the same category can differ by 30–60% purely from the independent
jitter factors — this variance is illustrative of real-world methodology divergence but is manufactured by
the RNG, not measured.

### 7.5 Companion analytics on the page

- **Supplier drill-down table** (200 rows/company): filterable by category, country, DQS, minimum spend;
  each supplier carries `intensity = emissions/spend` (tCO₂e per $M), an `engaged` boolean (`sr() > 0.65` →
  ~35% engaged), and an `ENGAGEMENT_STAGES` value independent of the `engaged` flag.
  supplied consistency issue between `engaged` bool and `stage` labels is one already-known pattern on this
  page — verify at runtime if both are surfaced together, since they are drawn from independent seeds.
- **Quarterly trend** — 12 quarters per company at `normTotal/4 × (0.85 + sr()×0.3)`, i.e. random walk
  around a flat quarterly run-rate, not a directional trend.

### 7.6 Data provenance & limitations

- **Entirely synthetic data** for all 120 companies and up to 24,000 (120×200) suppliers, generated by
  `sr(seed)=frac(sin(seed+1)×10⁴)`. Company names are real (recognisable large-caps) but every quantitative
  field — revenue, Scope 3 totals, category splits, supplier lists, engagement stages, CDP scores — is
  fabricated per-session from the seed, not linked to `frontend/src/data/referenceData.js`'s
  `EMISSION_FACTORS`/`SECTOR_BENCHMARKS` imports (imported but not visibly used in the excerpted
  calculation paths).
- Because all three "methodologies" reuse the *same* `spendEmissions` base and merely apply an independent
  random multiplier, the Methodology Comparison tab cannot demonstrate a genuine convergence/divergence
  pattern between methods — a production implementation would compute activity-based and supplier-specific
  estimates from actually different input data (physical activity volumes, supplier-submitted PCFs).
- The reduction-scenario tool is a linear "cut top-N suppliers by X%" heuristic with no cost curve,
  adoption timeline, or feasibility constraint — contrast with the guide's stated formula
  `S3reduction_cat_i = BaselineEmissions_i × (1 − ReductionLever_j × AdoptionRate_j)`, which is not
  implemented here.
- Only Cat 1–8 (upstream) are modelled — consistent with the module's stated scope ("Scope 3 Upstream
  Tracker") — downstream Cat 9–15 are out of scope by design, not a gap.

**Framework alignment:** GHG Protocol Corporate Value Chain (Scope 3) Standard — Cat 1–8 upstream category
definitions and the spend-based/activity-based/supplier-specific method taxonomy (GHG Protocol Ch.7) ·
Exiobase IO-LCA referenced in the guide as the spend-based factor source (not concretely wired in this
file) · the accuracy/effort scatter (35/10, 65/50, 92/85) operationalises the standard GHG Protocol
guidance that data quality improves, at increasing cost, moving from spend-based toward supplier-specific
primary data.

## 9 · Future Evolution

### 9.1 Evolution A — A real supplier ledger with genuinely independent methodologies (analytics ladder: rung 1 → 2)

**What.** §7.6 documents scale-out fabrication: 120 real company names × up to 200 synthetic suppliers each (24,000 fabricated supplier rows), every quantitative field seeded; the imported `EMISSION_FACTORS`/`SECTOR_BENCHMARKS` reference data goes unused; and the Methodology Comparison tab is structurally hollow — all three "methodologies" reuse the same `spendEmissions` base with independent random multipliers, so it cannot demonstrate real spend-based vs activity-based vs supplier-specific convergence. Evolution A rebuilds around a real supplier ledger where the three methods are computed independently, which is the tab's entire point.

**How.** (1) `supplier_ledger` tables: user-imported procurement data (supplier, spend, category 1–8 mapping, country) — the input upstream Scope 3 actually starts from. (2) Three genuinely independent estimates per supplier line: spend-based (spend × EEIO factor from the Scope 3 cluster's versioned factor table), activity-based (where activity data is entered: tonnes-km for Cat 4, kWh for energy categories), supplier-specific (supplier-reported PCF/allocation where provided) — the comparison tab then shows real divergence, the diagnostic signal practitioners use to prioritise data collection. (3) DQ per line from method used (the cluster's shared mapping); engagement pipeline rows attach to actual ledger suppliers with status history. (4) The 120-company demo book deleted — real names with fabricated supplier networks is the pattern to purge.

**Prerequisites.** Procurement-import format (CSV with category mapping assistance); factor-table dependency on `scope3-engine`'s Evolution A. **Acceptance:** the three method columns for a supplier line derive from different inputs and can genuinely disagree; portfolio Cat 1–8 totals reproduce from ledger sums; no seeded supplier rows remain.

### 9.2 Evolution B — Supplier-engagement campaign copilot (LLM tier 2)

**What.** Upstream Scope 3 improvement is a supplier-outreach campaign problem: "which 20 suppliers cover 60% of our Cat 1 spend-based estimate and lack supplier-specific data? Draft the data-request pack for each", "where do spend-based and supplier-reported figures diverge by >40% — and what should we ask those suppliers?" The copilot runs the prioritisation queries and drafts the outreach, the genuinely LLM-shaped half of the workflow.

**How.** Tier-2 tool calls over the ledger/estimate/divergence endpoints; prioritisation is computed coverage math, and data-request drafts are populated from each supplier's actual ledger context (categories, spend band, current method) following Pathfinder/CDP supply-chain request conventions in the corpus. Divergence follow-ups cite both figures with their methods and vintages. Engagement-pipeline updates (stage changes as responses arrive) remain human-confirmed mutations. Guardrails: outreach drafts never state the supplier's emissions as fact — they state the buyer's current estimate and its method, requesting primary data; all counts and coverage percentages validated against tool output.

**Prerequisites (hard).** Evolution A's ledger — drafting outreach to 24,000 fabricated suppliers is the reductio of the current design; request-pack templates. **Acceptance:** priority lists reproduce from coverage queries; each draft's figures match the supplier's ledger line; divergence answers quote both methods' computed values.