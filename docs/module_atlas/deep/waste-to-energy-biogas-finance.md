## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry gives a real project-finance formula set
> (`DSCR = EBITDA/DebtService`, `Equity_IRR solves NPV_equity=0`, `LCOE = (CapEx×FCR+OpEx)/(Capacity×
> CF×8760)`). The code's interactive calculator implements **neither** — `estimatedIRR` is a capped
> linear heuristic, not an IRR solve, and there is no DSCR or LCOE calculation anywhere in the
> component. The 22-project pipeline's `irr`, `debtGearing`, `capexM` fields are independent random
> draws, not derived from any cash-flow model either. The sections below document what is genuinely
> computed: a revenue estimator and a 25-year illustrative cash-flow chart.

### 7.1 What the module computes

The interactive calculator (Revenue Modelling tab) is the only genuinely-formulaic piece:

```js
annualRevenue = capacityMW × 8760 × 0.85 × electricityPrice / 1e6      // electricity stream, $M
              + capacityMW × 1.8 × gateFeeSel / 1000                    // + gate-fee stream, $M
estimatedIRR  = clamp( gateFeeSel/10 + electricityPrice/50, 5, 18 )     // NOT a real IRR — a bounded heuristic
```

`0.85` is an implied capacity factor; `1.8` is an implied tonnes-of-waste-processed-per-MW-per-year
multiplier (both unlabelled magic numbers, not tied to any named `TECHNOLOGIES` row's `efficiency` or
`capex`). The 22-project `PROJECTS` pipeline, `CF_DATA` (25-year illustrative cash flow), and
`IRREVOL_CHART` (gate-fee-vs-IRR scatter, 20 points) are all independently `sr()`-seeded and
unconnected to the calculator's two sliders.

### 7.2 Parameterisation

| Technology | LCOE ($/MWh) | GHG abatement (tCO2e/MWh) | Provenance |
|---|---|---|---|
| Anaerobic Digestion (AD) | 82 | 0.48 | Author-calibrated, consistent with guide's cited €55/t gate fee + power revenue framing |
| Landfill Gas (LFG) | 48 | 0.65 | ″ — cheapest, matches guide's "$48/MWh" LFG figure |
| Mass-burn EfW | 95 | 0.31 | ″ |
| Biogas Upgrading (biomethane) | 65 | 0.72 | ″ — highest abatement, consistent with grid-injection premium framing |
| Plasma Arc Gasification | 165 | 0.28 | ″ — highest cost, "Niche" maturity |

`estimatedIRR`'s two coefficients (`/10`, `/50`) were evidently chosen so that plausible slider
ranges (gateFee $20–140/t, electricity $40–150/MWh) land within the guide's cited 9–13% AD IRR band —
but the formula is additive and linear, meaning IRR scales with gate fee and electricity price
independently and without any capex, opex, debt service, or tax term at all.

### 7.3 Calculation walkthrough

1. **Market Overview / Technology Matrix tabs** render the 8-technology comparison table directly.
2. **Project Pipeline tab** filters the 22 named projects (real-sounding names like "Thames EfW
   Barking," "Biffa AD Cannock") by technology; `irr`, `capexM`, `debtGearing`, `tenorYrs` are all
   independent random fields per project, not derived from `capacityMW` or `gateFeePerT`.
3. **Revenue Modelling tab** is the interactive calculator: moving `capacityMW`/`gateFeeSel`/
   `electricityPrice` sliders recomputes `annualRevenue` and `estimatedIRR` live.
4. **Cash Flow Analysis tab** renders `CF_DATA` — 25 years of `revenue`/`opex`/`debt`/`fcf`, each an
   independent `sr()` draw with a small linear growth term (e.g. `revenue = sr(i·13)×2+6+i×0.08`) —
   illustrative only, not derived from the calculator's `annualRevenue`.
5. **Policy & Finance tab** — static table of 6 countries' real support-scheme names (UK RO/CfD,
   Germany EEG 2023, France Appels d'offres Biogaz, Italy DM 2016, US IRA §45, Netherlands SDE++)
   with plausible tariff figures — descriptive reference data, not wired into any calculation.

### 7.4 Worked example

At default slider values (`capacityMW=20`, `gateFeeSel=65`, `electricityPrice=90`):

| Step | Computation | Result |
|---|---|---|
| Electricity revenue | 20 × 8760 × 0.85 × 90 / 1e6 | **$13.40M** |
| Gate-fee revenue | 20 × 1.8 × 65 / 1000 | **$2.34M** |
| Total `annualRevenue` | 13.40 + 2.34 | **$15.74M** |
| `estimatedIRR` | clamp(65/10 + 90/50, 5, 18) = clamp(6.5+1.8, 5, 18) | **8.3%** |

The IRR figure lands within the guide's cited "9–13%" AD IRR range only by coincidence of slider
choice — moving `electricityPrice` to $150 gives `estimatedIRR = clamp(6.5+3.0,5,18) = 9.5%`, still
plausible, but the formula has no mechanism to reflect genuinely important IRR drivers like debt
tenor, capex per MW, or O&M cost — a 500MW EfW plant and a 5MW AD plant at the same gate fee and
power price would show the *identical* IRR, which is not realistic (larger plants typically achieve
better unit economics from capex scale efficiency).

### 7.5 Data provenance & limitations

- **The 8 technologies' cost/efficiency figures and the 6-country policy table are plausible,
  author-calibrated reference data**, broadly consistent with the guide's cited IRENA/Gas for
  Climate/UK BEIS sources but not pulled from a live feed.
- **The 22-project pipeline and 25-year cash flow are entirely synthetic** (`sr()`-seeded), with no
  linkage between a project's technology, capacity, and its randomly-assigned IRR/gearing/tenor.
- **`estimatedIRR` is not an IRR** — no cash-flow schedule, discount rate, or NPV=0 solve exists; it
  is a two-term linear heuristic bounded to [5,18].

**Framework alignment:** IRENA Bioenergy Finance Review 2023, Gas for Climate Biomethane Tracker
2023, and UK BEIS RO Banding Review 2022 (all named in the guide) inform the *reference* technology
and policy tables' calibration but are not connected to any live-computed IRR/DSCR/LCOE.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production WtE/AD Project Finance model gives infrastructure lenders and developers a genuine
equity IRR and DSCR for a specific project configuration, replacing the current bounded-heuristic
`estimatedIRR` — supporting debt sizing and investment committee decisions.

### 8.2 Conceptual approach
Standard project-finance cash-flow waterfall methodology (as used by infrastructure debt funds and
described in the guide's own unimplemented formula set): build a full revenue-less-opex-less-debt-
service annual cash flow over the asset life, then solve for the discount rate that zeroes equity
NPV (Newton-Raphson IRR solver — the same numerical method already used correctly elsewhere on this
platform, e.g. `wind-repowering-intelligence`'s `calcIRR`).

### 8.3 Mathematical specification

```
Revenue_t = GateFee_t × TonnageProcessed + ElecPrice_t × Capacity × CF × 8760 + HeatRevenue_t + RECValue_t
EBITDA_t  = Revenue_t − Opex_t
DebtService_t = Principal_t + Interest_t                    // amortising per debt term sheet
DSCR_t    = EBITDA_t / DebtService_t                          // lenders require DSCR ≥ 1.2–1.4x typical
FCFE_t    = EBITDA_t − DebtService_t − Capex_t(t=0) − Tax_t
Equity_IRR: Σ_t FCFE_t / (1+IRR)^t = 0                        // Newton-Raphson solve
LCOE      = (CapEx × CRF + OpexAnnual) / (Capacity × CF × 8760)
```

| Parameter | Calibration source |
|---|---|
| `CF` (capacity factor) by technology | IEA Bioenergy WtE Task 36 published availability factors |
| `TonnageProcessed`/technology efficiency | Eunomia WtE Cost Survey 2023 |
| Debt tenor/gearing/DSCR covenant | Infrastructure debt market convention (typically 15-18yr tenor, 65-75% gearing, 1.3x DSCR floor) |
| `RECValue_t` | UK ROC/CfD, Germany EEG, US IRA §45 — already tabulated in `POLICY_DATA` |

### 8.4 Data requirements
Project-specific capex/opex quotes, debt term sheet (tenor, margin, amortisation profile), gate-fee
contract terms (tenor, escalation), and power/heat offtake agreement pricing. The platform's existing
`TECHNOLOGIES` and `POLICY_DATA` tables already supply the technology cost/efficiency and policy
revenue inputs; only the cash-flow waterfall and IRR solver need to be added.

### 8.5 Validation & benchmarking plan
Backtest against realised project IRRs from public infrastructure-fund disclosures for comparable
AD/EfW assets; reconcile DSCR against actual lender covenant compliance history where available;
sensitivity-test Equity_IRR to ±20% gate-fee and electricity-price shocks (standard lender stress
test).

### 8.6 Limitations & model risk
Gate-fee revenue is the dominant, lowest-risk stream (per the guide's own `REVENUE_STREAMS` table,
45% weight, "Low" risk) — a production model should stress-test gate-fee contract renewal risk at
the tenor boundary explicitly, since municipal waste contracts commonly reprice at renewal and this
is the single largest IRR sensitivity for AD/EfW projects.
