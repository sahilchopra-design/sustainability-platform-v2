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
