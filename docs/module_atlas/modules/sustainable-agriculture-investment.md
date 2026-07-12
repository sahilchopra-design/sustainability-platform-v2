# Sustainable Agriculture Investment
**Module ID:** `sustainable-agriculture-investment` · **Route:** `/sustainable-agriculture-investment` · **Tier:** B (frontend-computed) · **EP code:** EP-DG4 · **Sprint:** DG

## 1 · Overview
Evaluates sustainable and regenerative agriculture investment opportunities including soil carbon sequestration, precision agriculture technology, sustainable supply chain finance, and nature-positive farming transition economics.

> **Business value:** Directly applicable to agricultural finance institutions, food company CFOs setting SBTi FLAG targets, and investors in nature-based solutions. Provides bankable analysis of regenerative agriculture economics and enables corporate land-use emissions target setting under SBTi FLAG guidance.

**How an analyst works this module:**
- Select agricultural system and geography
- Model regenerative practice transition economics
- Calculate soil carbon sequestration and credit revenue
- Assess SBTi FLAG alignment requirements
- Analyse precision agriculture technology investment case

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `FUNDS`, `GREEN_BONDS`, `KpiCard`, `REGEN_PRACTICES`, `RETURN_SERIES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REGEN_PRACTICES` | 9 | `adoption`, `yieldImpact`, `carbonSeq`, `cost`, `payback` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `RETURN_SERIES` | `[2018, 2019, 2020, 2021, 2022, 2023, 2024].map((yr, i) => ({` |
| `fundTypes` | `['All', ...new Set(FUNDS.map(f => f.type))];` |
| `totalAUM` | `useMemo(() => filteredFunds.reduce((a, f) => a + +f.aum, 0), [filteredFunds]);` |
| `avgReturn` | `useMemo(() => filteredFunds.length > 0 ? (filteredFunds.reduce((a, f) => a + f.actualReturn, 0) / filteredFunds.length).toFixed(1) : '–', [filteredFunds]);` |
| `avgImpact` | `useMemo(() => filteredFunds.length > 0 ? (filteredFunds.reduce((a, f) => a + f.impactScore, 0) / filteredFunds.length).toFixed(1) : '–', [filteredFunds]);` |
| `sortedPractices` | `useMemo(() => [...REGEN_PRACTICES].sort((a, b) => b[practiceSort] - a[practiceSort]), [practiceSort]);` |
| `gbData` | `useMemo(() => GREEN_BONDS.map(b => ({ name: b.issuer.split(' ').slice(0, 2).join(' '), volume: b.volume, greenium: b.greeniumBps })), []);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `REGEN_PRACTICES`, `RETURN_SERIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Soil Carbon Sequestration Potential | — | IPCC AR6 WGIII Chapter 7 | Annual sequestration rate from regenerative agricultural practices on degraded soils |
| Precision Agriculture Yield Uplift | — | McKinsey Global Food Initiative 2023 | Technology-enabled precision agriculture improves yields 10–15% while reducing input costs 20% |
| SBTi FLAG Target Coverage | — | SBTi FLAG 2022 | Forest, Land and Agriculture targets now required for 60+ companies with >25% land-use Scope 3 |
- **Farm management data (practices, inputs, yields)** → Regenerative transition modelling → **Farm P&L impact, soil carbon accumulation, carbon credit revenue**
- **SBTi FLAG screener (sector, revenue, land use %)** → Target-setting compliance → **FLAG target pathway and required removals/reductions by year**
- **Soil carbon measurement data (SOC, bulk density)** → VM0042 carbon credit calculation → **Verified carbon credits from improved land management**

## 5 · Intermediate Transformation Logic
**Methodology:** Regenerative Agriculture ROI
**Headline formula:** `ROI_regen = (YieldMaintained × Price + CarbonCredit × CarbonPrice + WaterSavings × WaterPrice - TransitionCost) / TransitionCost; SoilCarbonSeq = ΔSOC × BulkDensity × Depth × Area`

Soil organic carbon (SOC) accumulation from regenerative practices generates carbon credits; co-benefits (water retention, input cost reduction) improve farm economics while reducing climate exposure

**Standards:** ['Rodale Institute Regenerative Agriculture Research', 'SBTi FLAG Guidance 2022', 'Verra Verified Carbon Standard VM0042', 'IPCC AR6 WGIII Chapter 7 Agriculture AFOLU']
**Reference documents:** SBTi Forest, Land and Agriculture (FLAG) Science-Based Target Setting Guidance 2022; Verra VM0042 Methodology for Improved Agricultural Land Management; IPCC AR6 WGIII Chapter 7 — Agriculture, Forestry and Other Land Uses; Rodale Institute White Paper — Regenerative Agriculture 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — First backend vertical: the VM0042 ROI engine specified in §8 (analytics ladder: rung 1 → 2)

**What.** This is a tier-B, frontend-only module whose §7 deep-dive documents that neither of the guide's named formulas (`ROI_regen`, `SoilCarbonSeq = ΔSOC × BulkDensity × Depth × Area`) is computed anywhere in the 419-line file — the `REGEN_PRACTICES` table's `carbonSeq` and `payback` columns are typed-in literals, and there is no SBTi FLAG screener. Evolution A implements the §8 model specification as the module's first backend vertical: a per-hectare regenerative-transition calculator with practice-level scenario sweeps.

**How.** (1) New route (e.g. `POST /api/v1/agriculture/regen-roi`) implementing §8.3 exactly: VM0042 stock-change carbon quantity (with the 44/12 conversion and 10–20% non-permanence buffer), partial-budget ROI, and payback — replacing the 9 static practice rows' `payback` with computed values from cost/yield/carbon-price inputs. (2) Scenario capability: sensitivity grid over carbon price (±30%) and yield impact (±20%) per §8.5, rendered in the existing ROI Analytics tab. (3) SBTi FLAG applicability screen (>25% land-use Scope 3 threshold) as a simple deterministic check. (4) Replace the Impact tab's hard-coded headline KPIs ("12.4 MtCO₂/yr") with aggregations over actual calculator runs, or remove them.

**Prerequisites.** The 18-fund/`GREEN_BONDS` `sr()`-seeded financials stay clearly labelled illustrative — they are out of scope. Yield-trial reference data (USDA NASS/FAO, free) seeded per practice. **Acceptance:** Agroforestry's displayed payback is reproducibly derived from its $180/ha cost and stated inputs; a bench pin covers one worked example per practice.

### 9.2 Evolution B — Regenerative-transition underwriting copilot (LLM tier 1 → 2)

**What.** A copilot for agricultural lenders answering "which practice gives the fastest payback for a 500-ha corn operation at $40/tCO₂?" — grounded first (tier 1) in this Atlas page's practice table, §7.3 reference figures, and the named standards corpus (VM0042, SBTi FLAG 2022, IPCC AR6 WGIII Ch.7), then (tier 2) calling Evolution A's `regen-roi` endpoint to run real comparisons.

**How.** Tier 1 ships immediately against the existing static content: the copilot explains practice trade-offs (agroforestry's 3.8 tCO₂e/ha/yr vs 7.8-yr payback), cites IPCC's 1.5–3.0 tCO₂e/ha/yr range, and — critically — discloses that current table values are static literals, not site-specific calculations (§7.6 is in its corpus). Tier 2 adds one tool: the ROI endpoint, letting the copilot sweep all 9 practices for the user's acreage/prices and rank by computed ROI, with every figure traceable to a tool response. FLAG-screening questions ("must this food company set a FLAG target?") route to the deterministic threshold check.

**Prerequisites (hard).** Tier 2 is blocked on Evolution A — there is currently no endpoint to call, and a tool-calling copilot over static literals would launder them into apparent computations. **Acceptance:** tier-1 answers distinguish reference values from calculations explicitly; tier-2 rankings reproduce endpoint outputs exactly; asking for a farm-specific SOC measurement yields a refusal (the module has no MRV data).