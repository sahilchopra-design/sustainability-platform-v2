## 7 · Methodology Deep Dive

The guide's headline formula — `BV(t) = BV₀ × exp(−λ(age) × t)` — **is genuinely implemented** in
code, unlike many sibling modules in this batch. This is one of the more faithful guide↔code matches
in the assignment; the deep dive below documents the real calculation plus two secondary metrics
(`strandingProb`, regulatory closure `complianceCost`) that are ad-hoc and not derived from the decay
model at all, and a **cosmetic Scenario selector** that has no effect on any computed value.

### 7.1 What the module computes

20 synthetic fossil/carbon-intensive assets (`ASSETS`) across 5 sectors (Coal, Oil & Gas, Cement,
Steel, Power Gen) and 4 vintage cohorts (pre-2000, 2000-2010, 2010-2020, post-2020):

```js
BV(t) = bv0 × exp(−λ × t)                    // exponential book-value decay, t = years from commission
currentBV = bv0 × exp(−λ × age)              // age = 2026 − commissionYear
strandingProb = min(0.95, 0.1 + age × 0.025) // linear in age, capped at 95% — NOT a function of λ
```

`λ` (decay rate) is a **cohort-level constant**, not asset-specific: pre-2000 → 0.08, 2000-2010 →
0.05, 2010-2020 → 0.03, post-2020 → 0.015. `bv0 = 200 + sr(i·73+21)·800` ($200M–$1,000M), randomly
assigned per asset regardless of sector.

### 7.2 Parameterisation

| Vintage cohort | λ (decay rate) | Relative decay speed | Provenance |
|---|---|---|---|
| pre-2000 | 0.08 | 4× post-2020 baseline | Author-calibrated; guide cites IEA WEO 2024 asset-stranding curves as the source but no direct IEA table row is reproduced |
| 2000-2010 | 0.05 | 2.5× baseline | ″ |
| 2010-2020 | 0.03 | 1.5× baseline | ″ |
| post-2020 | 0.015 | 1× (baseline) | ″ |
| `strandingProb` slope | +2.5 pts/year, floor 10%, cap 95% | Ad-hoc linear formula, not λ-derived | No cited source |
| Regulatory closure `yearsToRegClosure` | Critical: `max(1, 5−⌊age/10⌋)`; High: 8; Medium: 15; Low: 25 (fixed by cohort) | Ad-hoc, not derived from any named EU Taxonomy/EPA schedule despite the footer's claim | No cited source |
| `complianceCost` | `currentBV × 0.15 × (age/20)` | Ad-hoc, uncalibrated multiplier | No cited source |

### 7.3 Calculation walkthrough

1. `buildDecayCurve(asset, years)` projects `bv` and `pct = 100·exp(−λt)` forward from t=0 to `years`
   for the Age-Depreciation Curves tab, plotting all 4 cohort λ values on one chart for comparison.
2. `cohortStats` groups `ASSETS` by vintage cohort and averages `age`, sums `currentBV`, averages
   `strandingProb×100` and `λ` per cohort — feeding the Cohort Comparison bar chart and pie chart.
3. **Remaining Book Value tab** sums `bv0 × exp(−λt)` across *all* assets in each cohort at each
   forward year `t` (0–29), producing a genuine cohort-level aggregate decay curve — this is the most
   sophisticated computed view in the module.
4. `regRisk` maps each asset's *vintage cohort* (not its individual decay trajectory) to a fixed
   `closureRisk` label and `yearsToRegClosure`/`complianceCost` — two assets in the same cohort with
   very different `currentBV` get proportionally different `complianceCost` (since it scales with
   `currentBV`) but identical `yearsToRegClosure`.
5. The **Scenario selector** (`Current Policies` / `Delayed Transition` / `Below 2°C` / `Net Zero
   2050`) is read into state (`scenario`) and displayed as a label next to the "Avg Stranding Prob"
   KPI, but is **never used in any calculation** — switching scenarios does not change `strandingProb`,
   `λ`, or any chart value.

### 7.4 Worked example

Asset `A-001` (`i=0`, pre-2000 cohort): `bv0 = 200 + sr(0·73+21)·800 = 200 + sr(21)·800`. With
`sr(21) = frac(sin(22)×10⁴) ≈ 0.0084` → `bv0 ≈ $207M`. `commissionYear = 1990 + 0%10 = 1990`,
`age = 2026−1990 = 36`. `λ = 0.08` (pre-2000). `currentBV = 207 × exp(−0.08×36) = 207 × exp(−2.88) =
207 × 0.0561 ≈ $11.6M` — **94.4% of book value already depreciated**, consistent with the guide's
"near-certain stranding for oldest coal assets" framing. `strandingProb = min(0.95, 0.1+36×0.025) =
min(0.95, 1.0) = 0.95` (hits the cap). `complianceCost = 11.6 × 0.15 × (36/20) ≈ $3.13M`.

### 7.5 Data provenance & limitations

- **All 20 assets are synthetic** (`sr()`-seeded `bv0`, cohort-fixed `λ`); no real utility/energy
  company asset register underlies any row, despite the footer citing "IEA WEO 2024 asset stranding
  curves" and "EU Taxonomy phase-out schedules" as calibration sources for λ and closure timelines —
  neither is traceable to a specific published figure in the code.
- **`strandingProb` is disconnected from the decay model** — a production stranding-probability
  metric should be a function of the same λ/age/`currentBV` trajectory (e.g. probability that
  remaining book value exceeds a regulatory or market-implied "worthless" threshold by a target
  date), not an independent linear-in-age heuristic.
- **The Scenario selector is non-functional** — a genuine NGFS-scenario-conditioned model would vary
  λ (faster decay under Net Zero 2050 policy pressure) and `yearsToRegClosure` by scenario; currently
  neither responds to the dropdown.

**Framework alignment:** The exponential decay formula itself is a standard corporate-finance
depreciation construct, not a named climate-risk standard. IEA World Energy Outlook stranded-asset
analysis and EU Taxonomy fossil-fuel phase-out timelines are named as calibration sources in the UI
footer but not implemented as scenario-conditioned inputs — see §8 for how to close that gap.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production Stranded Asset Risk model gives infrastructure lenders and equity investors an
NGFS-scenario-conditioned probability that a fossil/carbon-intensive asset's book value becomes
unrecoverable before the end of its planned economic life — informing loan-loss provisioning and
divestment/engagement decisions. Scope: coal, oil & gas, cement, steel and power-generation assets.

### 8.2 Conceptual approach
Condition the existing exponential decay's λ on the NGFS transition-scenario carbon-price pathway —
this mirrors Carbon Tracker Initiative's stranded-asset methodology (asset economic life vs.
policy-implied retirement date) and S&P Global's climate credit-risk stranding overlays, both of
which scale asset write-down speed to scenario-specific policy stringency rather than a single fixed
λ per vintage.

### 8.3 Mathematical specification

```
λ_scenario  = λ_base × ScenarioMultiplier(scenario, sector)        // λ_base = current cohort constant
ScenarioMultiplier ∈ {CurrentPolicies:1.0, DelayedTransition:1.3, Below2C:1.6, NetZero2050:2.2}   // faster write-down under stringent policy
StrandProb(t) = 1 − CDF_lognormal( ClosureDate_implied − t ; μ_sector, σ_sector )   // probability asset closes before t
ClosureDate_implied = CommissionYear + EconomicLife_sector × (1/ScenarioMultiplier)
ComplianceCost_t = max(0, RegulatoryCapex_sector,t − Σ AlreadyInvested)             // from named phase-out schedule, not flat 15%×BV
```

| Parameter | Calibration source |
|---|---|
| `ScenarioMultiplier` | NGFS Phase IV carbon-price pathways by scenario (relative price level → retirement acceleration) |
| `EconomicLife_sector` | IEA WEO 2024 asset-life assumptions by technology (the guide's cited but unimplemented source) |
| `RegulatoryCapex_sector,t` | EU Taxonomy Do-No-Significant-Harm technical screening criteria phase-out dates; US EPA emission-standard compliance capex schedules |
| `μ_sector, σ_sector` for closure-date distribution | Fit to Carbon Tracker's historical coal/gas plant retirement-age distribution (public dataset) |

### 8.4 Data requirements
Real asset commission dates and technology type (from utility/energy company disclosures or S&P
Capital IQ plant-level data), NGFS scenario carbon-price paths (public, NGFS Phase IV), IEA WEO
asset-life tables (licensed), and EU Taxonomy/EPA phase-out schedule dates (public). The platform's
`reference_data` layer already ingests IEA and NGFS-adjacent series for other modules and is the
natural home for `EconomicLife_sector` and `ScenarioMultiplier`.

### 8.5 Validation & benchmarking plan
Backtest `ClosureDate_implied` against actual historical coal-plant retirement dates (US EIA plant
retirement database is public and comprehensive); reconcile scenario-conditioned λ against Carbon
Tracker's own published stranded-asset writedown estimates for comparable sectors; sensitivity-test
StrandProb stability under ±20% `μ_sector` perturbation.

### 8.6 Limitations & model risk
A single sector-level `EconomicLife` and closure-date distribution ignores asset-specific factors
(retrofit potential, local grid dependency, PPA contract terms) that materially affect actual
retirement timing — treat model output as a sector/vintage-level prior to be overridden by
asset-specific engineering/commercial due diligence where available, not a standalone valuation.
