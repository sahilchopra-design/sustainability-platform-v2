# Vintage Cohort Stranded Engine
**Module ID:** `vintage-cohort-stranded` · **Route:** `/vintage-cohort-stranded` · **Tier:** B (frontend-computed) · **EP code:** EP-CK1 · **Sprint:** CK

## 1 · Overview
20 assets grouped by vintage decade with exponential book value decay and regulatory closure risk.

**How an analyst works this module:**
- Vintage Dashboard groups assets by decade
- Age-Depreciation Curves show λ by asset type

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `Badge`, `COHORTS`, `COHORT_COLORS`, `Card`, `KPI`, `SCENARIOS`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Vintage Dashboard','Cohort Comparison','Remaining Book Value','Age-Depreciation Curves','Regulatory Closure Risk','Portfolio Vintage Distribution'];` |
| `decades` | `['pre-2000','2000-2010','2010-2020','post-2020'];` |
| `baseYear` | `dec==='pre-2000'?1990+i%10 : dec==='2000-2010'?2000+i%10 : dec==='2010-2020'?2010+i%10 : 2020+i%4;` |
| `age` | `2026 - baseYear;` |
| `bv0` | `200 + (sr(i * 73 + 21) * 800);` |
| `lambda` | `dec==='pre-2000'?0.08 : dec==='2000-2010'?0.05 : dec==='2010-2020'?0.03 : 0.015;` |
| `buildDecayCurve` | `(asset, years=30) => Array.from({length:years},(_, t)=>({ year:t, bv:Math.round(asset.bv0*Math.exp(-asset.lambda*t)), pct:Math.round(100*Math.exp(-asset.lambda*t)) }));` |
| `COHORTS` | `['pre-2000','2000-2010','2010-2020','post-2020'];` |
| `filtered` | `useMemo(()=>ASSETS.filter(a=>(vintageFilter==='All'\|\|a.vintage===vintageFilter)&&(sectorFilter==='All'\|\|a.sector===sectorFilter)),[vintageFilter,sectorFilter]); const totalBV0 = filtered.reduce((s,a)=>s+a.bv0,0);` |
| `totalCurrent` | `filtered.reduce((s,a)=>s+a.currentBV,0);` |
| `avgStrandProb` | `filtered.length?filtered.reduce((s,a)=>s+a.strandingProb,0)/filtered.length:0;` |
| `cohortStats` | `useMemo(()=>COHORTS.map(c=>{` |
| `regRisk` | `useMemo(()=>ASSETS.map(a=>({ name:a.name, age:a.age, sector:a.sector, vintage:a.vintage, closureRisk: a.vintage==='pre-2000'?'Critical':a.vintage==='2000-2010'?'High':a.vintage==='2010-2020'?'Medium':'Low', yearsToRegClo` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COHORTS`, `COHORT_COLORS`, `SCENARIOS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Assets | — | Demo | Grouped by vintage decade |
| Max Stranding Probability | `Pre-2000 coal` | Model | Near-certain stranding for oldest coal assets |

## 5 · Intermediate Transformation Logic
**Methodology:** Vintage-cohort decay model
**Headline formula:** `BV(t) = BV₀ × exp(-λ(age) × t)`

Older vintages (pre-2000 coal plants) have higher stranding probability and faster decay rate (λ). Regulatory closure risk varies by jurisdiction.

**Standards:** ['Carbon Tracker', 'IEA']
**Reference documents:** Carbon Tracker; IEA World Energy Outlook

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Scenario-conditioned λ and a decay-consistent stranding probability (analytics ladder: rung 1 → 2)

**What.** The core decay model is genuinely implemented (`BV(t) = BV₀·exp(−λt)` with
cohort-level λ, one of the batch's most faithful guide↔code matches), but §7.3/§7.5
document three gaps: the Scenario selector (Current Policies → Net Zero 2050) is
purely cosmetic — switching it changes no computed value; `strandingProb` is an ad-hoc
linear-in-age heuristic disconnected from the λ/BV trajectory; and
`yearsToRegClosure`/`complianceCost` are uncited constants. Evolution A implements the
§8 spec: `λ_scenario = λ_base × ScenarioMultiplier` (1.0/1.3/1.6/2.2 keyed to NGFS
carbon-price stringency) so the dropdown finally drives the curves; stranding
probability becomes a closure-date distribution
(`StrandProb(t) = 1 − CDF_lognormal(ClosureDate_implied − t)`) fit to Carbon Tracker's
public plant-retirement-age data, making it a function of the same model instead of a
parallel heuristic; and `complianceCost` derives from named phase-out schedules (EU
Taxonomy DNSH dates, EPA compliance capex) instead of the flat `0.15 × BV × age/20`.

**How.** Keep it frontend-first (Tier B, EP-CK1) for the multiplier wiring — it is a
pure formula change — but move the calibrated closure-date distribution into a small
`GET /api/v1/vintage-stranded/params` reference route so μ/σ per sector carry
provenance. Validate `ClosureDate_implied` against the US EIA plant-retirement
database per §8.5.

**Prerequisites.** The non-functional selector acknowledged as a defect; retirement-age
fit data sourced (EIA public). **Acceptance:** switching to Net Zero 2050 visibly
steepens every decay curve (λ×2.2); a pre-2000 coal asset's strandingProb now moves
when scenario changes; the §7.4 worked example re-pins under Current Policies.

### 9.2 Evolution B — Provisioning copilot for lenders (LLM tier 1 → 2)

**What.** The module's audience (infrastructure lenders provisioning against
stranding) needs cohort narratives: "explain why our 2000–2010 cement cohort loses
60% of book value by 2035 under Delayed Transition, and what that implies for
loan-loss provisioning." Evolution B starts tier-1: a copilot grounded in this Atlas
page and the on-page cohort state that explains the decay math (λ per cohort, the
scenario multiplier once Evolution A lands) and drafts the provisioning-memo paragraph
with every figure read from the rendered `cohortStats`. Tier-2 adds the
`GET /params` reference route and a `POST /project` endpoint (server-side
`buildDecayCurve`) as tools, so what-ifs — "re-run the pre-2000 cohort at λ=0.10" —
are computed, not narrated.

**How.** Standard copilot stack (`llm_corpus_chunks` embedding of this page;
`POST /api/v1/copilot/vintage-cohort-stranded/ask`); the system prompt encodes §7.5's
provenance caveats (synthetic 20-asset register; λ author-calibrated, IEA-cited but
not traceable to a published table) so memos state assumptions honestly.

**Prerequisites.** Evolution A's scenario wiring first — a copilot explaining a
dropdown that does nothing would either lie or embarrass; pgvector corpus.
**Acceptance:** every BV, λ, and probability in an answer matches page state or a tool
response; asked which real plants are in the cohort, the copilot discloses the
register is synthetic; scenario-conditioned answers change when the scenario input
changes.