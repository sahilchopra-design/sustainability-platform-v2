## 7 · Methodology Deep Dive

### 7.1 What the module computes

The page is a single-project PPA deal configurator (18 tabs) driven by one `cfg` state object
(capacity, technology, market, PPA type, strike price, tenor, buyer rating, credit enhancement,
discount rate, ITC %). Every headline number is a deterministic function of `cfg`, not of a
database — this is a **calculator**, not a portfolio of stored deals (the 20-row `PPA_CONTRACTS`
and 10-row `CORPORATE_BUYERS` arrays are illustrative market-comp tables, seeded once with
`sr(seed) = frac(sin(seed+1)×10⁴)`, and are not wired into the configurator's own math).

Core revenue build (`Sidebar`, Tab 1 "Command Center"):
```
netGWh        = p50GWh × (1 − curtailmentPct)
contractedGWh = netGWh × contractedPct
merchantGWh   = netGWh × (1 − contractedPct)
ppaRev        = contractedGWh × strikeMWh / 1000
merchantRev   = merchantGWh × merchantLMP × (1 − |basisPct|) / 1000
recRev        = p50GWh × recPrice / 1000
carbonAdder   = carbonAdditionality ? p50GWh × 3.5 / 1000 : 0        // synthetic $3.5/MWh adder
totalRev      = ppaRev + merchantRev + recRev + carbonAdder
```
`ppaNpv` discounts the escalated PPA cash flow at `discountRate` for `ppaTermYr` years:
`Σ_y [contractedGWh × strikeMWh×(1+escalatorPct)^y / 1000] / (1+r)^(y+1)`.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `PD_BY_RATING` | AAA 0.01% … BB 0.90% | Shape matches published S&P Global 1-yr average corporate default-rate studies (AAA≈0%, BBB≈0.2%, BB≈0.9%); exact platform values not independently sourced — treat as **plausible reference, not vendor-sourced** |
| LGD by enhancement | None 60%, else 40% | Synthetic — flat two-bucket assumption; real LGD depends on collateral/seniority, not just enhancement type present/absent |
| `lcoeEst` | Solar $28, Wind $30, Solar+BESS $35 /MWh | **Hard-coded flat constant per technology** — not a capex/opex/CF-driven LCOE calculation |
| `capex` | $1,200/kW | Comment-labelled; plausible 2024 utility solar capex but not technology/market-specific |
| `annualOpex` | $15,000/kW/yr | Comment-labelled ($15/kW/yr) |
| Merchant Monte Carlo | 500 paths, Box-Muller | `sr()` supplies the two uniforms `u1,u2` for a genuine `z = √(−2·ln u1)·cos(2π·u2)` normal transform — methodologically correct, unlike modules that use `sr()` directly as a fabricated output |
| `1.645` | 95% one-tailed z-score | Standard normal quantile |
| Carbon adder | $3.5/MWh flat | Synthetic demo value, no cited source |

### 7.3 Calculation walkthrough

**Fair-value PPA price** (Tab 2 "Pricing Engine", the deal's central "is this price fair?" output):
```
capex        = capacityMW × 1200                       ($'000, i.e. $1,200/kW)
itcBenefit   = capex × itcPct
netCapex     = capex − itcBenefit
annualDebt   = netCapex × 0.7 × discountRate            // 70% leverage, debt cost = equity discount rate
annualOpex   = capacityMW × 15000
reqRevenue   = (netCapex × targetIRR + annualDebt + annualOpex) / 1e6
fairValueMWh = reqRevenue × 1e6 / contractedGWh
```
This is compared against the configured strike price to flag "above/below fair value."

**Counterparty ECL** (Tab 9, IFRS 9-style): `PD × LGD × EAD` where EAD is `ppaNpv` (the
discounted remaining contracted-revenue stream) or, in the per-year table, the NPV of
remaining cash flows from year *y* onward. A second, independent parametric revenue-VaR
(`varMerchant = merchantRev × merchantSigmaPct × 1.645`) is computed in the sidebar and is
**not the same number** as the Monte-Carlo VaR shown in Tab 6 (empirical 5th percentile of
500 simulated paths) — the two coexist as separate, unreconciled risk figures.

**Merchant Monte Carlo (Tab 6):** for each of 500 runs, draws a Box-Muller normal `z` from two
`sr()` uniforms, prices merchant LMP as `merchantLMP×(1+σz)`, floors at 0, and multiplies by
`merchantGWh × basisFactor`. Sorted results give P10/P50/P90/P99, empirical VaR₉₅ (5th
percentile) and CVaR (mean of the worst 5%).

### 7.4 Worked example

Base case (`cfg` defaults): 150MW Solar, `capacityCF`=24%, `p50GWh`≈315, `strikeMWh`=$32,
`contractedPct`=85%, `curtailmentPct`=3%, `merchantLMP`=$28, `basisPct`=−9%, `recPrice`=$2,
`buyerRating`='A' (PD 0.06%), `creditEnhancement`='Letter of Credit' (LGD 40%),
`targetIRR`=11%, `discountRate`=8%, `itcPct`=30%.

| Step | Computation | Result |
|---|---|---|
| netGWh | 315 × (1−0.03) | 305.6 |
| contractedGWh | 305.6 × 0.85 | 259.7 |
| ppaRev | 259.7 × 32 / 1000 | $8.31M |
| merchantGWh | 305.6 × 0.15 | 45.8 |
| merchantRev | 45.8 × 28 × (1−0.09) / 1000 | $1.17M |
| recRev | 315 × 2 / 1000 | $0.63M |
| totalRev | 8.31+1.17+0.63 | **$10.11M** |
| capex | 150 × 1200 | $180,000 ('000, i.e. $180M) |
| itcBenefit | 180,000 × 0.30 | $54,000 |
| netCapex | 180,000 − 54,000 | $126,000 |
| annualDebt | 126,000 × 0.7 × 0.08 | $7,056 |
| annualOpex | 150 × 15,000 | $2,250,000 |
| reqRevenue | (126,000×0.11 + 7,056 + 2,250,000)/1e6 | ≈ **$2.264M** (note: units inconsistent — see §8) |
| ECL Year 1 | 0.0006 × 0.40 × ppaNpv | small relative to EAD |

The `reqRevenue`/`fairValueMWh` arithmetic mixes $/kW-scale capex with $-scale opex without a
consistent unit base — see §8.3 for why this cannot be trusted as a real fair-value benchmark.

### 7.5 Companion analytics on the page

- **Corporate VPPA (Tab 3):** monthly settlement = `(strikeMWh − simulated LMP) × p50GWh / 12000`;
  physical-vs-virtual 8-dimension comparison table.
- **Basis Risk / Curtailment (Tabs 7–8):** `breakeven = strikeMWh / (1+basisPct)`; curtailment
  loss = `curtailedGWh × strikeMWh / 1000`; mitigation measures (BESS, demand flexibility, export,
  CfD provisions) shown with illustrative % effectiveness, not derived from the portfolio.
- **Deal scorecard (Command Center):** 5 metrics (escalator protection, PPA-vs-LCOE spread,
  IRR vs hurdle, …) each scored 3/5/7/9/10 by threshold bands, averaged to a headline score —
  an ordinal rubric, not a probabilistic model.
- **Negotiation Toolkit / Documentation (Tabs 14, 17):** static term-sheet checklists, not
  computed from `cfg`.

### 7.6 Data provenance & limitations

- `PPA_CONTRACTS` (20 synthetic projects) and the Monte Carlo LMP draws all derive from the
  seeded PRNG `sr(seed) = frac(sin(seed+1)×10⁴)`; `CORPORATE_BUYERS`, `PPA_PRICE_HISTORY`,
  `STATE_RPS` and `MARKET_META` are hand-entered illustrative reference tables (plausible but not
  live-sourced).
- The Monte Carlo transform itself (Box-Muller from two independent `sr()` uniforms) is
  methodologically sound — unlike modules where `sr()` is read directly as an output.
- `lcoeEst` and `capex`/`opex` are single hard-coded numbers per technology, not a function of
  market, capacity, or year — this materially limits the credibility of "fair value" and "PPA vs
  LCOE spread" outputs (flagged formally in §8).
- ECL uses a static one-year PD and a two-bucket LGD; no PD term structure, no rating migration,
  no macro conditioning (contrast with `climate-credit-integration`'s NGFS-scenario PD adjustment).
- Two independent, unreconciled VaR figures exist (parametric `varMerchant` vs Monte-Carlo VaR₉₅).

### 7.7 Framework alignment

IFRS 9 §5.5 (ECL = PD×LGD×EAD, applied here to PPA receivables) · EFET Master Agreement
(VPPA settlement terms) · FERC Order 888/PURPA (must-take, avoided-cost framing referenced in
guide) · RE100 VPPA standards (physical-vs-virtual comparison table). The module approximates
IFRS 9 mechanically but without the staging/SICR machinery documented in `climate-credit-integration`.

## 8 · Model Specification — PPA Fair-Value Pricing & LCOE Benchmark

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Support the "is this PPA price fair?" decision for a single utility-scale solar/wind asset by
producing (a) a defensible LCOE estimate and (b) a required-revenue PPA price that clears the
sponsor's target equity IRR given a realistic capital structure. Scope: single-asset project
finance, 10–25 year PPA tenor, US/UK/EU/Australia markets already covered by `MARKET_META`.

### 8.2 Conceptual approach
Replace the two flat constants (`lcoeEst`, `capex×fixed IRR add-on`) with a standard **project
finance cash-flow LCOE and PPA-strike solver**, mirroring (1) NREL's Annual Technology Baseline
LCOE methodology (real, technology- and region-specific capex/opex/CF assumptions) and (2) the
debt-sizing logic used in Aladdin/Marquee-style project-finance credit models (DSCR-constrained
debt sizing, not a flat 70% leverage heuristic). Two benchmarks: **NREL ATB** (public, free,
technology-specific LCOE inputs) and **rating-agency project-finance criteria** (S&P/Moody's
minimum DSCR by technology, used to size debt rather than assuming 70%/target-IRR directly).

### 8.3 Mathematical specification
```
Debt sizing (DSCR-constrained, sculpted):
  Debt_t = min( Σ CFADS_t / DSCR_min , NetCapex × MaxLeverage )
  where CFADS_t = contractedGWh_t × strikeMWh_t + merchantGWh_t × E[LMP_t] − Opex_t

LCOE (NREL ATB style):
  LCOE = [ CapEx × CRF + FixedOM ] / AEP + VariableOM
  CRF (capital recovery factor) = r(1+r)^n / [(1+r)^n − 1],  r = WACC, n = project life

Fair-value PPA strike (revenue-sufficiency, solved not assumed):
  Solve strikeMWh such that:
  NPV( ContractedRevenue_t − DebtService_t − Opex_t )_equity-discounted = TargetEquityIRR × Equity_0
  i.e. iterate strikeMWh until levered equity IRR = targetIRR (Newton-Raphson or bisection)
```
| Parameter | Calibration source |
|---|---|
| Technology capex/opex ($/kW, $/kW-yr) | NREL Annual Technology Baseline (public, free, annual) |
| WACC / cost of debt & equity | Project-specific; benchmark against Lazard LCOE report ranges |
| DSCR_min | 1.30–1.45× solar, 1.35–1.50× wind (S&P/Moody's US project finance criteria) |
| Max leverage | 65–75% (rating-agency project finance guidance, technology-dependent) |
| AEP (annual energy production) | P50 from independent engineer report; already present as `p50GWh` |

### 8.4 Data requirements
Technology-specific capex/opex curves (NREL ATB CSV, free, updated annually), market-specific
forward curves for `E[LMP_t]` (already partially represented by `PPA_PRICE_HISTORY`), a DSCR/
leverage lookup by technology and rating tier, and a discounted cash-flow engine capable of
iterative strike solving. None of these exist in the platform today; `p50GWh`, `MARKET_META`
and the historical LMP table are reusable inputs.

### 8.5 Validation & benchmarking plan
Backtest fair-value strikes against LevelTen Energy's published PPA Price Index (already cited
in the guide's references) for the same market/tenor/vintage; sensitivity-test LCOE to ±20%
capex and ±100bp WACC; reconcile DSCR-implied leverage against actual closed transactions where
available; stress AEP at P90/P99 to confirm DSCR headroom.

### 8.6 Limitations & model risk
Single-point AEP (no weather-year Monte Carlo feeding the debt sizing); forward LMP curve is a
simplification versus a full merchant price forward curve with volatility term structure; DSCR
sculpting assumes annual (not seasonal/monthly) cash sweep, which will misstate debt capacity for
seasonal-generation technologies (solar summer-peak, wind winter-peak) — flag as a conservative
simplification and fall back to flat annuity debt service if sculpting inputs are unavailable.
