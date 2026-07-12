# Water Stress Analytics
**Module ID:** `water-stress` · **Route:** `/water-stress` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
WRI Aqueduct-based water stress mapping for portfolio companies and their operations. Covers baseline water stress, drought risk, groundwater depletion, and corporate water stewardship scoring.

> **Business value:** Water stress is a material operational risk for manufacturing, agriculture, mining, and energy sectors. Regulators and TNFD are increasingly requiring nature-related disclosures including water. This module quantifies water risk at asset and portfolio level for informed engagement and investment decisions.

**How an analyst works this module:**
- Stress Map overlays operations on WRI Aqueduct watershed stress
- Portfolio Heat Map ranks companies by water-stressed revenue exposure
- CDP Water Security shows company water stewardship scores
- Target Tracker monitors corporate water reduction targets
- AWS Certification shows which companies hold Alliance for Water Stewardship certification

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CDP_WATER_TIERS`, `COUNTRY_NAMES`, `Card`, `CustomTooltip`, `KpiCard`, `PIE_COLORS`, `SECTOR_WATER_INTENSITY`, `Section`, `SortHeader`, `TabBar`, `WATER_RISK_BY_COUNTRY`, `WATER_STRESS_TREND`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `WATER_STRESS_TREND` | 7 | `global`, `india`, `china`, `us`, `sa`, `australia` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CDP_WATER_TIERS` | `{ A: 'Leadership', 'A-': 'Leadership', B: 'Management', 'B-': 'Management', C: 'Awareness', 'C-': 'Awareness', D: 'Disclosure', 'D-': 'Disclosure', F: 'Non-response' };` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `intensityFactor` | `sInt.withdrawal_ml_per_mn / 2500;` |
| `waterRisk` | `Math.min(5, cRisk.overall * 0.6 + intensityFactor * 2 + s * 0.5);` |
| `waterIntensity` | `Math.round(sInt.withdrawal_ml_per_mn * (0.7 + s * 0.6));` |
| `revenueAtRisk` | `Math.round(sInt.water_dependent_revenue_pct * (company.weight \|\| 0.01) * 100);` |
| `cdpOptions` | `['A', 'A-', 'B', 'B-', 'C', 'C-', 'D', 'F', 'F', 'F'];` |
| `cdpScore` | `cdpOptions[Math.floor(s * cdpOptions.length)];` |
| `scoredHoldings` | `useMemo(() => { return portfolio.map((c, i) => ({ ...c, ...scoreWaterRisk(c, i) }));` |
| `metrics` | `useMemo(() => { const avgRisk = scoredHoldings.length ? Math.round(scoredHoldings.reduce((s, h) => s + h.waterRisk, 0) / scoredHoldings.length * 10) / 10 : 0;` |
| `highStressPct` | `scoredHoldings.length ? Math.round((highStress / scoredHoldings.length) * 100) : 0;` |
| `totalWithdrawal` | `scoredHoldings.reduce((s, h) => s + h.waterIntensity, 0);` |
| `avgIntensity` | `scoredHoldings.length ? Math.round(totalWithdrawal / scoredHoldings.length) : 0;` |
| `extremeCountries` | `[...new Set(scoredHoldings.filter(h => h.countryRisk?.overall >= 3.8).map(h => h.country))].length;` |
| `droughtPct` | `scoredHoldings.length ? Math.round((droughtExposed / scoredHoldings.length) * 100) : 0;` |
| `floodPct` | `scoredHoldings.length ? Math.round((floodExposed / scoredHoldings.length) * 100) : 0;` |
| `avgWaterDepRev` | `scoredHoldings.length ? Math.round(scoredHoldings.reduce((s, h) => s + h.sectorIntensity.water_dependent_revenue_pct, 0) / scoredHoldings.length) : 0;` |
| `countryData` | `useMemo(() => { return Object.entries(WATER_RISK_BY_COUNTRY).map(([code, risk]) => ({ code, name: COUNTRY_NAMES[code], ...risk, holdingsCount: scoredHoldings.filter(h => h.country === code).length, })).sort((a, b) => b.overall - a.overall);` |
| `stressDistribution` | `useMemo(() => { const cats = { 'Extremely High': 0, 'High': 0, 'Medium-High': 0, 'Medium': 0, 'Low-Medium': 0, 'Low': 0 };` |
| `sectorIntensityData` | `useMemo(() => { return Object.entries(SECTOR_WATER_INTENSITY).map(([sector, data]) => ({ sector: sector.length > 14 ? sector.slice(0, 12) + '..' : sector, fullSector: sector, withdrawal: data.withdrawal_ml_per_mn, consumption: data.consumption_ml_per_mn, })).sort((a, b) => b.withdrawal - a.withdrawal);` |
| `pricingScenario` | `useMemo(() => { const multiplier = pricingIncrease / 100;` |
| `costIncrease` | `Math.round(h.waterIntensity * multiplier * 0.15);` |
| `revImpactPct` | `Math.round((costIncrease / (h.revenueAtRisk + 1)) * 100 * 10) / 10;` |
| `physRegScatter` | `useMemo(() => { return countryData.map(c => ({ name: c.name, physical: c.physical, regulatory: c.regulatory, holdings: c.holdingsCount, code: c.code, }));` |
| `rows` | `sorted.map(h => [h.name, h.country, h.sector, h.waterRisk, h.baselineStress, h.droughtRisk, h.floodRisk, h.waterIntensity, h.cdpScore, h.revenueAtRisk].join(','));` |
| `blob` | `new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });` |
| `data` | `{ countryRisks: WATER_RISK_BY_COUNTRY, sectorIntensity: SECTOR_WATER_INTENSITY, holdings: sorted.map(h => ({ name: h.name, country: h.country, sector: h.sector, waterRisk: h.waterRisk, cdpScore: h.cdpScore })) };` |
| `labels` | `tier.split(' / ').map(t => t.trim());` |
| `tierNames` | `['Leadership', 'Management', 'Awareness', 'Disclosure', 'Non-response'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PIE_COLORS`, `WATER_STRESS_TREND`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| High Stress Threshold | — | Aqueduct | Withdrawal vs renewable freshwater supply ratio |
| Extremely High Stress | — | Aqueduct | Locations at highest competition for water resources |
| MENA/South Asia Concentration | — | Aqueduct | Proportion of high-stress assets in these regions |
- **Operational site geolocation** → Aqueduct watershed overlay → **Site-level water stress score**
- **Revenue by geography** → Stress-weighted calculation → **Water-at-risk revenue exposure**
- **CDP water data** → Stewardship assessment → **Corporate water rating**

## 5 · Intermediate Transformation Logic
**Methodology:** WRI Aqueduct water risk framework
**Headline formula:** `WaterRisk = Baseline_stress × Interannual_variability × Seasonal_variability × Drought_severity`

Aqueduct 4.0: watershed-level indicators for 5 physical, 5 regulatory, 5 reputational categories. Baseline water stress = withdrawals / available supply. High stress = >40% withdrawal ratio. Extremely high = >80%.

**Standards:** ['WRI Aqueduct 4.0', 'CDP Water Security', 'AWS Alliance for Water Stewardship']
**Reference documents:** WRI Aqueduct Water Risk Atlas 4.0; CDP Water Security 2024 Global Report; Alliance for Water Stewardship Standard; TNFD V1.0 (water freshwater guidance)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The guide states `WaterRisk = Baseline_stress ×
> Interannual_variability × Seasonal_variability × Drought_severity` — a **multiplicative** 4-factor
> product. The code's `scoreWaterRisk()` instead computes a **weighted additive** combination of just
> 2 real factors (country baseline stress, sector water intensity) plus a random noise term, and never
> uses interannual/seasonal variability or drought severity as multipliers at all. That said, this
> module is comparatively well-grounded: it scores a **real portfolio** (`GLOBAL_COMPANY_MASTER`)
> against **real per-country and per-sector reference tables**, not a fully synthetic universe.

### 7.1 What the module computes

```js
intensityFactor = sectorIntensity.withdrawal_ml_per_mn / 2500              // normalised to Utilities' 2500 ceiling
waterRisk       = min(5, countryRisk.overall × 0.6 + intensityFactor × 2 + sr(idx+13) × 0.5)
waterIntensity  = round(sectorIntensity.withdrawal_ml_per_mn × (0.7 + sr(idx+13) × 0.6))
revenueAtRisk   = round(sectorIntensity.water_dependent_revenue_pct × (company.weight || 0.01) × 100)
cdpScore        = weighted-random letter grade (10-option array skewed toward F: 3 of 10 slots are 'F')
```

Applied to every holding in the real `GLOBAL_COMPANY_MASTER` portfolio, keyed by each company's
`country` (looked up in `WATER_RISK_BY_COUNTRY`, 14 countries) and `sector` (looked up in
`SECTOR_WATER_INTENSITY`, 11 GICS-style sectors).

### 7.2 Parameterisation — real reference tables

| Country | `overall` (1–5) | `baseline_stress` label |
|---|---|---|
| India | 4.2 | Extremely High |
| South Africa | 3.8 | Extremely High |
| China | 3.8 | High |
| Australia | 3.5 | High |
| Singapore | 3.0 | High |
| US | 2.8 | Medium-High |
| Canada | 1.8 | Low |

These are plausible, directionally-correct point estimates consistent with published WRI Aqueduct
country rankings (India, South Africa and China are indeed among the most water-stressed major
economies) but are hand-curated constants in the component, not a live Aqueduct API pull.

| Sector | `withdrawal_ml_per_mn` | `water_dependent_revenue_pct` |
|---|---|---|
| Utilities | 2,500 | 95% |
| Materials | 1,200 | 92% |
| Energy | 850 | 85% |
| Financials | 25 | 5% |

The 2,500 ML/$M-revenue Utilities figure is used as the **normalisation ceiling** for
`intensityFactor` — i.e. Utilities companies always contribute the maximum intensity signal (2.0 to
`waterRisk`), which is a reasonable modelling choice (thermal/hydro cooling water use dominates
utility water footprints) even though the guide doesn't describe this normalisation approach.

### 7.3 Calculation walkthrough

1. `scoredHoldings` applies `scoreWaterRisk()` to every row of the real portfolio.
2. Portfolio KPIs (`metrics`) aggregate `scoredHoldings`: `avgRisk`, `highStressPct` (share with
   `waterRisk ≥ 4.0`, i.e. "High"/"Extremely High" per `riskColor` thresholds), `avgIntensity`,
   `extremeCountries` (distinct countries with `countryRisk.overall ≥ 3.8`), `droughtPct`/`floodPct`
   (share exposed to "High"/"Extremely High"/"Very High" country-level drought/flood labels),
   `avgWaterDepRev`.
3. **Pricing Scenario tool** (What-If tab): a `pricingIncrease` slider (% water-price increase)
   computes `costIncrease = waterIntensity × multiplier × 0.15` and `revImpactPct = costIncrease /
   (revenueAtRisk+1) × 100` per holding — a simple pass-through elasticity (15% of intensity flows to
   cost per 100% price rise), not a demand-elasticity or substitution model.
4. Country/sector reference tables are also rendered directly (`countryData`, `sectorIntensityData`)
   so a user can see the underlying constants that drove each holding's score.

### 7.4 Worked example

A Utilities-sector holding domiciled in India, portfolio `weight = 0.02` (2%):

```
countryRisk.overall = 4.2 (India)
sectorIntensity.withdrawal_ml_per_mn = 2500 (Utilities)
intensityFactor = 2500/2500 = 1.0
s = sr(idx+13)  — take s ≈ 0.5 for illustration
waterRisk = min(5, 4.2×0.6 + 1.0×2 + 0.5×0.5) = min(5, 2.52+2.0+0.25) = min(5, 4.77) = 4.77 → "Extremely High" band (≥4.0)
waterIntensity = round(2500 × (0.7+0.5×0.6)) = round(2500×1.0) = 2,500
revenueAtRisk = round(95 × 0.02 × 100) = round(190) = 190   [note: this exceeds the company's own weight-scaled revenue base — see limitations]
```

### 7.5 Data provenance & limitations

- **Country and sector reference tables are real, hand-curated point estimates** consistent with
  published WRI Aqueduct country rankings — a genuine improvement over sibling modules that generate
  country/sector data via `sr()`.
- **The formula is additive, not multiplicative**, and omits the guide's cited interannual/seasonal
  variability and drought-severity factors entirely — country-level `drought_risk`/`flood_risk`
  labels exist in `WATER_RISK_BY_COUNTRY` but are surfaced only as descriptive badges, never entered
  into the `waterRisk` formula.
- `revenueAtRisk`'s formula (`water_dependent_revenue_pct × weight × 100`) produces a number whose
  units are ambiguous — multiplying a percentage by a portfolio weight and by 100 again does not
  correspond to a clearly-labelled dollar or percentage-of-portfolio quantity; a bank model-validation
  reviewer would flag this for a units/dimensional-analysis check.
- `cdpScore` is a random letter grade **uncorrelated with `waterRisk`** — a company scored 4.77
  "Extremely High" water risk is exactly as likely to draw a CDP "A" (Leadership) grade as a "F"
  (Non-response), which is not realistic (high-risk, well-managed companies should skew toward
  better CDP grades, and the correlation's absence understates how CDP disclosure quality relates to
  underlying exposure).

**Framework alignment:** WRI Aqueduct 4.0 country risk (approximated via hand-curated constants, not
live indicator data) · CDP Water Security tiers (label mapping correct — `CDP_WATER_TIERS` faithfully
reproduces the A/A-/B/B-/C/C-/D/D-/F → Leadership/Management/Awareness/Disclosure/Non-response
mapping — but the grade itself is unscored) · Alliance for Water Stewardship (named in the guide,
not implemented as a certification field in this module).

## 9 · Future Evolution

### 9.1 Evolution A — Multiplicative Aqueduct formula with real CDP correlation (analytics ladder: rung 2 → 3)

**What.** The module already scores a real portfolio (`GLOBAL_COMPANY_MASTER`) against
real hand-curated country and sector reference tables — §7.5 credits this as a genuine
improvement over synthetic siblings — but four documented gaps remain. The formula is
additive over 2 factors while the guide specifies the multiplicative 4-factor Aqueduct
product; the country table's `drought_risk`/`flood_risk` labels are surfaced as badges
but never enter `waterRisk`; `revenueAtRisk`'s units are dimensionally ambiguous
(`pct × weight × 100` — §7.4's worked example yields 190 of nothing in particular);
and `cdpScore` is a random letter grade uncorrelated with computed risk, so an
"Extremely High" holding draws an A as easily as an F. Evolution A implements the
stated multiplicative form (baseline stress × interannual × seasonal × drought, using
the variability fields the platform's Aqueduct seed data carries for the sibling
`water-risk-analytics` module), fixes `revenueAtRisk` to a defined unit
(% of portfolio revenue, documented), and replaces the random CDP grade with either
real CDP public-response data where available or an engine-derived stewardship proxy
correlated with exposure — never an uncorrelated draw.

**How.** Move scoring into the shared `water_risk_engine` (this page is Tier B with no
backend calls today, despite the engine existing); pin the §7.4 India-Utilities worked
example in `bench_quant` after the formula change; keep the pricing-scenario slider,
re-based on the corrected intensity units.

**Prerequisites.** The random-CDP-grade fabrication acknowledged and removed; decision
on multiplicative weights documented. **Acceptance:** drought-labelled countries
score higher than identical non-drought peers; `revenueAtRisk` has a stated unit that
sums sensibly across the portfolio; CDP grades are sourced or explicitly proxied,
never random.

### 9.2 Evolution B — Portfolio water-engagement copilot (LLM tier 2)

**What.** The module's stated use is "informed engagement and investment decisions" —
an analyst workflow of ranking, questioning, and drafting engagement letters.
Evolution B is a tool-calling assistant over the corrected scoring: "rank our
holdings by water-stressed revenue exposure, show which lack credible CDP disclosure,
and draft an engagement letter for the worst three." It calls the new scoring
endpoint per holding, the pricing-scenario computation as a tool ("what if water
prices double in India?"), and drafts letters citing each company's computed
waterRisk, sector intensity benchmark, and disclosure gap — every figure traceable,
with the reference-table provenance (hand-curated Aqueduct-consistent constants, per
§7.2) stated when asked.

**How.** Tier-2 stack: tool schemas from Evolution A's endpoints; grounding corpus is
this Atlas page plus the country/sector reference tables themselves (already rendered
on-page, so user and copilot see the same constants). Engagement letters are drafts
for human review, logged to `llm_traces`.

**Prerequisites (hard).** Evolution A — engagement letters citing a random CDP grade
would be reputationally dangerous; portfolio data access under the user's RBAC scope.
**Acceptance:** letter figures all appear in tool outputs; a company whose CDP status
is proxied is described as such in the letter; asked for basin-level detail this
module doesn't hold, the copilot points to the water-risk-analytics module instead of
inventing it.