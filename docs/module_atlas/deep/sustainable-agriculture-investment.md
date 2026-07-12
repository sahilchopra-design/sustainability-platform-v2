## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide specifies two named formulas: `ROI_regen =
> (YieldMaintained×Price + CarbonCredit×CarbonPrice + WaterSavings×WaterPrice − TransitionCost) /
> TransitionCost` and `SoilCarbonSeq = ΔSOC × BulkDensity × Depth × Area`, both grounded in Verra
> VM0042 and SBTi FLAG methodology. **Neither formula is computed anywhere in the 419-line file.**
> The 9-row `REGEN_PRACTICES` table (Cover Cropping, No-Till, Crop Rotation, Agroforestry, Compost,
> IPM, Precision Irrigation, Biochar) carries hand-authored `carbonSeq` (tCO₂e/ha/yr) and `payback`
> (years) columns that *look like* ROI/SoilCarbonSeq outputs but are static literals, not derived
> from yield, price, carbon-price, water-savings, or transition-cost inputs anywhere in the code.
> There is also no SBTi FLAG screener despite being named in the guide's data lineage. Sections below
> document the module as a **static reference dashboard**, not a calculation engine.

### 7.1 What the module computes

7 tabs (Overview, Regen Ag Finance, Green Bonds, ROI Analytics, Impact, Portfolio, Opportunities)
over three hand-authored reference datasets: 18 named real-world-styled agri/farmland/forestry funds
(`FUNDS`, `sr()`-seeded AUM/return/impact-score/carbon-intensity fields), 10 named green/
sustainability-linked bonds (`GREEN_BONDS`, `sr()`-seeded volume/coupon/greenium), and the 9 static
regenerative-practice rows described above. A 7-year synthetic returns time series (`RETURN_SERIES`,
2018–2024) compares farmland/forestry/agri-bonds/alt-protein/baseline return trajectories.

### 7.2 The only live calculations

```js
totalAUM   = Σ filteredFunds.aum
avgReturn  = filteredFunds.length ? Σ actualReturn / filteredFunds.length : '–'
avgImpact  = filteredFunds.length ? Σ impactScore / filteredFunds.length : '–'
sortedPractices = [...REGEN_PRACTICES].sort by selected column (adoption/yieldImpact/carbonSeq/cost/payback)
```

All four are plain unweighted means/sums over the (possibly fund-type-filtered) 18-fund array, with a
correct zero-length guard (`'–'` fallback, avoiding NaN on an empty filter result). `sortedPractices`
is a client-side table sort with no aggregation.

### 7.3 Reference data as displayed (not computed)

| Practice | Adoption % | Yield Impact | Carbon Seq (tCO₂e/ha/yr) | Cost ($/ha) | Payback (yr) |
|---|---|---|---|---|---|
| Cover Cropping | 28 | +2% | 0.8 | 45 | 3.2 |
| No-Till/Reduced Till | 42 | +1% | 1.2 | 25 | 2.1 |
| Crop Rotation | 55 | +4% | 0.5 | 15 | 1.5 |
| Agroforestry | 12 | +6% | 3.8 | 180 | 7.8 |
| Compost Application | 18 | +5% | 0.9 | 120 | 4.5 |
| Integrated Pest Mgmt | 35 | +3% | 0.2 | 60 | 2.8 |
| Precision Irrigation | 24 | +7% | 0.1 | 350 | 5.2 |
| Biochar Application | 6 | +3% | 2.5 | 280 | 9.1 |

These figures are directionally consistent with published regenerative-agriculture literature (e.g.
agroforestry's high sequestration-per-hectare but long payback, no-till's low cost and fast payback)
but each cell is a single point value, not derived from a `ΔSOC × BulkDensity × Depth × Area`
calculation or a `(revenue − transition cost)/transition cost` ROI formula — there is no `Price`,
`CarbonPrice`, or `WaterSavings` variable anywhere in the file to plug into the guide's formula.

### 7.4 Worked example (what the code actually shows, vs. what the guide implies)

Selecting `practiceSort='carbonSeq'` sorts the 9 practices descending by `carbonSeq`: Agroforestry
(3.8) → Biochar (2.5) → No-Till (1.2) → Compost (0.9) → Cover Cropping (0.8) → IPM (0.2) → Precision
Irrigation (0.1) → Crop Rotation (0.5, misordered relative to IPM under a naive read — actually 0.5 >
0.2 so Crop Rotation correctly sits above IPM). This is a legitimate sort operation over legitimate
(if static) data. Contrast with what the guide's formula would require to produce a genuine ROI
ranking: for Agroforestry at `cost=$180/ha`, a real `ROI_regen` would need e.g. `YieldMaintained ×
cropPrice + 3.8tCO₂e × carbonPrice($/t) + waterSavings×waterPrice − 180`, all divided by 180 — none
of these inputs exist in the file, so the displayed `payback=7.8yr` for Agroforestry is presented as
if it were the output of such a calculation but is in fact a typed-in literal.

### 7.5 Companion analytics

- **Green bonds tab** — 10 named issuers (FAO, World Bank, IFC, EBRD, ADB, Rabobank, BNDES, BNP,
  Barclays, ABN AMRO) with `sr()`-seeded volume/coupon/greenium and real certification-type labels
  (ICMA GBP, SLB, LMA SLL) — realistic-looking but synthetic financial terms.
  data or SBTi target-setting screener.
- **Impact tab** — hard-coded headline KPIs ("12.4 MtCO₂/yr", "~820K farmers", "7.2/10 biodiversity")
  that are not derived from `FUNDS` or `REGEN_PRACTICES` at all — static placeholder text.
- **Portfolio/Opportunities tabs** — further tabular views of the same `FUNDS`/`GREEN_BONDS` arrays.

### 7.6 Data provenance & limitations

- **All fund/bond financial figures are `sr()`-seeded synthetic data**; fund and issuer *names* are
  realistic (Paine Schwartz, TIAA Farmland, Nuveen Natural Capital, FAO Green Bond, World Bank SLB
  are real institutions/programs) but their displayed AUM/return/coupon values are not their actual
  reported figures.
- The guide's `ROI_regen` and `SoilCarbonSeq` formulas, and the SBTi FLAG screener referenced in the
  guide's data lineage, are entirely unimplemented — see §8 for what a production version needs.
- Impact-tab headline metrics are static placeholder text disconnected from any calculation.

**Framework alignment:** SBTi FLAG, Verra VM0042, and IPCC AR6 WGIII Chapter 7 AFOLU are named
correctly in the guide as the standards this module *should* implement, but none of their
calculation logic (FLAG target-setting thresholds, VM0042's baseline/project SOC comparison, AFOLU
emission-factor tables) appears in the code — the practice table's carbon-sequestration values are
loosely consistent with IPCC AR6's cited 1.5–3.0 tCO₂e/ha/yr range for regenerative practices on
degraded soils, but are not calculated from that range.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Deliver the guide's intended regenerative-agriculture transition-economics calculator: per-hectare
ROI and soil-carbon-credit revenue for a farm or fund transitioning to a named regenerative practice,
supporting agricultural lender and impact-investor underwriting decisions.

### 8.2 Conceptual approach

Follow **Verra VM0042** (Improved Agricultural Land Management) for the carbon-quantity side and a
standard **farm-level partial-budget analysis** (the approach used by USDA NRCS conservation-practice
economic tools and the Rodale Institute's own regenerative-transition economic models) for the
financial side — combining a physical MRV-grounded carbon estimate with a cash-flow ROI, rather than
conflating the two into one unexplained "impact score."

### 8.3 Mathematical specification

```
# Soil carbon sequestration (VM0042-consistent stock-change method)
ΔSOC(t, practice) = SOC_project(t) − SOC_baseline(t)             (tC/ha, measured or modelled via VM0042 Tier 2/3)
SoilCarbonSeq(t)   = ΔSOC(t) × BulkDensity × Depth × Area × 44/12   (tCO₂e/yr; 44/12 = CO2:C mass ratio)

# Regenerative transition ROI (partial budget)
RevenueDelta   = YieldMaintained × CropPrice − YieldBaseline × CropPrice
CarbonRevenue  = SoilCarbonSeq × CarbonCreditPrice × (1 − bufferPoolPct)     (VM0042 requires a non-permanence buffer)
CostSavings    = WaterSavings×WaterPrice + InputReduction×InputPrice
ROI_regen      = (RevenueDelta + CarbonRevenue + CostSavings − TransitionCost) / TransitionCost
Payback(yr)    = TransitionCost / (RevenueDelta + CarbonRevenue + CostSavings)
```

| Parameter | Value | Calibration source |
|---|---|---|
| Bulk density, depth | Site-measured, 0–30cm default | VM0042 default sampling depth |
| Buffer pool % | 10–20% | Verra AFOLU non-permanence risk buffer convention |
| CO₂:C conversion | 44/12 = 3.667 | Stoichiometric molecular weight ratio (fixed constant) |
| Carbon credit price | Market-quoted (e.g. Article 6/voluntary market spot) | Ecosystem Marketplace / Verra registry pricing, free reference |
| SBTi FLAG threshold | >25% land-use Scope 3 emissions triggers mandatory target | SBTi FLAG Guidance 2022 |

### 8.4 Data requirements

- Farm-level soil sampling (SOC, bulk density) pre/post practice adoption — VM0042 Tier 2/3 protocol.
- Crop yield and price series by practice/region (existing `yieldImpact` field is a static % — needs
  real yield-trial data, e.g. USDA NASS or FAO country yield statistics, both free).
- Carbon credit price feed (Ecosystem Marketplace, free aggregate reporting).
- SBTi FLAG company-level land-use revenue % for target-applicability screening.

### 8.5 Validation & benchmarking plan

Validate `SoilCarbonSeq` against VM0042-registered project MRV reports for the same practice/region
combination; backtest `ROI_regen` against Rodale Institute's published farmer economic case studies;
sensitivity-test to ±30% carbon price and ±20% yield-impact assumptions.

### 8.6 Limitations & model risk

SOC accumulation is slow and reversible (tillage disturbance can release accumulated carbon within a
season) — any production model must apply VM0042's mandatory buffer pool and monitor for reversal,
not treat `SoilCarbonSeq` as a permanent annual credit. Yield-impact assumptions vary enormously by
soil type, climate, and years-since-transition (often yield-negative in years 1–3 before recovering)
— a single static `yieldImpact` percentage per practice is a coarse approximation that a lending
decision should not rely on without site-specific trial data.
