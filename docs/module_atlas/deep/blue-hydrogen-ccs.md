## 7 · Methodology Deep Dive

### 7.1 What the module computes

A genuine techno-economic LCOH model for blue hydrogen (`calcBlueH2Lcoh`), plus a
lifecycle-emissions and carbon-tax overlay. The cost stack (per kg H₂):

```js
ngCostPerKg = gasPrice × ngCons                                    // feedstock €/kg
co2Generated = 9.0                                                 // kg CO₂ / kg H₂ (SMR uncaptured)
co2Captured  = co2Generated × captureRate/100
escapedCO2   = co2Generated × (1 − captureRate/100) + methaneSlip × 28/1000   // + CH₄ slip × GWP100
carbonTaxKg  = escapedCO2 × carbonTax / 1000
capexAnn     = capex × 1000 × (wacc/100) / (1 − (1+wacc/100)^−lifetime)       // annuitised
capexPerKg   = capexAnn / (annualTonne × 1000)                    // annualTonne = 250,000 t/yr
opexPerKg    = capex × 1000 × opexPct/100 / (annualTonne × 1000)
```

LCOH = feedstock + CAPEX/kg + OPEX/kg + CO₂ transport-storage/kg + carbon-tax/kg.
Methane slip is converted at **GWP100 = 28** (IPCC AR5 fossil CH₄), a scientifically
sound treatment of upstream leakage.

### 7.2 Parameterisation / process table

`ROUTES` (6 production pathways) with real-shaped techno-economics:

| Route | Capture % | CH₄ slip | LCOH $/kg | CAPEX $/t | Carbon int. kgCO₂/kg | TRL |
|---|---|---|---|---|---|---|
| SMR + post-comb CCS | 55 | 0.8 | 1.8 | 600 | 4.2 | 9 |
| SMR + pre+post (95%) | 93 | 0.8 | 2.4 | 950 | 1.5 | 8 |
| ATR + pre-comb CCS | 95 | 0.3 | 2.0 | 750 | 1.2 | 9 |
| Partial oxidation + CCS | 95 | 0.1 | 2.2 | 800 | 1.0 | 9 |
| CH₄ pyrolysis (turquoise) | 100 | 0.5 | 2.8 | 1,100 | 0.5 | 6 |

`CARBON_STORES` (6 real projects: Sleipner, Northern Lights, Acorn, Porthos, HyNet,
Quest) carry capacity Mt, injection rate, cost $/tCO₂ ($8–15) and geology type. The
`co2Generated = 9.0 kg/kg`, GWP100 = 28, and `annualTonne = 250,000 t/yr` reference
plant are the fixed physical constants.

### 7.3 Calculation walkthrough

1. User sets gas price, capture rate, CAPEX, OPEX %, methane slip, CO₂ transport-
   storage cost, carbon tax, WACC, lifetime.
2. Feedstock, annuitised CAPEX/kg, OPEX/kg, storage cost and residual carbon-tax cost
   sum to LCOH.
3. `routeCompare` runs all six ROUTES; `gasSens`/`carbonSens`/`slipData` sweep gas
   price (€15–85), carbon tax ($30–170) and methane slip (0–2%) to show LCOH and
   lifecycle-emission sensitivity. (45Q credit, per the guide, would net $85/tCO₂
   against storage cost.)

### 7.4 Worked example

SMR + post-combustion CCS, capture 55%, methane slip 0.8%, carbon tax $100/t:

| Step | Computation | Result |
|---|---|---|
| CO₂ captured | 9.0 × 0.55 | 4.95 kg/kg |
| Escaped (process) | 9.0 × 0.45 | 4.05 kg/kg |
| Methane slip CO₂e | 0.8 × 28/1000 | 0.0224 kg/kg |
| Total escaped | 4.05 + 0.022 | 4.07 kg CO₂e/kg |
| Carbon-tax cost | 4.07 × 100/1000 | $0.41/kg |

At only 55% capture the residual 4.07 kgCO₂e/kg leaves blue H₂ barely better than
grey (9–10 kg) and carries a $0.41/kg carbon-tax penalty — illustrating why the
high-capture ATR/POX routes (1.0–1.5 kgCO₂/kg) are the credible low-carbon options,
exactly the message of the route comparison.

### 7.5 Data provenance & limitations

- The LCOH maths is **real** and the `ROUTES`/`CARBON_STORES` values are plausible
  IEA/Global CCS Institute benchmarks (hard-coded). No PRNG drives any output here —
  `sr` is imported but the numbers are parametric.
- Upstream methane leakage is captured only as a flat `methaneSlip` %; a full
  well-to-gate boundary (production + liquefaction + pipeline) is not modelled, and
  the guide notes >2% leakage can erase the blue-vs-grey advantage.
- 45Q credit and DACS-equivalent treatment are described in the guide but applied as
  a simple netting, not a full tax-equity structure.

**Framework alignment:** IEA CCUS in Clean Energy Transitions (capture cost/rate
bands) · Global CCS Institute blue-hydrogen state of the art · US §45Q ($85/tCO₂
geological storage) · IPCC AR5 GWP100 = 28 for the methane-slip conversion (the model
uses this correctly).

## 8 · Model Specification

**Status: specification — not yet implemented in code.** (LCOH is real; this spec
covers the missing full well-to-gate lifecycle-emissions and 45Q tax-equity model.)

**8.1 Purpose & scope.** Certify blue hydrogen's true well-to-gate carbon intensity
(including upstream methane) and its 45Q-adjusted LCOH, to test eligibility for
low-carbon-H₂ incentives (US 45V tiers, EU delegated act) — for producers and offtakers.

**8.2 Conceptual approach.** A **GREET / IEA well-to-gate LCA** carbon-intensity model
coupled to the existing LCOH engine and a **45Q/45V tax-credit** structure, benchmarked
against **IEA Global Hydrogen Review** CI ranges and **Global CCS Institute** capture data.

**8.3 Mathematical specification.**
```
CI_wtg = e_upstream(CH₄ leak·GWP) + e_reforming·(1−capture) + e_energy − e_45Q_storage
  e_upstream = gas_use · leak_rate · GWP100(28 or 84 GWP20)
LCOH = feedstock + CAPEX_ann/H₂ + OPEX/H₂ + (CO₂_captured·cost_TS) − credit_45Q/H₂
credit_45Q = CO₂_stored · $85/t   (12-yr credit, PV-adjusted)
45V_tier: CI_wtg thresholds {<0.45,0.45–1.5,1.5–2.5,2.5–4.0} kgCO₂e/kg → credit $/kg
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| CH₄ leak rate | leak | EDF/IEA methane-tracker basin data |
| GWP | GWP100/20 | IPCC AR6 (28 / 84) |
| Capture rate | capture | Plant design; Global CCS Institute |
| 45Q/45V rates | — | IRS §45Q; Treasury 45V guidance |

**8.4 Data requirements.** Upstream gas methane intensity by basin, reformer design &
capture rate, energy source for capture, storage cost, credit eligibility. Platform
holds the LCOH inputs and store costs; basin-level methane and 45V tiers are new.

**8.5 Validation & benchmarking.** Reconcile CI_wtg against IEA and Hydrogen Council
ranges (3–7 kgCO₂e/kg blue); test 45V tier assignment against Treasury worked
examples; sensitivity on methane leak rate (the swing variable) using GWP20 as a
stress case.

**8.6 Limitations & model risk.** Upstream methane data is sparse and disputed; GWP
horizon choice (20 vs 100) materially changes tier; capture rates degrade in
operation. Conservative fallback: use basin-max leak rate, GWP20 stress, and design
(not nameplate) capture — flag ineligibility whenever CI exceeds the tier boundary.
