## 7 · Methodology Deep Dive

This module **substantially delivers what its guide (EP-DY5) describes**: it models C-PACE (Commercial
Property Assessed Clean Energy) financing net cash flow, LTV impact, and a savings-to-investment view over
a curated universe of real PACE programs, states, and improvement types. The core loan mathematics is a
correct amortisation calculation on real inputs — this is a functional finance tool, not a seeded mock
(the `sr()` PRNG is defined but effectively unused). One minor modelling quirk in the energy-savings helper
is flagged in §7.6.

### 7.1 What the module computes

The PACE loan calculator implements standard assessment-lien sizing and level-payment amortisation:

```js
maxLoan       = propertyValue × (maxLtv/100) − existingDebt          // LTV headroom
loanAmount    = min(improvementCost, maxLoan)
annualPayment = loanAmount × (rate/100) / (1 − (1 + rate/100)^(−tenor))   // annuity
netAnnualBenefit = annSavings − annualPayment                         // guide's Net Cash Flow
simplePayback = annSavings > 0 ? loanAmount / annSavings : ∞
feasible      = netAnnualBenefit > 0
```

The cash-flow projection compounds `net = savings − payment` over the tenor into a cumulative-net series.
The energy-benefit helper estimates dollar savings from an efficiency percentage:
```js
annSavings = improvementCost × (annSavingsPct/100) × electricityRate / 0.12
```

### 7.2 Parameterisation / scoring rubric

**Real curated data (not seeded):**

| Dataset | Content | Provenance |
|---|---|---|
| `PACE_PROGRAMS` (7) | PACE Nation, Ygrene, Petros ($200M cap), Nuveen/Greenworks… with maxLTV, rate 6.2–7.5%, tenor 20–30y | Real PACE providers |
| `STATE_PROGRAMS` (10) | CA $12.8B (AB 811, largest globally), FL $4.2B, NY $1.8B… | Real state PACE volumes |
| `IMPROVEMENT_TYPES` (8) | Solar PV (payback 8y, 42 tCO₂), HVAC, LED, battery, EV, envelope, water, seismic | Realistic per-measure cost/savings/CO₂ |

The amortisation rate/tenor come from the selected real program; property value, improvement cost,
existing debt, annual savings, and electricity rate are user inputs. The `/0.12` divisor in the energy
helper normalises against a $0.12/kWh baseline electricity rate (so at the baseline rate the savings equal
`cost × pct`).

### 7.3 Calculation walkthrough

1. User picks a PACE program (sets `maxLtv`, `rate`, `tenor`) and enters property/debt/cost/savings.
2. `calcPaceLoan` sizes the loan against LTV headroom, computes the level annual payment, net benefit, and
   payback, and flags feasibility.
3. `cashflowData` projects savings vs payment over `min(tenor, 20)` years with cumulative net.
4. Other tabs render the real datasets: program landscape, state map/volumes, securitisation (rate/tenor
   of securitised programs), improvement calculator, and investor analytics.

### 7.4 Worked example

Property $2,000k, improvement $400k, existing debt $800k, program PACE Nation (LTV 100%, rate 6.8%, tenor
25y), annual savings $45k:
- `maxLoan = 2000 × 1.00 − 800 = $1,200k` → `loanAmount = min(400, 1200) = $400k`.
- Annuity factor: `0.068 / (1 − 1.068^(−25))`. `1.068^25 ≈ 5.18`, so `1 − 1/5.18 = 0.807`;
  `annualPayment = 400 × 0.068 / 0.807 = 400 × 0.0843 = $33.7k`.
- `netAnnualBenefit = 45 − 33.7 = +$11.3k` → **feasible**; `simplePayback = 400 / 45 = 8.9 yr`.
The savings-to-investment ratio the guide cites is the cumulative-savings/loan view the cash-flow chart
plots — here undiscounted; a full NPV(savings)/loan (the guide's SIR) is not separately computed.

### 7.5 Companion analytics on the page

Ten tabs: overview, PACE mechanics (assessment-lien structure), program landscape, underwriting engine,
energy savings, retrofit calculator, securitisation, state programs, investor analytics, case studies.
The retrofit calculator maps improvement type → savings/CO₂; the underwriting engine applies LTV/consent
logic. No backend engine or route — client-side with real curated data.

### 7.6 Data provenance & limitations

- **Data is real and curated** — PACE programs, state volumes, and improvement economics reflect the
  actual US C-PACE market. The loan mathematics is a correct amortisation, not a heuristic.
- **`calcEnergyBenefit` is simplistic** — `cost × pct × rate/0.12` treats savings as a fixed percentage of
  *capital cost* scaled by an electricity-rate ratio, rather than modelling `kWh saved × $/kWh`. It is a
  rough proxy, not an engineering estimate.
- **No IPMVP measurement-and-verification** despite the guide's citation — savings are assumed inputs, not
  verified against a measured baseline (the guide's IPMVP energy-savings verification is not implemented).
- Cash flow is undiscounted; the guide's `SIR = NPV(savings)/loan` is approximated by cumulative net, not a
  discounted ratio. `sr()` is defined but effectively unused.

**Framework alignment:** *ASTM E2797* (Building Energy Performance Assessment for PACE) frames the
assessment-lien eligibility. *IPMVP Core Concepts (2023)* defines the measurement-and-verification protocol
the guide references (measured baseline vs post-retrofit consumption) — **named but not implemented**;
savings are assumed. *PACENation Market Intelligence* underpins the program/state volume data. The
assessment-lien / lender-consent structure (senior to mortgage, transferable with property) is correctly
represented in the mechanics and underwriting tabs.

---

## 8 · Model Specification — IPMVP-Verified Savings & Discounted SIR

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Add rigour to the energy-savings and savings-to-investment estimates: replace the percentage-of-cost proxy
with an engineering/measured savings model and compute a properly discounted SIR and LTV-impact metric, so
lenders and PACE administrators can underwrite on defensible savings.

### 8.2 Conceptual approach
Implement **IPMVP Option C (whole-facility)** or **Option B (retrofit isolation)**: establish a measured or
engineering baseline, apply the retrofit, and quantify avoided consumption; discount the resulting savings
stream at the property discount rate for the SIR. This mirrors ASHRAE/IPMVP M&V practice and standard
project-finance SIR.

### 8.3 Mathematical specification
```
Savings_kWh(t) = Baseline_kWh(t) − Post_kWh(t)          (Option C)  OR  ΣΔ per measure (Option B)
Savings_$(t)   = Savings_kWh(t) · Rate_$(t) + Savings_therm(t) · GasRate(t)
SIR            = Σ_{t=1..N} Savings_$(t)/(1+r)^t  /  LoanAmount
LTV_impact     = (FirstMortgage + PACE) / PropertyValue
NetCashFlow(t) = Savings_$(t) − PACE_payment(t)
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Baseline consumption | `Baseline_kWh` | Utility bills / building simulation (IPMVP) |
| Retrofit savings | `ΔkWh` per measure | ASHRAE/DOE measure databases; manufacturer specs |
| Energy rate path | `Rate_$(t)` | EIA electricity price forecasts |
| Discount rate | `r` | Property/owner cost of capital |

### 8.4 Data requirements
Utility interval or monthly data (baseline), measure-level savings coefficients, energy price paths (EIA
free), property value and senior-debt balance. The module already holds improvement `annSavingsPct`,
`lifetimeYr`, and `co2AvoidedT`; the new inputs are the measured baseline and rate forecast.

### 8.5 Validation & benchmarking plan
Reconcile modelled savings against post-retrofit measured consumption (IPMVP variance test); benchmark SIR
against PACENation project data. Sensitivity on energy-rate path and discount rate. Verify LTV-impact
against lender-consent thresholds.

### 8.6 Limitations & model risk
Savings are weather- and occupancy-dependent (normalise via degree-days); measured M&V is costly for small
projects (fall back to deemed savings with a haircut). Energy-price forecasts are uncertain. Conservative
fallback: apply a savings realisation factor (<1) to engineering estimates so SIR is not overstated.
