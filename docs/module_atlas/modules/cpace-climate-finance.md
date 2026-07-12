# C-PACE Climate Finance Analytics
**Module ID:** `cpace-climate-finance` · **Route:** `/cpace-climate-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DY5 · **Sprint:** DY

## 1 · Overview
C-PACE (Commercial Property Assessed Clean Energy) financing analytics covering assessment lien structure, LTV impact, IPMVP energy savings verification, market volume by state, and lender consent requirements.

> **Business value:** Delivers end-to-end C-PACE financing analytics integrating IPMVP savings verification, LTV impact modelling, and state-specific programme comparison to support origination and underwriting decisions.

**How an analyst works this module:**
- Calculate PACE assessment amount, term, and rate based on eligible improvements (solar, HVAC, EV charging, resilience)
- Model IPMVP-verified energy savings using baseline consumption and improvement performance data
- Assess lender consent requirement by state and calculate combined LTV impact
- Generate savings-to-investment ratio, simple payback, and net present value summary

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `IMPROVEMENT_TYPES`, `Kpi`, `PACE_PROGRAMS`, `STATE_PROGRAMS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PACE_PROGRAMS` | 8 | `name`, `state`, `active`, `maxLtv`, `maxAmountM`, `rate`, `tenor`, `eligible`, `improvements`, `securitized` |
| `STATE_PROGRAMS` | 11 | `status`, `year`, `volume`, `residential`, `commercial`, `notes` |
| `IMPROVEMENT_TYPES` | 9 | `avgCost`, `lifetimeYr`, `annSavingsPct`, `payback`, `co2AvoidedT`, `eligible` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `maxLoan` | `propertyValue * (maxLtv / 100) - existingDebt;` |
| `annualPayment` | `loanAmount > 0 ? loanAmount * (rate / 100) / (1 - Math.pow(1 + rate / 100, -tenor)) : 0;` |
| `netAnnualBenefit` | `annSavings - annualPayment;` |
| `simplePayback` | `annSavings > 0 ? loanAmount / annSavings : Infinity;` |
| `annSavings` | `improvementCost * (annSavingsPct / 100) * electricityRate / 0.12;` |
| `totalVolume` | `STATE_PROGRAMS.reduce((s, p) => s + p.volume, 0);` |
| `securitizationData` | `PACE_PROGRAMS.filter(p => p.securitized).map(p => ({ name: p.name.split(' ')[0], rate: p.rate, tenor: p.tenor }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `IMPROVEMENT_TYPES`, `PACE_PROGRAMS`, `STATE_PROGRAMS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Savings-to-Investment Ratio | `NPV of projected energy savings over PACE term / PACE assessment amount` | IPMVP Option C measurement and verification | Ratio above 1.0 indicates positive net cash flow; lenders typically require 1.2x+ coverage for project approval |
| C-PACE Market Volume (US) | `Annual C-PACE origination volume (2023)` | PACENation Market Intelligence 2023 | Growing 20-30% annually; California, Florida, New York largest markets; 39 states with enabling legislation |
| LTV Combined (with PACE) | `(First mortgage + PACE assessment) / appraised property value` | Property appraisal + PACE lender calculation | Most mortgage lenders require combined LTV below 80%; PACE lien seniority creates lender consent requirement in most states |
- **Utility bills and energy audits** → Pre-retrofit energy consumption and costs → IPMVP baseline establishment → **Energy savings projection**
- **PACENation state programme databases** → State-specific PACE programme rates, terms, eligible improvements → product structuring → **Assessment payment schedule**
- **Commercial property appraisals** → As-is and as-improved property values → LTV calculation and lender consent analysis → **Combined LTV and consent requirement**

## 5 · Intermediate Transformation Logic
**Methodology:** C-PACE Debt Service and Energy Savings Modelling
**Headline formula:** `Net Cash Flow = Energy Savings - PACE Assessment Payment; Savings-to-Investment Ratio = NPV(Energy Savings) / PACE Loan Amount; LTV Impact = (First Mortgage + PACE) / Property Value`

Models C-PACE financing net cash flow by comparing IPMVP-verified energy savings against assessment payment, with LTV and lender consent analysis

**Standards:** ['ASTM E2797 Energy Assessment Standard for PACE', 'IPMVP Core Concepts 2023', 'PACENation Market Intelligence Report 2023']
**Reference documents:** PACENation (2023) C-PACE Market Intelligence Annual Report; IPMVP (2023) Core Concepts for Determining Energy and Water Savings; ASTM (2023) E2797 Standard Practice for Building Energy Performance Assessment; Fannie Mae / Freddie Mac PACE Lender Consent Guidelines 2022

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — IPMVP-grounded savings and discounted SIR (analytics ladder: rung 1 → 2)

**What.** EP-DY5 is a functional finance tool — correct level-payment amortisation
over real curated PACE programs and state volumes, effectively no PRNG. §7.6 names
the three genuine gaps: `calcEnergyBenefit` proxies savings as
`cost × pct × rate/0.12` (percentage of *capital cost*, not `kWh saved × $/kWh`);
IPMVP measurement-and-verification is cited but not implemented (savings are assumed
inputs); and cash flow is undiscounted, so the guide's `SIR = NPV(savings)/loan` is
approximated by cumulative net. Evolution A upgrades the energy side to match the
loan side's rigor.

**How.** (1) Engineering savings model: per `IMPROVEMENT_TYPES` measure, savings =
baseline consumption × measure savings fraction × tariff — with baseline kWh either
entered or estimated from building type/area via published CBECS intensity tables
(curated refdata), replacing the capital-cost proxy. (2) Discounting: NPV of the
savings stream at a user discount rate with tariff escalation, making SIR the actual
discounted ratio and adding the NPV summary the workflow promises. (3) IPMVP layer:
an M&V tracking tab — Option C whole-building baseline vs post-retrofit consumption
entry, weather-normalized via degree-days (Open-Meteo historical data is already
integrated) — so "verified savings" becomes a measured comparison, not an
assumption. (4) Scenario toggles (rung 2): tariff paths and rate environments
sweeping the feasibility frontier.

**Prerequisites.** CBECS intensity table curation; degree-day normalization needs
building location. **Acceptance:** the amortisation regression case still
reproduces; SIR computed at 0% discount equals the current cumulative ratio (sanity
link); entering 12 months of post-retrofit consumption produces a weather-normalized
verified-savings figure distinct from the projection.

### 9.2 Evolution B — Origination copilot for C-PACE underwriting (LLM tier 1)

**What.** C-PACE origination is document-and-rule work across state programs with
different consent regimes — exactly what the module's curated data supports.
Evolution B: a copilot that walks a deal through underwriting: "$3M HVAC+solar
retrofit on a $20M Sacramento office with $11M first mortgage" → computes the
combined LTV against the selected program's max, states California's lender-consent
requirement from `STATE_PROGRAMS`, runs the feasibility calc, and drafts the
origination summary — every figure from the page's own `calcPaceLoan` outputs, every
program rule cited to its curated row.

**How.** Tier-1 against page state and the curated datasets (which are real —
PACENation-derived program and state data), plus the Fannie/Freddie consent
guidelines §5 references as corpus texts. The copilot's caveat discipline comes from
§7.6: savings projections are assumptions until M&V data exists (post-Evolution A it
can distinguish projected from verified). No endpoints exist — the calculator is
client-side — so tool-calling waits on a backend, but the deterministic in-page calc
is drivable through page state alone.

**Prerequisites.** Corpus embedding (D3); Evolution A improves brief quality but
tier 1 ships before it with the assumed-savings disclosure. **Acceptance:** the
copilot's LTV and payment figures match the calculator exactly; consent requirements
quoted correctly per state row; infeasible deals (negative net benefit) are stated
as infeasible, not softened.