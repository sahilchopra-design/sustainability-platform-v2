# Solar Project Finance Engine
**Module ID:** `solar-project-finance` · **Route:** `/solar-project-finance` · **Tier:** B (frontend-computed) · **EP code:** RE-PF1 · **Sprint:** RE

## 1 · Overview
End-to-end project finance model for utility-scale solar IPP transactions. Computes LCOE, IRR (equity/project), NPV, DSCR, LLCR, and PLCR from user-defined capital structure, ITC/PTC IRA 2022 incentives, MACRS depreciation, and LP/GP 4-tier waterfall. Supports Monte Carlo P10/P50/P90 energy generation and scenario stress-testing across 12 analytical tabs.

> **Business value:** Designed for infrastructure investors, tax equity investors, independent power producers, and project finance lenders evaluating utility-scale solar transactions under IRA 2022. Replaces traditional Excel-based financial models with an interactive, real-time engine covering all ITC/PTC scenarios, DSCR covenants, and LP/GP structures typical of 50–500 MW US solar IPP deals.

**How an analyst works this module:**
- Set project parameters in the left Configuration panel: capacity MW, technology, location, CAPEX $/Wdc, O&M $/kW/yr, and project life
- Open the "DSCR & Debt" tab — configure Debt/CAPEX ratio, interest rate, loan tenor, and DSRA months; DSCR/LLCR/PLCR schedule updates live
- Navigate to "IRA Tax Credits" tab — toggle domestic content (+10%), energy community (+10%), and low-income community (+10%) adders; view full ITC stack up to 70% and MACRS [20/32/19.2/11.52/11.52/5.76]% depreciation shield
- Check "P50/P90 Yield" tab for probabilistic energy production — set uncertainty inputs and view P10/P50/P90/P99 annual generation bands used for lender vs sponsor case sizing
- Open "Monte Carlo" tab (1,000 runs, Box-Muller) to see combined IRR and revenue distribution under correlated input uncertainty
- Review "Returns Engine" for equity IRR (Newton-Raphson), project IRR, and MOIC; "Financial Model" shows year-by-year cash flows including construction draw, ITC receipt, and debt amortization
- Use "Scenario Engine" to define 4 stress scenarios (Base/Bull/Bear/Tail) and toggle inputs — IRR sensitivity waterfall and DSCR breach probability update instantly
- Open "LP/GP Waterfall" for 4-tier distribution: preferred return (8%) → catch-up → 80/20 profit split → GP promote; "Tax Equity & JV" shows partnership flip structure mechanics
- Check "LCOE Deep Dive" for component LCOE breakdown and "Comparable Transactions" to benchmark against recent utility-scale solar financial closes
- Review "ESG & Sustainability" for EU Taxonomy Art.10 and DNSH, "Risk Register" for 15-factor project risk matrix, and "Construction Timeline" for phased drawdown schedule

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Badge`, `CF_BY_LOC`, `CollapseSection`, `DataTable`, `HEADER_BG`, `HeatCell`, `IRENA_SOLAR`, `InputSelect`, `KpiCard`, `LOCATIONS`, `MACRS15`, `MACRS5`, `NAV_BG`, `SOLAR_GOLD`, `SectionTitle`, `SliderRow`, `TABS`, `TECHNOLOGIES`, `TOP_SOLAR_MARKETS`, `TabComps`, `TabConstruction`, `TabDscr`, `TabESG`, `TabFinancialModel`, `TabIRA`, `TabLCOE`, `TabMemo`, `TabMonteCarlo`, `TabOverview`, `TabPortfolio`, `TabRefinancing`, `TabRegulatory`, `TabReturns`, `TabRisk`, `TabScenarios`, `TabSensitivity`, `TabTaxEquity`, `TabWaterfall`, `TabYield`, `Toggle`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `LOCATIONS` | `['ERCOT-West','CAISO-SP15','PJM-West','MISO-Central','NYISO','ISO-NE'];` |
| `CF_BY_LOC` | `{ 'ERCOT-West':25.5,'CAISO-SP15':22.0,'PJM-West':19.5,'MISO-Central':20.0,'NYISO':17.0,'ISO-NE':15.5 };` |
| `IRENA_SOLAR` | `Object.fromEntries((IRENA_RENEWABLE_CAPACITY_2023\|\|[]).map(c=>[c.country,c.solar_pv_gw]));` |
| `TOP_SOLAR_MARKETS` | `(IRENA_RENEWABLE_CAPACITY_2023\|\|[]).sort((a,b)=>(b.solar_pv_gw\|\|0)-(a.solar_pv_gw\|\|0)).slice(0,15).map(c=>({country:c.country,solar_gw:c.solar_pv_gw,yoy_growth:c.yoy_growth_pct}));` |
| `npv` | `cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0);` |
| `dnpv` | `cashflows.reduce((s, cf, t) => s - t * cf / Math.pow(1 + rate, t + 1), 0);` |
| `factor` | `Math.pow(1 + r, n);` |
| `annualEnergy` | `cf * 8760 * mw * 1000; // kWh` |
| `annualCapex` | `capex * crf;` |
| `fmtPct` | `n => isFinite(n) && n !== null ? (n * 100).toFixed(1) + '%' : '—';` |
| `fmtPctD` | `n => isFinite(n) && n !== null ? (n).toFixed(1) + '%' : '—';` |
| `fmtM` | `n => isFinite(n) && n !== null ? '$' + (n \|\| 0).toFixed(1) + 'M' : '—';` |
| `fmtX` | `n => isFinite(n) && n !== null ? (n \|\| 0).toFixed(2) + 'x' : '—';` |
| `fmtK` | `n => isFinite(n) && n !== null ? '$' + Math.round(n \|\| 0).toLocaleString() + 'k' : '—';` |
| `fmtMWh` | `n => isFinite(n) && n !== null ? '$' + (n \|\| 0).toFixed(2) + '/MWh' : '—';` |
| `fmtGWh` | `n => isFinite(n) && n !== null ? (n \|\| 0).toFixed(2) + ' GWh' : '—';` |
| `ratio` | `max > min ? (value - min) / (max - min) : 0;` |
| `totalTaxRate` | `(fedTaxRate + stateTaxRate) / 100;` |
| `totalCapexM` | `capacityMW * 1000 * capexPerW / 1e6;` |
| `totalCapex` | `totalCapexM * 1e6;` |
| `debtAmount` | `totalCapex * debtPct / 100;` |
| `equityAmount` | `totalCapex - debtAmount;` |
| `debtFeeAmt` | `debtAmount * debtFees / 100;` |
| `itcRate` | `itcTotal / 100;` |
| `itcBasis` | `totalCapex; // full capex eligible` |
| `itcAmount` | `usePTC ? 0 : itcBasis * itcRate;` |
| `macrsBasis` | `usePTC ? totalCapex : totalCapex * (1 - itcRate / 2);` |
| `years` | `Array.from({length: projectLife}, (_, i) => i + 1);` |
| `grossGenY1` | `capacityMW * cf / 100 * 8760 / 1000; // GWh` |
| `curtailFactor` | `1 - curtailmentPct / 100;` |
| `dsra` | `annualDS * dsraMonths / 12;` |
| `annuals` | `years.map(yr => {` |
| `degFactor` | `Math.pow(1 - degradation / 100, yr - 1);` |
| `grossGen` | `grossGenY1 * degFactor;` |
| `netGen` | `grossGen * curtailFactor;` |
| `ppaFactor` | `Math.pow(1 + ppaEscalator / 100, yr - 1);` |
| `effPpaPrice` | `ppaPrice * ppaFactor;` |
| `spotPrice` | `effPpaPrice * 0.85;` |
| `recRev` | `netGen * 1000 * recPrice / 1e6;` |
| `curtailLoss` | `grossGen * 1000 * effPpaPrice * (curtailmentPct / 100) / 1e6;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `LOCATIONS`, `MACRS15`, `MACRS5`, `TABS`, `TECHNOLOGIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LCOE | `LCOE = (ΣCapex+ΣOPV) / ΣE_t×(1+r)^-t` | Project finance model | Levelized Cost of Energy — all-in breakeven price per MWh over project life; competitive solar is $28–42/MWh for utility-scale |
| Equity IRR | `Newton-Raphson on post-tax equity CFs` | Calculated from inputs | After-tax equity internal rate of return; institutional RE funds target 10–14%; merchant projects may reach 16–18% |
| DSCR (min) | `CFADS / Annual Debt Service` | Cash flow model | Minimum DSCR over loan tenor; lenders typically require ≥1.25× on PPA projects, ≥1.35× on merchant; covenant breach triggers cash trap |
| LLCR | `NPV(CFADS, loan life) / Outstanding Debt` | Cash flow model | Loan Life Coverage Ratio — forward-looking; if LLCR falls below 1.0 the project cannot service remaining debt from projected cash flows |
| ITC Basis | `IRA 2022 §48E stack: Base + DC + EC + LIC` | IRS Notice 2023-29 | Investment Tax Credit percentage; domestic content (+10%) requires ≥40% US-manufactured steel/iron/components; energy community (+10%) requires location in fossil fuel employment zone |
| P90 Energy Yield | `Monte Carlo Box-Muller, combined σ across 6 uncertainty sources` | Resource + engineering | P90 (1-in-10 exceedance) used by lenders for debt sizing; P50 used for equity returns; gap reflects GHI variability, wake losses, and availability uncertainty |
| MOIC (equity) | `Total equity distributions / equity invested` | Waterfall model | Multiple on invested capital; typical RE equity fund target 2.0–2.5× over 7-year hold; includes carried interest promote at 80/20 split above preferred return |
- **User inputs: CAPEX $/Wdc, O&M, PPA price, debt terms, ITC toggles** → Financial model engine (Newton-Raphson IRR, MACRS, ITC stack) → **Project IRR, DSCR schedule, LLCR, LCOE, waterfall distributions**
- **Monte Carlo engine: combined σ across 6 uncertainty sources** → Box-Muller normal sampling (1,000 runs) → **P10/P50/P90/P99 annual generation and revenue distributions**
- **IRA 2022 adder rules: domestic content, energy community, low-income** → ITC basis calculator → **Applicable ITC %, half-basis MACRS reduction, net tax equity benefit**

## 5 · Intermediate Transformation Logic
**Methodology:** Newton-Raphson IRR + DSCR/LLCR/PLCR Project Finance
**Headline formula:** `IRR: Σ CF_t/(1+IRR)^t = 0 (Newton-Raphson 200 iter); LCOE = (CAPEX + Σ O&M_t/(1+r)^t) / Σ E_t/(1+r)^t; DSCR = CFADS / DebtService; LLCR = NPV(CFADS) / Outstanding Debt`

Equity IRR computed via Newton-Raphson iteration on post-tax equity cash flows including ITC, MACRS depreciation shield, and LP/GP waterfall distributions. LCOE uses real levelized cost approach over project life. DSCR covers all 25 annual periods; LLCR uses NPV(CFADS) / loan balance. IRA 2022 ITC stack: base 30% + domestic content 10% + energy community 10% + low-income 10%; half-basis MACRS reduction applied. MACRS 5-year GDS: [20%, 32%, 19.2%, 11.52%, 11.52%, 5.76%].

**Standards:** ['IRA 2022 §48E ITC', 'MACRS 5-yr GDS', 'FERC Filing', 'AICPA SSVS']
**Reference documents:** IRS Notice 2023-29 — Energy Community Bonus Credit Eligibility under IRA §48E; SEIA/Wood Mackenzie U.S. Solar Market Insight — Utility-Scale Benchmarks 2024; MACRS GDS 5-Year Property Table (Rev. Proc. 87-57); NREL System Advisor Model (SAM) — Financial Metrics Technical Reference; S&P Global — Renewable Energy Project Finance Default and Recovery Study 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`

## 7 · Methodology Deep Dive

### 7.1 What the module computes

This is the **most rigorously implemented project-finance engine in this batch** — a 20-tab, ~2,500-line
model with genuinely correct core financial-engineering primitives, not `sr()`-fabricated headline numbers:

```js
calcIRR(cashflows)          // Newton-Raphson, 200 iterations, 1e-8 convergence tolerance
calcNPV(rate, cashflows)    // standard discounted cash flow sum
calcCRF(r, n)               // capital recovery factor: r×(1+r)^n / ((1+r)^n − 1)
calcLCOE(capex, om, cf, mw, dr, n)   // levelized cost via CRF-annualised capex + O&M over annual energy
macrsDep(schedule, basis, year)      // official IRS MACRS % lookup
boxMuller(u1, u2)           // Box-Muller normal transform for Monte Carlo
```

Real published constants: `MACRS5 = [20.00%, 32.00%, 19.20%, 11.52%, 11.52%, 5.76%]` and `MACRS15` (16-year
schedule) — these are the **actual IRS 5-year and 15-year GDS depreciation percentages**, not approximated.
`IRENA_RENEWABLE_CAPACITY_2023` is wired in as real reference data for the top-15-solar-market comparison.

### 7.2 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| MACRS 5-year schedule | 20.00/32.00/19.20/11.52/11.52/5.76% | official IRS Rev. Proc. 87-57 GDS table — exact match |
| ITC stack | base 30% + domestic content 10% + energy community 10% + low-income 10-20% | matches IRA §48E adder structure |
| MACRS half-basis reduction | `macrsBasis = usePTC ? totalCapex : totalCapex×(1 − itcRate/2)` | **correctly implements** the real IRS rule that claiming the ITC reduces the depreciable basis by half the credit amount |
| Debt sizing | user-set Debt/CAPEX %, interest rate, tenor, DSRA months | standard project-finance covenant structure |
| Location capacity factors (`CF_BY_LOC`) | ERCOT-West 25.5%, ISO-NE 15.5%, etc. across 6 US ISOs | plausible regional solar CF ordering, illustrative not live-sourced |
| Monte Carlo | 1,000 runs, Box-Muller normal sampling on 6 uncertainty sources (capex, price, resource, degradation, etc.) | genuine stochastic simulation, not `sr()`-labelled-as-real numbers |

### 7.3 Calculation walkthrough

- **Annual cash-flow build** (core engine): for each project year, computes gross/net generation (with
  degradation and curtailment), PPA/merchant/REC revenue, opex, EBITDA, debt service (interest + principal
  via a level-payment structure capped at the remaining balance), CFADS, MACRS depreciation, taxable income,
  taxes, net income, and equity distribution.
- **DSCR**: `ebitda / debtService` per year while debt is outstanding; `minDscrVal`/`avgDscr` aggregate across
  the debt tenor — the standard lender covenant metric, correctly computed.
- **LLCR**: `NPV(CFADS over remaining debt tenor, discounted at the debt rate) / outstanding debt amount` —
  correctly forward-looking, not a backward-looking average.
- **MACRS PV shields**: `Σ_year (macrsBasis × schedule[year] × totalTaxRate) / (1+projectDr)^year` — a
  genuine present-value-of-tax-shield calculation.
- **Equity IRR/NPV**: `equityCFs = [−(equity+DSRA+debtFees), ...annual equityDist]`, solved via
  `calcIRR`/`calcNPV` — textbook-correct.
- **⚠️ Tax calculation double-counts the ITC**: `taxableIncome = max(0, ebitda − interest − dep −
  (yr===1 ? itcAmount : 0))` subtracts the ITC dollar amount from *taxable income* in year 1, then
  `taxes = max(0, taxableIncome×totalTaxRate − ptcBenefit − (yr===1 ? itcAmount : 0))` subtracts the **same
  `itcAmount` a second time**, directly from the tax liability. Under real US tax law, the ITC is a
  dollar-for-dollar credit against tax liability (the second subtraction, correctly applied) — it does **not**
  also reduce taxable income (the first subtraction is incorrect; the code's own inline comment flags this
  section as `// Taxes (simplified)`). This double-counts the ITC's benefit, **overstating first-year equity
  cash flow and therefore overstating equity IRR** for any project claiming the ITC (rather than PTC).

### 7.4 Worked example (illustrative 100MW project)

`totalCapex=$150M`, `itcTotal=40%` (base 30 + domestic content 10), `debtPct=60%`, `wacc-equivalent debt
rate r=6.5%`, `totalTaxRate=25%`, Year-1 `ebitda=$12M`, `interest=$5.85M`, `dep(Y1)=macrsBasis×20%`:

| Step | Computation | Result |
|---|---|---|
| `itcAmount` | 150M × 0.40 | $60M |
| `macrsBasis` | 150M × (1 − 0.40/2) | $120M (correct half-basis reduction) |
| `dep(Y1)` | 120M × 0.20 | $24M |
| Taxable income (as coded) | max(0, 12 − 5.85 − 24 − 60) | **$0** (floored — the erroneous extra ITC subtraction plus depreciation already drives this negative before the floor) |
| Taxes (as coded) | max(0, 0×0.25 − 0 − 60) | **$0** (floored at zero — the ITC's tax-liability offset never gets to bind because taxable income already hit zero from the erroneous deduction) |

In this illustrative case the double-count is partially masked by the `max(0,·)` floors both quantities hit,
but for larger EBITDA/smaller ITC combinations where taxable income would otherwise be positive, the bug
directly reduces computed tax liability below the correct value, inflating equity cash flow and IRR.

### 7.5 Data provenance & limitations

- **The core financial-engineering formulas (IRR, NPV, CRF, MACRS, DSCR, LLCR, Box-Muller Monte Carlo) are
  correctly implemented and match textbook/IRS specifications** — a genuine strength relative to most modules
  in this batch.
- **The ITC double-counting bug (§7.3) is a real methodology defect**, not a data-provenance issue — it
  should be fixed by removing the `itcAmount` subtraction from the `taxableIncome` line, leaving it only in
  the direct tax-liability offset.
- Location capacity factors and merchant/REC price assumptions are illustrative constants, not live ISO
  market data.
- `IRENA_RENEWABLE_CAPACITY_2023` is genuinely real reference data, correctly wired for the market-context
  comparison tables.

### 7.6 Framework alignment

- **IRA 2022 §48E ITC / §45Y PTC** — the adder stack and half-basis MACRS reduction rule are correctly
  modelled (net of the tax double-count bug noted above).
- **MACRS GDS 5-year and 15-year property tables (Rev. Proc. 87-57)** — exact match to official IRS
  percentages.
- **Standard project-finance covenant metrics (DSCR, LLCR)** — correctly implemented per conventional lender
  methodology (CFADS-based, forward NPV for LLCR).
- **NREL SAM (System Advisor Model)** — cited in the guide as a methodological benchmark; this module's LCOE
  and cash-flow structure follows the same general approach (levelized annualised capex + O&M over energy
  output) as SAM's financial model, without importing SAM's own code.

## 9 · Future Evolution

### 9.1 Evolution A — Bench-pin the engine, fix the ITC/tax double-count, and back the frontend with an API (analytics ladder: rung 2 → 3)

**What.** This is the batch's most rigorously implemented project-finance engine — a ~2,500-line, 20-tab model with genuinely correct primitives: Newton-Raphson IRR (200 iter, 1e-8 tol), capital-recovery-factor LCOE, official IRS MACRS 5-yr/15-yr schedules (exact match), the correct ITC half-basis MACRS reduction rule, and a real Box-Muller Monte Carlo (1,000 runs) over 6 uncertainty sources — already at rung 2. Two things hold it back: §7 references an ITC/tax double-count bug in the cash-flow build, and despite the sophistication it is a tier-B frontend module (no backend), so nothing persists or is server-validated. Evolution A hardens it into a calibrated, bench-pinned engine.

**How.** (1) Fix the documented tax double-count in the annual cash-flow build (the §7.6 "net of the tax double-count bug" caveat). (2) Add bench_quant golden cases: a known deal (fixed inputs → expected IRR/DSCR/LCOE) pinned in CI so refactors can't silently break the math — this is the platform's rung-3 gate. (3) Lift the engine into a backend route (`POST /api/v1/solar-pf/model`) so results are reproducible, auditable, and consumable by other modules; the frontend becomes a display like `slb-structurer`. (4) Replace illustrative `CF_BY_LOC` capacity factors with values sourced from the sibling `solar-resource-performance` module's NASA POWER integration, closing the loop between resource assessment and project finance.

**Prerequisites.** The tax double-count fix is the gate before bench-pinning (pin the correct numbers); backend lift needs the engine ported from JS to the Python service layer or exposed via a compute endpoint. **Acceptance:** bench_quant reproduces the golden deal's IRR/DSCR/LCOE within tolerance; the double-count is gone (equity IRR changes by the corrected tax amount); capacity factors trace to NASA POWER.

### 9.2 Evolution B — Solar-deal structuring analyst (LLM tier 2)

**What.** A tool-calling analyst over the (backend-lifted) engine: "model a 200MW ERCOT project at $1.10/Wdc with 65% debt", "what does adding the energy-community adder do to equity IRR?", "run the tail scenario and give me DSCR breach probability" — each a call to the model endpoint, with the analyst narrating IRR/DSCR/LLCR/MOIC and the Monte Carlo P10/P50/P90 bands, never computing project finance itself.

**How.** Tool schema from the model endpoint (post-Evolution-A); grounding corpus = this Atlas record (§7.1 primitives, MACRS tables, the ITC/§45Y structure). What-if requests re-run the engine with modified inputs and narrate deltas; scenario requests invoke the 4-scenario stress engine. The no-fabrication validator checks every IRR/DSCR against the tool response; the "show work" expander surfaces the cash-flow build and engine version.

**Prerequisites (hard).** Evolution A's backend lift (tool-calling needs a server endpoint) and the double-count fix (an analyst must not narrate a known-wrong IRR). **Acceptance:** every financial metric in an answer traces to a model-endpoint call with a stated engine version; scenario answers invoke the real stress engine, not LLM estimation.