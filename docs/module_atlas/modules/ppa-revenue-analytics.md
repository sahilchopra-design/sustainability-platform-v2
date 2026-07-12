# PPA & Revenue Analytics Engine
**Module ID:** `ppa-revenue-analytics` · **Route:** `/ppa-revenue-analytics` · **Tier:** B (frontend-computed) · **EP code:** RE-PPA1 · **Sprint:** RE

## 1 · Overview
Comprehensive power purchase agreement analytics and merchant revenue risk engine for renewable energy projects. Covers PPA pricing (fixed/indexed/proxy revenue swap), merchant price exposure, VPPA/CfD structuring, curtailment risk, counterparty ECL under IFRS 9, and revenue at risk (RaR) Monte Carlo across 18 analytical tabs.

> **Business value:** Designed for project finance bankers, independent power producers, and corporate renewable energy buyers structuring PPA and VPPA transactions. Covers the full revenue risk spectrum from fully-contracted PPA to fully-merchant exposure, with IFRS 9 ECL provisioning, VPPA mark-to-market, and curtailment analytics that replicate the commercial structuring analysis for 100–500 MW solar and wind deals.

**How an analyst works this module:**
- Configure the deal in the left PPA Structure panel: contract type (fixed/indexed/proxy revenue swap/VPPA), tenor years, strike price $/MWh, contracted volume %, and escalation %
- Open "Command Center" tab for the full deal health scorecard: 8 KPIs (Year-1 Revenue, NPV, Revenue at Risk, WALE, DSCR, breakeven LMP, merchant share, curtailment %)
- Navigate to "Pricing Engine" tab to see how PPA price impacts equity IRR and lender DSCR; fair-value PPA price derivation and market comparables
- Open "Corporate VPPA" tab for the physical vs virtual PPA comparison, monthly settlement waterfall under different spot price scenarios, and RE100 alignment assessment
- Check "Market Intelligence" tab for 7-market PPA price history, bid/ask spread table, and seasonal LMP patterns by ISO market
- Use "Revenue Stack Builder" tab to toggle 6 revenue streams (PPA, REC, merchant, ancillary, demand response, capacity) individually with per-stream sliders; HHI diversification score updates live
- Review "Merchant Risk" tab for the 500-run Monte Carlo merchant price distribution and "Basis Risk" tab for proxy revenue basis analysis and congestion zone exposure
- Navigate to "Curtailment Intelligence" for hourly and monthly curtailment pattern charts, anti-curtailment strategy effectiveness comparison, and curtailment trend forecast
- Open "Counterparty Risk" tab for IFRS 9 ECL calculation by offtaker rating: PD × LGD × EAD; credit migration matrix; enhancement structure (LC/guarantee) impact on ECL
- Use "Negotiation Toolkit" for term sheet generation and priority matrix; check "Carbon & RECs" for SREC/bundled REC market pricing; review "Intelligence Report" for the deal Proceed/Negotiate/Pass recommendation

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `CORPORATE_BUYERS`, `CREDIT_RATINGS`, `KpiCard`, `MARKETS`, `MARKET_META`, `MONTHLY_CF`, `PD_BY_RATING`, `PPA_CONTRACTS`, `PPA_PRICE_HISTORY`, `STATE_RPS`, `SelectInput`, `Sidebar`, `SliderInput`, `TABS`, `Tab1`, `Tab10`, `Tab11`, `Tab12`, `Tab13`, `Tab14`, `Tab15`, `Tab16`, `Tab17`, `Tab18`, `Tab2`, `Tab3`, `Tab4`, `Tab5`, `Tab6`, `Tab7`, `Tab8`, `Tab9`, `Toggle`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PPA_PRICE_HISTORY` | 8 | `ERCOT`, `CAISO`, `PJM`, `MISO`, `SPP`, `NYISO`, `UK`, `Germany`, `Australia` |
| `CORPORATE_BUYERS` | 11 | `sector`, `mwh`, `price`, `term`, `market`, `re100`, `signed`, `structure` |
| `STATE_RPS` | 13 | `target`, `year`, `srec`, `penalty` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtM` | `v => `$${(v / 1).toFixed(1)}M`;` |
| `fmtPct` | `v => `${(v * 100).toFixed(1)}%`;` |
| `MARKETS` | `['ERCOT','CAISO','PJM','MISO','SPP','NYISO','ISO-NE','UK','Germany','Australia'];` |
| `CREDIT_RATINGS` | `['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB'];` |
| `PD_BY_RATING` | `{ AAA:0.0001,['AA+']:0.0002,AA:0.0003,['AA-']:0.0004,['A+']:0.0005,A:0.0006,['A-']:0.0008,['BBB+']:0.0015,BBB:0.0022,['BBB-']:0.0040,['BB+']:0.0070,BB:0.0090 };` |
| `autoGWh` | `Math.round(cfg.capacityMW * (cfg.capacityCF / 100) * 8760 / 1000);` |
| `p90` | `Math.round(cfg.p50GWh * 0.90);` |
| `contractedGWh` | `cfg.p50GWh * (1 - cfg.curtailmentPct / 100) * (cfg.contractedPct / 100);` |
| `merchantGWh` | `cfg.p50GWh * (1 - cfg.curtailmentPct / 100) * (merchantPct / 100);` |
| `ppaRev` | `contractedGWh * cfg.strikeMWh / 1000;` |
| `merchantRev` | `merchantGWh * cfg.merchantLMP * (1 - Math.abs(cfg.basisPct) / 100) / 1000;` |
| `recRev` | `cfg.p50GWh * cfg.recPrice / 1000;` |
| `totalRev` | `ppaRev + merchantRev + recRev;` |
| `discountRate` | `cfg.discountRate / 100;` |
| `escalatedPrice` | `cfg.strikeMWh * Math.pow(1 + cfg.escalatorPct / 100, y);` |
| `varMerchant` | `merchantRev * (cfg.merchantSigmaPct / 100) * 1.645;` |
| `wale` | `cfg.ppaTermYr * (cfg.contractedPct / 100);` |
| `carbonAdder` | `cfg.carbonAdditionality ? cfg.p50GWh * (3.5) / 1000 : 0;` |
| `ppaNpv` | `Array.from({ length: Math.min(cfg.ppaTermYr, 25) }, (_, y) => {` |
| `esc` | `cfg.strikeMWh * Math.pow(1 + cfg.escalatorPct / 100, y);` |
| `ecl` | `pd * lgd * exposure;` |
| `ppavLcoe` | `cfg.strikeMWh - lcoeEst;` |
| `avgScore` | `scorecard.reduce((a, b) => a + b.score, 0) / scorecard.length;` |
| `netGWh` | `cfg.p50GWh * (1 - cfg.curtailmentPct / 100);` |
| `curtailedGWh` | `cfg.p50GWh - netGWh;` |
| `basisFactor` | `1 + cfg.basisPct / 100;` |
| `curtailLoss` | `curtailedGWh * cfg.strikeMWh / 1000;` |
| `basisAdj` | `ppaRev * Math.abs(cfg.basisPct) / 100;` |
| `netRev` | `ppaRev + recRev + merchantRev - curtailLoss - basisAdj;` |
| `rec` | `cfg.recPrice > 0 ? cfg.p50GWh * cfg.recPrice / 1000 : 0;` |
| `total` | `ppaR + merchant + rec;` |
| `npv` | `total / Math.pow(1 + discountRate, y + 1);` |
| `chartData` | `projection20.map(r => ({` |
| `breakeven` | `cfg.strikeMWh / basisFactor;` |
| `capex` | `cfg.capacityMW * 1200; // $1200/kW` |
| `itcBenefit` | `capex * (cfg.itcPct / 100);` |
| `annualOpex` | `cfg.capacityMW * 15000; // $15/kW/yr` |
| `netCapex` | `capex - itcBenefit;` |
| `annualDebt` | `netCapex * 0.7 * cfg.discountRate / 100;` |
| `reqRevenue` | `(netCapex * (cfg.targetIRR / 100) + annualDebt + annualOpex) / 1000000;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `CORPORATE_BUYERS`, `CREDIT_RATINGS`, `MARKETS`, `PPA_PRICE_HISTORY`, `STATE_RPS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PPA Price (fixed) | `Negotiated; benchmarked vs LCOE + developer margin` | LevelTen Energy PPA Index | Contracted energy price for PPA tenor (10–20yr); must exceed LCOE for positive equity return; $45–55/MWh typical for new US utility solar PPA (2024) |
| Merchant Revenue Share | `Uncontracted generation × spot price` | Day-ahead market data | Residual revenue after PPA obligation; 100% merchant projects use Price Cap Contract (CfD) as downside protection |
| VPPA Settlement | `(Strike − Spot) × MWh generated` | EFET VPPA terms | Virtual/financial PPA — no physical delivery; corporate buyer receives/pays settlement when spot diverges from strike; eliminates additionality risk for RE100 buyers |
| Curtailment Rate | `Curtailed MWh / Available MWh` | ISO/RTO dispatch data | Grid-instructed curtailment for congestion management; increases with RE penetration; basis risk if curtailment is concentrated |
| Counterparty ECL | `PD × LGD × EAD (IFRS 9)` | S&P transition matrix | Expected credit loss on PPA receivables; investment-grade offtaker (BBB+): ~0.2% ECL; sub-IG: 1.5–4% ECL; collateral/LC reduces LGD |
| Revenue at Risk (95%) | `σ_combined × 1.645 × annual revenue` | Monte Carlo model | Maximum annual revenue shortfall at 95% confidence; sum in quadrature of volume, price, and curtailment variance components |
- **PPA contract terms (price, tenor, volume, indexation, floor/cap)** → Revenue model: contracted + merchant + REC + ancillary → **Annual revenue breakdown, DSCR under PPA + merchant scenarios**
- **Monte Carlo: generation σ, merchant price GBM, curtailment γ distribution** → Combined revenue variance model (sum in quadrature) → **P10/P50/P90 annual revenue, Revenue at Risk at 95% confidence**
- **Counterparty credit rating + collateral structure (LC, escrow, parent guarantee)** → IFRS 9 ECL: S&P transition PD × LGD × EAD → **Expected credit loss provision on PPA receivables, DSCR adjusted for ECL**

## 5 · Intermediate Transformation Logic
**Methodology:** PPA Pricing + Merchant VaR + VPPA Mark-to-Market
**Headline formula:** `RaR₉₅ = σ_rev × 1.645 × E_gen; VPPA_MTM = (VPPA_strike − P_spot) × E_gen; ECL = PD × LGD × EAD`

Revenue variance comes from 3 independent sources: (1) volume risk — generation Monte Carlo (Box-Muller); (2) price risk — merchant price volatility (GBM); (3) curtailment risk — grid congestion model. PPA Revenue = min(contracted_volume, generation) × PPA_price. Merchant Revenue = max(0, generation − PPA_volume) × spot_price. VPPA mark-to-market = (strike − settlement_price) × generated_MWh; negative when spot > strike (VPPA buyer receives settlement). IFRS 9 ECL: PD from S&P transition matrix, LGD from security/guarantee structure, EAD = undiscounted PPA receivables.

**Standards:** ['IFRS 9 ECL', 'EFET PPA Master Agreement', 'FERC PURPA', 'RE100 VPPA Standards']
**Reference documents:** LevelTen Energy — RE Quarterly PPA Price Index 2024; EFET — Master Agreement for Power Purchase and/or Transmission of Electricity (2022); IFRS 9 Financial Instruments — Expected Credit Loss (IASB 2014); FERC Order 888 / PURPA — Must-take provisions and avoided cost rates; Wood Mackenzie — Corporate PPA Market Monitor (Q3 2024)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — ATB-calibrated fair-value strike solver with sized debt (analytics ladder: rung 2 → 3)

**What.** The 18-tab configurator already earns rung 2: deterministic revenue build, escalated NPV, IFRS 9 ECL, and a methodologically sound 500-path Box-Muller merchant Monte Carlo. Its weak core is the "is this price fair?" answer: §7.4 documents that `reqRevenue` mixes $/kW-scale capex with $-scale opex (units inconsistency), `lcoeEst` is a flat constant per technology ($28/$30/$35), and leverage is a fixed 70% heuristic. Evolution A implements the §8 spec: NREL-ATB-calibrated LCOE, DSCR-constrained debt sizing, and an iteratively solved fair-value strike (bisection on levered equity IRR = targetIRR).

**How.** (1) Port the revenue build and MC to a backend engine (`api/v1/routes/ppa_revenue.py`, `POST /fair-value`, `POST /revenue-at-risk`) so numbers are pinnable. (2) Seed `ref_atb_technology_costs` from the public NREL ATB CSV (capex/opex/CF by technology-year) replacing the three hard-coded constants. (3) Reconcile the two coexisting VaR figures §7.3 flags (parametric `varMerchant` vs Tab-6 empirical MC VaR₉₅) into one documented measure with the other labelled as a cross-check. (4) Validate strikes against the LevelTen PPA Price Index per §8.5.

**Prerequisites.** Fix the `reqRevenue` unit bug first — it invalidates today's fair-value flag; ATB ingest job added to the ingestion framework. **Acceptance:** bench_quant reproduces the §7.4 base case ($10.11M totalRev) and the solved strike moves monotonically with targetIRR and DSCR_min; the fair-value output carries an ATB vintage stamp.

### 9.2 Evolution B — Deal-structuring analyst across the 18 tabs (LLM tier 2)

**What.** A tool-calling analyst that operates the deal configurator conversationally: "structure this 200MW ERCOT solar deal at 80% contracted — what strike clears an 11% IRR, and what's the ECL if the buyer is BBB with only a parent guarantee?" Each clause maps to a real engine call (`/fair-value`, `/revenue-at-risk`, the ECL calculation `PD_BY_RATING × LGD × ppaNpv`); the LLM narrates outputs and drafts the Tab-14 term-sheet text from computed values instead of the current static checklist.

**How.** Tool schemas generated from the Evolution-A OpenAPI spec; system prompt grounded in this Atlas page (§5 methodology, §7.1–7.3 formulas, §7.6 limitations — including that `CORPORATE_BUYERS`/`PPA_PRICE_HISTORY` are illustrative comps, so the copilot must caveat market-comparison claims). The no-fabrication validator checks every $/MWh and IRR in the answer against tool outputs. The Proceed/Negotiate/Pass recommendation (Tab 18) stays rule-based; the LLM explains it, never overrides it.

**Prerequisites.** Evolution A's backend (tier 2 needs endpoints; today all math is in-page); golden Q&A written from the §7.4 worked example. **Acceptance:** every numeric in a generated term sheet traces to a tool call; asked for a market price the module doesn't source live (e.g. current CAISO forwards), the analyst cites the illustrative-data caveat rather than inventing one.