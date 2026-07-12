# Scope 3 Materiality Engine
**Module ID:** `scope3-materiality-engine` · **Route:** `/scope3-materiality-engine` · **Tier:** A (backend vertical) · **EP code:** EP-CM4 · **Sprint:** CM

## 1 · Overview
15 Scope 3 categories with sector-level materiality ranking, data quality scoring, and improvement roadmap.

**How an analyst works this module:**
- Category Materiality Map ranks 15 categories by sector
- Data Quality shows DQ score per category
- Improvement Roadmap prioritizes DQ upgrades by cost-benefit

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `DQ_COLORS`, `DQ_LABELS`, `SECTORS`, `SECTOR_DATA`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CATEGORIES` | 16 | `name`, `short` |

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
| `Scope3AnalyticsEngine.assess_sbti_scope3` | entity_id, sector, scope3_tco2e, supplier_engagement_pct, downstream_coverage_pct, flag_tco2e, current_reduction_rate_pa |  |
| `Scope3AnalyticsEngine.calculate_avoided_emissions` | entity_id, product_type, annual_units_sold, baseline_product_emission_factor, product_emission_factor, methodology, displacement_factor, additionality_score |  |
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

15 Scope 3 categories ranked by materiality per sector. Data quality 1-5 per category. Cat 11 (Use of Products) dominant for O&G; Cat 1 (Purchased Goods) dominant for retail. Improvement roadmap: cost-benefit of upgrading DQ from level 4 to level 2.

**Standards:** ['GHG Protocol Scope 3', 'CDP Supply Chain']
**Reference documents:** GHG Protocol Scope 3 Standard; CDP Supply Chain Programme

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
| `scope3-engine` | engine:scope3_analytics_engine |
| `scope3-category-analytics` | engine:scope3_analytics_engine |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

The page is driven entirely by a hand-authored lookup table `SECTOR_DATA` — 6 sectors (Energy, Tech,
Consumer, Auto, Finance, Materials), each with a fixed 15-element `mat[]` (materiality %, 0–100) array and
a matching 15-element `dq[]` (data-quality level, 1–5) array, plus a scalar `engagement` %. There is no
`sr()` PRNG and no per-company universe — every number a user sees is a static constant selected by the
`sector` toggle.

```js
matData = CATEGORIES.map((c,i) => ({ ...c, materiality: sd.mat[i], dq: sd.dq[i] })).sort(desc by materiality)
top5    = matData.slice(0, 5)
dqDist  = [1..5].map(level => count of categories at that DQ level)
roadmap = top5.map(c => ({ targetDQ: max(1, dq-2), costM: (dq-targetDQ)×0.4, benefitPct: (dq-targetDQ)×12 }))
```

### 7.2 Parameterisation

| Sector | Cat 1 materiality | Cat 11 materiality | Cat 15 materiality | Engagement % |
|---|---|---|---|---|
| Energy | 95 | 98 | 5 | 42% |
| Finance | 30 | 5 | **98** | 28% |
| Auto | 80 | **95** | 2 | 45% |
| Tech | 85 | 70 | 3 | 55% |

Provenance: values are **hand-authored synthetic constants**, not computed from any formula or seed. They
are directionally faithful to real-world Scope 3 hotspot patterns (Finance dominated by Cat 15 financed
emissions, Auto/Energy dominated by Cat 11 use-of-product, matching CDP Supply Chain sector studies cited
in the guide) but carry no statistical derivation — there is no code path that computes materiality from
emissions share, only a static table that was pre-set to look correct.

| DQ level | Label | Colour |
|---|---|---|
| 1 | Primary Supplier | green |
| 2 | Verified Secondary | teal |
| 3 | Industry Average | blue |
| 4 | Spend-Based | amber |
| 5 | Extrapolated | red |

This 1–5 scale mirrors the platform-standard PCAF-style data-quality convention (1=best/primary,
5=worst/estimated) used consistently across PCAF Financed Emissions and other modules.

### 7.3 Calculation walkthrough

1. User selects a sector; `sd = SECTOR_DATA[sector]` supplies the two 15-element arrays for that sector.
2. `matData` zips `CATEGORIES` (id/name/short) with `sd.mat`/`sd.dq` and sorts descending by materiality —
   this ordering drives the Tab-0 horizontal bar chart and the Tab-0 pie chart of `top5`.
3. `dqDist` is a simple histogram of the 15 `dq` values into 5 buckets — feeds the Tab-1 pie chart and
   Tab-3 methodology-distribution cards.
4. **Improvement Roadmap** (Tab 5) is purely arithmetic, not optimisation-based: for each of the top-5
   material categories, `targetDQ = max(1, currentDQ − 2)` (an always-minus-2 heuristic, not
   cost-benefit-selected), `costM = ΔDQ × $0.4M`, `benefitPct = ΔDQ × 12%`. A category already at DQ 1 or 2
   shows zero or negative-clamped cost/benefit.
5. **Cross-Sector Benchmark** (Tab 4) re-slices `CATEGORIES[0..7]` (Cat 1–8 only) across all 6 sectors into
   a grouped bar chart, directly from the same static `SECTOR_DATA.mat` arrays.

### 7.4 Worked example

Energy sector, Category 1 (materiality 95, dq 3 = Industry Average):

| Step | Computation | Result |
|---|---|---|
| Target DQ | `max(1, 3-2)` | 1 (Primary Supplier) |
| Est. cost | `(3-1) × 0.4` | $0.8M |
| Benefit | `(3-1) × 12` | +24% (interpreted as DQ-improvement %, not emissions accuracy %) |
| Avg DQ Score (header KPI) | `Σ sd.dq / 15` for Energy: `[3,3,2,4,4,5,5,5,4,4,2,4,5,5,3]` | Σ=58 → 58/15 = **3.9** |

The header "Avg DQ Score" of 3.9 for Energy is consistent with a code walk-through of the literal array —
verified above by direct summation.

### 7.5 Companion analytics on the page

- **Supplier Engagement Rate by Sector** (Tab 2) derives `primary = engagement×0.6` and
  `estimated = 100−engagement` as chart series — the `×0.6` split of "engaged" suppliers into a "primary
  data" subset is another unexplained fixed multiplier, not sourced from `sd`.
- **Methodology footer** (Tab 5) states the platform-standard convention: "categories >5% of total Scope 3
  are material per SBTi criteria" — consistent with the GHG Protocol/SBTi materiality threshold referenced
  elsewhere on the platform, though the page does not actually apply a 5% cutoff rule anywhere in code (it
  always shows a fixed top-5, regardless of whether the 6th-ranked category is above or below 5%).

### 7.6 Data provenance & limitations

- **All materiality and DQ figures are static hand-authored constants** for 6 sectors × 15 categories —
  there is no per-company or per-portfolio computation; the page cannot reflect an actual customer's
  Scope 3 profile.
- The Improvement Roadmap's cost ($0.4M per DQ-point) and benefit (12% per DQ-point) multipliers are
  presented with no cited source — flag as synthetic demo values, not calibrated to real supplier
  data-collection program costs (which vary by orders of magnitude by category and supplier count).
- "Top 5" selection ignores the platform's own stated 5%-of-total materiality threshold; a sector where
  only 3 categories exceed 5% would still show 5 categories in the roadmap.
- No linkage to `backend/services/scope3_analytics_engine.py`'s `assess_dqs` (a genuinely weighted,
  sector-dominant-category-aware DQS calculation) — this page's numbers are independent of that engine.

**Framework alignment:** GHG Protocol Scope 3 Standard (15-category taxonomy) · CDP Supply Chain Programme
(sector materiality patterns referenced in guide, approximated by the static table) · PCAF-style 1–5
data-quality scale (label semantics match PCAF DQ Score conventions, though this module's use is
descriptive, not PCAF-calculated) · SBTi 5%-materiality-threshold concept named in UI copy but not enforced
in the selection logic.

## 9 · Future Evolution

### 9.1 Evolution A — Portfolio-specific materiality with a threshold-honest roadmap (analytics ladder: rung 1 → 2)

**What.** §7 describes a static lookup: 6 sectors × 15 categories of hand-authored materiality/DQ constants, no per-company computation at all (a tier-A label the page doesn't earn), a roadmap whose cost ($0.4M/DQ-point) and benefit (12%/DQ-point) multipliers are uncited synthetic values, and a "Top 5" that ignores the platform's own 5%-of-total materiality threshold — a sector with 3 material categories still shows 5. Evolution A computes materiality from the user's actual footprint.

**How.** (1) Materiality per category from `scope3-engine`'s per-company estimates aggregated over the user's portfolio or entity: `materiality_c = emissions_c / Σ emissions` — real shares replacing sector constants, with the hand-authored sector table retained as a benchmark overlay (its legitimate role). (2) The threshold implemented: roadmap membership by the documented 5% rule (plus SBTi's 67%-coverage requirement as a second lens), however many categories qualify. (3) DQ from the method→band mapping the Scope 3 cluster standardises on, per category per entity. (4) Roadmap economics re-based: cost per DQ-point parameterised by category supplier count and data-collection mode with cited ranges, or presented as user inputs — §7.6 notes real program costs vary by orders of magnitude, so a single multiplier is unrescuable. (5) Small backend route so the ranking is pinnable.

**Prerequisites.** Scope 3 cluster's shared estimate output (sibling dependency); threshold rules documented. **Acceptance:** materiality ranks change when the portfolio changes; roadmap length varies with how many categories clear 5%; every roadmap cost figure is either cited or user-entered — no orphan multipliers.

### 9.2 Evolution B — Materiality-assessment copilot for CSRD/SBTi scoping (LLM tier 1 → 2)

**What.** Materiality assessment is a documented judgment process (CSRD double-materiality, SBTi boundary setting) where users need both computation and justification text: "which Scope 3 categories must be in our SBTi boundary, and draft the exclusion justification for the ones below threshold", "compare our computed materiality profile against the sector benchmark and explain the divergences".

**How.** Tier 1: RAG over GHG Protocol category descriptions and SBTi/ESRS boundary rules (chunked with clause anchors) for the process questions. Tier 2: boundary determinations combine computed shares (tool calls) with the cited threshold rules — "Cat 9 at 2.1% of total, below the 5% threshold; cumulative coverage without it 94%, above SBTi's 67% floor" — and exclusion justifications are drafted from exactly those computed facts, the format assurance reviewers expect. Benchmark-divergence explanations use the sector overlay with its hand-authored provenance stated. Guardrails: boundary advice cites the rule applied; the copilot never asserts a category is immaterial without the computed share in hand.

**Prerequisites.** Evolution A's computed shares; rule corpus. **Acceptance:** every boundary determination quotes the share and the rule; exclusion drafts contain only computed facts; benchmark comparisons label the overlay's provenance.