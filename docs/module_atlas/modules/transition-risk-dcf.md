# Transition Risk DCF Engine
**Module ID:** `transition-risk-dcf` · **Route:** `/transition-risk-dcf` · **Tier:** B (frontend-computed) · **EP code:** EP-CA1 · **Sprint:** CA

## 1 · Overview
DCF impairment engine for 8 portfolio assets under 5 NGFS scenarios. Computes climate-adjusted WACC, carbon cost pass-through in cash flows, NPV impairment waterfall, and stranded year identification.

**How an analyst works this module:**
- Select asset and NGFS scenario from dropdowns
- Carbon Prices tab shows 5 trajectory curves with interactive horizon
- DCF Engine tab computes base vs climate-adjusted NPV with waterfall chart
- Portfolio Exposure aggregates impairment across all 8 assets
- Stranded CAPEX identifies the year when NPV turns negative
- Scenario Comparison shows impairment % side-by-side across all 5 scenarios

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `SCENARIOS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ASSETS` | 9 | `name`, `sector`, `class`, `book`, `emissions_intensity`, `passthrough`, `wacc_base`, `beta_c` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `years` | `Array.from({ length: 27 }, (_, i) => 2024 + i);` |
| `baseRevenue` | `asset.book * 0.18 * Math.pow(0.98, i);` |
| `adjustedCFs` | `baseCFs.map((cf, i) => {` |
| `carbonCost` | `(asset.emissions_intensity / 1000) * cprice * asset.book * 0.001;` |
| `revenueImpact` | `cf.base_cf * asset.passthrough * (cprice / 100) * 0.1;` |
| `adjusted` | `cf.base_cf - carbonCost - revenueImpact;` |
| `waccAdjusted` | `asset.wacc_base + asset.beta_c * carbonPrice(scenario, 5);` |
| `discountBase` | `(cf, i) => cf.base_cf / Math.pow(1 + asset.wacc_base, i + 1);` |
| `discountAdj` | `(cf, i) => cf.adjusted_cf / Math.pow(1 + waccAdjusted, i + 1);` |
| `finalCfBase` | `adjustedCFs[adjustedCFs.length - 1]?.base_cf ?? 0;` |
| `finalCfAdj` | `adjustedCFs[adjustedCFs.length - 1]?.adjusted_cf ?? 0;` |
| `npvBase` | `adjustedCFs.reduce((acc, cf, i) => acc + discountBase(cf, i), 0) + tvBase;` |
| `npvAdj` | `adjustedCFs.reduce((acc, cf, i) => acc + discountAdj(cf, i), 0) + tvAdj;` |
| `impairment` | `npvBase - npvAdj;` |
| `dcf` | `useMemo(() => computeDcfImpairment(asset, selectedScenario, horizon), [asset, selectedScenario, horizon]);  const portfolioImpairment = useMemo(() => ASSETS.map(a => { const r = computeDcfImpairment(a, selectedScenario, horizon);` |
| `totalBook` | `portfolioImpairment.reduce((s, a) => s + a.book, 0);` |
| `totalImpairment` | `portfolioImpairment.reduce((s, a) => s + a.impairment, 0);` |
| `scenarioCompare` | `useMemo(() => Object.keys(SCENARIOS).map(s => { const total = ASSETS.reduce((acc, a) => acc + computeDcfImpairment(a, s, horizon).impairment, 0);` |
| `pct` | `(total / (totalBook \|\| 1)) * 100;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSETS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Price (NZ2050, 2030) | `P(t) = P₀·exp(g·t)·[1+α·sin(2πt/T)]` | NGFS Phase 5 | Deterministic carbon price trajectory under Net Zero 2050 scenario |
| WACC Adjustment | `β_carbon × P_carbon(t=5)` | Cross-sectional regression | Additional cost of capital reflecting carbon risk exposure |
| NPV Impairment | `NPV_adj / NPV_base - 1` | DCF model | Percentage decline in asset value due to carbon costs and WACC adjustment |
| Stranded Year | `First t where cumulative NPV < 0` | Model output | Year when the asset becomes economically unviable under given scenario |
| Pass-Through Rate | `Sector-specific` | Company filings | Fraction of carbon costs passed to customers (energy sector: 60-70%) |

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-adjusted DCF with carbon cost overlay
**Headline formula:** `WACC_adj = WACC_base + β_carbon × P_carbon(t=5)`

Carbon price trajectories under 5 NGFS scenarios feed into DCF cash flow projections. WACC is adjusted by a carbon beta (β_carbon) calibrated from cross-sectional regression of EV/EBITDA on carbon intensity. Carbon cost = Emissions(t) × CarbonPrice(t) × (1-PassThroughRate). Stranded year = first year where cumulative NPV < 0.

**Standards:** ['NGFS Phase 5', 'IAS 36', 'ISSB S2']
**Reference documents:** NGFS Phase 5 Climate Scenarios; IAS 36 Impairment Testing; ISSB IFRS S2 Climate Disclosure; IPCC AR6 Carbon Budget

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

This is one of the platform's more rigorously implemented modules: a genuine multi-scenario **DCF
impairment engine** over 8 named credit/equity/bond positions, using a real tabular NGFS Phase 4
carbon-price curve (`ngfsCarbonPrice()` in `frontend/src/engines/climateRisk.js`, piecewise-linear
interpolated between published 2025/2030/2035/2040/2045/2050 price points — not a sinusoidal or PRNG
approximation). Core formula:

```
base_cf(t)        = book × 0.18 × 0.98^t                                   // declining baseline CF
carbonCost(t)      = (emissionsIntensity/1000) × carbonPrice(t) × book × 0.001
revenueImpact(t)   = base_cf(t) × passthrough × (carbonPrice(t)/100) × 0.1
adjusted_cf(t)     = max(0, base_cf(t) − carbonCost(t) − revenueImpact(t))
wacc_adjusted      = wacc_base + beta_c × carbonPrice(t=5)
NPV                = Σ CF(t)/(1+wacc)^(t+1) + TerminalValue                // Gordon Growth, g=2%
impairment         = NPV_base − NPV_adjusted
stranded_year       = first year where adjusted_cf ≤ 0
```

### 7.2 Parameterisation

| Parameter | Values | Provenance |
|---|---|---|
| NGFS carbon price table | NZ2050: $48(2025)→$860(2050); BelowAc: $35→$580; NatAmbI: $18→$195; CurrPol: $12→$42; DP (Delayed): $10(2025)→$550(2050) with a sharp post-2035 acceleration | Genuine tabular NGFS Phase 4 (Sept 2023)-style scenario price paths, piecewise-linearly interpolated — the Delayed Transition curve's late acceleration ($28→$120 between 2035-2040) correctly encodes NGFS's "disorderly, abrupt policy" narrative |
| `ASSETS` (8 positions) | Named real companies (BP, RWE, ArcelorMittal, HeidelbergCement, Lufthansa, Barratt, BASF, Glencore), each with book value, emissions intensity, carbon-cost pass-through rate, base WACC, and `beta_c` | Hand-curated, directionally realistic (RWE coal has highest intensity 820 and lowest pass-through 0.10; Lufthansa/Barratt lowest intensity) |
| `beta_c` (carbon beta) | 0.0004 (Barratt RE) to 0.0015 (RWE coal) | Platform-authored sensitivity of WACC to carbon price — see §7.4 for the resulting magnitude, which can be large |
| Terminal growth `G_TV` | 2% | Standard Gordon Growth Model perpetuity assumption |
| Revenue decay | 0.98^t (2%/yr autonomous decline) | Platform-authored baseline assumption, not asset-specific |

### 7.3 Calculation walkthrough

1. **Carbon price lookup**: `carbonPrice(scenario, t)` maps the local scenario key to the NGFS
   table key and interpolates at year `2024+t`.
2. **Carbon cost proxy**: `(intensity/1000) × price × book × 0.001` is a **proxy formula**, not a
   physically-grounded emissions-volume × price calculation — it scales with the *book value* of the
   position (not actual production volume or tonnes emitted), so two assets with identical emissions
   intensity but different book sizes get proportionally different carbon costs even if their true
   physical emissions were the same. This is a reasonable simplification for a demo DCF but should
   not be read as a bottom-up MRV-grade carbon-cost estimate.
3. **Revenue impact**: models a second transmission channel — cost pass-through eroding *demand*
   (revenue), scaled by the pass-through rate and carbon price level — a real economic mechanism
   (higher carbon costs reduce competitiveness/demand for carbon-intensive output) even if the
   specific coefficients (0.1 scalar) are calibration choices rather than econometrically estimated.
4. **WACC adjustment**: `wacc_base + beta_c × price(t=5)` — raises the discount rate as a function of
   the mid-horizon carbon price; see §7.4 for how large this adjustment can become for high-`beta_c`
   assets under Net Zero 2050.
5. **NPV & terminal value**: standard discounted cash flow with Gordon Growth terminal value,
   correctly guarding `wacc > g` before computing (returns TV=0 otherwise, avoiding a negative/
   infinite terminal value).
6. **Stranded year**: first year the adjusted cash flow hits zero (floored by `max(0,·)`), flagged
   per asset per scenario.
7. **Portfolio & scenario comparison**: sums impairment across all 8 assets per scenario, and
   computes `impairment / totalBook × 100` as a portfolio-level % impact for the 5-scenario
   comparison chart.

### 7.4 Worked example (BP Upstream, Net Zero 2050, `t=0`/2024)

| Step | Computation | Result |
|---|---|---|
| Carbon price (2024, extrapolated to 2025 floor) | `ngfsCarbonPrice('NZ2050', 2024)` clamped to first table year | **$48/tCO2e** |
| Base cash flow | `2400 × 0.18 × 0.98⁰` | **$432M** |
| Carbon cost | `(180/1000) × 48 × 2400 × 0.001` | **$20.7M** |
| Revenue impact | `432 × 0.30 × (48/100) × 0.1` | **$6.2M** |
| Adjusted cash flow | `432 − 20.7 − 6.2` | **$405.0M** |
| Carbon price at t=5 (2029, interpolated) | between $48(2025) and $147(2030): `48+0.8×(147−48)` | **$127.2/tCO2e** |
| WACC adjustment | `0.085 + 0.0008 × 127.2` | **18.68%** (vs 8.5% base — more than doubles the discount rate) |

The WACC more than doubling under Net Zero 2050 for BP illustrates that `beta_c` is calibrated
aggressively for oil & gas — a >10 percentage-point WACC uplift is a large, front-loaded transition
risk premium; whether this specific magnitude is well-calibrated against real credit-spread/
equity-risk-premium repricing evidence is not documented in-code (a production model would want to
cite an empirical carbon-beta estimation study, e.g. cross-sectional regression of equity beta on
carbon intensity).

### 7.5 Companion analytics

- **Carbon Price Trajectories tab** — all 5 scenario curves plotted 2024–2050, directly from the
  NGFS tabular data.
- **Portfolio Exposure tab** — aggregates impairment across all 8 assets for the selected scenario,
  with `strandedCount` (assets hitting zero cash flow within the horizon).
- **Stranded CAPEX tab** — highlights the specific year each asset's adjusted cash flow reaches zero.
- **Scenario Comparison tab** — recomputes portfolio impairment for all 5 scenarios side-by-side,
  correctly showing Net Zero 2050 (highest near-term carbon price) as the most severe near-term
  impairment scenario, consistent with the NGFS "orderly-vs-disorderly" transition-risk framing.

### 7.6 Data provenance & limitations

- **Carbon price data is genuinely NGFS-anchored** (tabular, interpolated, not PRNG or sinusoidal) —
  one of the more credible quantitative building blocks across the modules reviewed in this batch.
- **Carbon cost and revenue-impact formulas are proxy calibrations**, not physically-derived from
  actual tonnage/production data — they use book value as a stand-in for output volume, which
  conflates balance-sheet size with physical emissions exposure.
- **`beta_c` (carbon beta) values are platform-authored judgment calls** with no cited empirical
  source; as shown in §7.4, they can produce large (>10pp) WACC adjustments that materially drive
  the impairment result, so this is the single highest-leverage unvalidated parameter in the model.
- Revenue decay (2%/yr autonomous decline) is applied uniformly to all 8 assets regardless of sector
  growth dynamics.

### 7.7 Framework alignment

- **NGFS Phase 4 scenarios** (Current Policies, Delayed Transition, Below 2°C, Nationally
  Determined Contributions/Divergent, Net Zero 2050): correctly named and calibrated to genuine NGFS
  reference carbon-price trajectories.
- **IAS 36 Impairment Testing**: the NPV-difference-as-impairment framing (`NPV_base − NPV_adjusted`)
  mirrors how a real IAS 36 value-in-use recoverable-amount test would incorporate climate-adjusted
  cash flow projections.
- **ISSB IFRS S2 climate-related financial disclosure**: the scenario-based DCF impairment approach
  is consistent with what IFRS S2 expects issuers to demonstrate when disclosing climate resilience
  of their asset base under different transition pathways.
- **Gordon Growth (constant-growth perpetuity) terminal value**: a standard, correctly-implemented
  valuation technique, including the `wacc > g` guard that many simpler DCF implementations omit.

## 9 · Future Evolution

### 9.1 Evolution A — Physical carbon-cost basis and an empirically-calibrated carbon beta (analytics ladder: rung 2 → 4)

**What.** This is one of the platform's more rigorous modules (§7.1): a genuine multi-scenario DCF impairment engine over 8 named positions using real tabular NGFS Phase 4 carbon-price curves (piecewise-linear interpolated, not sinusoidal/PRNG), with a correctly-implemented Gordon Growth terminal value and `wacc>g` guard. Its rung-limiting weaknesses per §7.6 are two calibration issues: (1) carbon cost scales with *book value* as a proxy for output volume, conflating balance-sheet size with physical emissions; (2) `beta_c` is a platform-authored judgment with no empirical source, yet drives the result — §7.4 shows it more than doubling BP's WACC (8.5%→18.68%) under Net Zero 2050, "the single highest-leverage unvalidated parameter."

**How.** (1) Replace the book-value carbon-cost proxy with physical tonnage: `emissions_intensity × production_volume × carbon_price × (1−passthrough)`, sourcing production/emissions from disclosed data — the platform's emissions modules and real company filings. (2) Estimate `beta_c` empirically: cross-sectional regression of equity beta (or credit spread) on carbon intensity, the method the guide names but §7.4 notes is uncited — moving the module to rung 4 (predictive, model-carded per Atlas §8). (3) Make revenue decay sector-specific rather than a uniform 2%/yr (§7.6). (4) Bench-pin the §7.4 BP worked example so the NGFS-anchored DCF core is protected while calibration is refined.

**Prerequisites.** Production-volume and emissions data per asset; an empirical carbon-beta study (statsmodels regression on a cross-section of issuers); NGFS Phase 5 curve refresh (guide cites Phase 5; §7.2 notes the table is Phase 4). **Acceptance:** two same-intensity assets with different book but equal physical emissions get equal carbon cost; `beta_c` carries a regression standard error; the impairment result's sensitivity to `beta_c` is reported.

### 9.2 Evolution B — Impairment-analysis copilot with tool-called scenario DCF (LLM tier 2)

**What.** A copilot for a credit/impairment analyst: "run BP's impairment under Delayed Transition and explain the stranded year", "which of the 8 assets is most sensitive to carbon beta?", "compare Net Zero 2050 vs Below 2°C portfolio impairment" — executing the real DCF engine as tool calls and narrating the IAS 36 value-in-use logic.

**How.** The module is frontend-only today (tier B, EP-CA1), so tier 2's prerequisite is porting `computeDcfImpairment` and the NGFS `ngfsCarbonPrice` lookup into Pydantic-typed routes and auto-generating tool schemas. Grounding corpus is this Atlas page — §7's formula walkthrough, the §7.4 worked example, and the NGFS scenario framing are strong material — plus the model card from Evolution A. The no-fabrication contract is critical for a valuation tool: every NPV, impairment %, and stranded year must trace to a DCF tool call, provenance-expanded to show the scenario, carbon-price path, and WACC used. The copilot must surface the §7.6 model-risk caveats — the book-value proxy and unvalidated `beta_c` — when asked to impair, per IAS 36's own requirement for disclosed estimation uncertainty.

**Prerequisites.** The backend port; Evolution A's calibration fixes make the tool's outputs defensible rather than proxy estimates. **Acceptance:** every impairment figure traces to a DCF tool call with its scenario/parameters shown; the copilot cites the `beta_c` sensitivity when quoting an impairment; asking for a physical-tonnage carbon cost pre-Evolution-A yields the book-value-proxy caveat, not a false MRV-grade number.