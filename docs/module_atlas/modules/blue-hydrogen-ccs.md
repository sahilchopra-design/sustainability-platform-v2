# Blue Hydrogen with CCS Economics
**Module ID:** `blue-hydrogen-ccs` · **Route:** `/blue-hydrogen-ccs` · **Tier:** B (frontend-computed) · **EP code:** EP-DS6 · **Sprint:** DS

## 1 · Overview
Economic and lifecycle analysis of blue hydrogen production via SMR with carbon capture, covering capture cost, CO2 transport and storage, lifecycle emissions versus grey H2, and US 45Q tax credit valuation.

> **Business value:** Blue hydrogen with 90%+ CCS reduces lifecycle emissions to 3-5 kgCO2e/kgH2 versus 10-12 for grey H2; US 45Q credit at $85/tCO2 reduces blue H2 LCOH by $0.4-0.7/kg, making US projects broadly competitive with grey H2 before 2030.

**How an analyst works this module:**
- Model SMR CAPEX and OPEX as baseline blue H2 cost before CCS addition
- Add CCS cost (capture + compression + transport + storage) at $/tCO2 and multiply by capture intensity
- Apply US 45Q credit ($85/tCO2 for geological storage) to calculate net economics
- Compare lifecycle emissions (well-to-gate) versus grey H2 and green H2 across capture rate scenarios

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CARBON_STORES`, `KpiCard`, `ROUTES`, `Slider`, `TABS`, `YEARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ROUTES` | 6 | `label`, `co2CapturePct`, `methaneSlip`, `lcoh`, `capex`, `efficiency`, `maturity`, `trl`, `carbonIntensity`, `color`, `description` |
| `CARBON_STORES` | 7 | `capacity`, `injRate`, `cost`, `risk`, `status`, `co2Type` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `YEARS` | `Array.from({ length: 11 }, (_, i) => 2025 + i);` |
| `ngCostPerKg` | `gasPrice * ngCons; // €/MWh × MWh/kg` |
| `co2Generated` | `9.0; // kg CO2 per kg H2 (SMR w/o capture)` |
| `co2Captured` | `co2Generated * captureRate / 100;` |
| `co2Stored` | `co2CostPerT => co2Captured * co2CostPerT / 1000;` |
| `escapedCO2` | `co2Generated * (1 - captureRate / 100) + methaneSlip * 28 / 1000; // methane slip × GWP100` |
| `carbonTaxKg` | `escapedCO2 * carbonTax / 1000;` |
| `capexAnn` | `capex * 1000 * (wacc / 100) / (1 - Math.pow(1 + wacc / 100, -lifetime));` |
| `annualTonne` | `250000; // tonne per year reference` |
| `capexPerKg` | `capexAnn / Math.max(1, annualTonne * 1000);` |
| `opexPerKg` | `capex * 1000 * opexPct / 100 / Math.max(1, annualTonne * 1000);` |
| `captured` | `co2Gen * captureRate / 100;` |
| `slip` | `methaneSlip * 28 / 1000;` |
| `routeCompare` | `useMemo(() => ROUTES.map(r => ({` |
| `gasSens` | `useMemo(() => Array.from({ length: 8 }, (_, i) => { const gp = 15 + i * 10;` |
| `carbonSens` | `useMemo(() => Array.from({ length: 8 }, (_, i) => { const ct = 30 + i * 20;` |
| `slipData` | `useMemo(() => Array.from({ length: 9 }, (_, i) => { const slip = i * 0.25;` |
| `panelStyle` | `{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text };` |
| `gridStyle` | `{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 };` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_STORES`, `ROUTES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CO2 Capture Cost | `CAPEX_capture×CRF + OPEX_capture / CO2_captured` | IEA 2023 | Post-combustion amine scrubbing dominates; pre-combustion (IGCC) offers higher capture rates but greater CAPEX. |
| Capture Rate | `CO2_captured/CO2_generated` | Global CCS Institute 2023 | 95%+ capture requires advanced solvents and larger equipment; residual emissions from SMR process gas remain. |
| Lifecycle Emissions vs Grey H2 | `LCA boundary: extraction through gate` | IEA Well-to-Gate 2022 | Upstream methane leakage (>2%) can erode blue H2 emission advantage; supply chain integrity critical for lifecycle claim. |
- **SMR plant operating data** → → emissions intensity model → **tCO2/kgH2 by feedstock quality**
- **45Q credit eligibility** → → project economics → **$/kgH2 tax credit value by capture rate**

## 5 · Intermediate Transformation Logic
**Methodology:** Blue H2 Cost and Emissions
**Headline formula:** `LCOH_blue = LCOH_SMR + CCS_cost($/tCO2) × emission_intensity(tCO2/kgH2)`

CCS adds $0.5-1.5/kgH2 at $60-100/tCO2 capture cost; 45Q credit of $85/tCO2 captured significantly improves US project economics.

**Standards:** ['IEA CCUS in Clean Energy Transitions', 'Global CCS Institute Blue Hydrogen', 'US 45Q Tax Credit Guidance']
**Reference documents:** IEA CCUS in Clean Energy Transitions 2021; Global CCS Institute Blue Hydrogen State of the Art 2021; US Treasury 45Q Tax Credit Final Guidance 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`

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

## 9 · Future Evolution

### 9.1 Evolution A — Real gas-price feeds, storage-site capacity constraints, and 45Q logic (analytics ladder: rung 2 → 3)

**What.** This is a genuinely quantitative module: `calcBlueH2Lcoh` is a real annuitised LCOH stack (feedstock + CAPEX/kg + OPEX/kg + CO₂ T&S + carbon tax), six production routes with defensible techno-economics, a methane-slip lifecycle overlay converted at a scientifically correct GWP100 = 28, and gas/carbon sensitivity sweeps (rung 2). The `CARBON_STORES` are six real projects (Sleipner, Northern Lights, Porthos, Quest). What's static: gas price is a slider, the 45Q credit is described in the overview but not clearly wired into the cost stack, and storage-site capacity/injection-rate constraints are display-only. Evolution A grounds the inputs and completes the credit logic.

**How.** (1) Natural-gas feedstock price from real series (the platform's EIA/ENTSO-E gas data) with regional selection, since gas cost dominates blue-H2 LCOH and the sensitivity tab already proves its leverage. (2) Wire 45Q explicitly: $85/tCO₂ geological-storage credit on captured tonnes as a distinct LCOH reduction, with the 12-year credit window (the overview claims a $0.4–0.7/kg impact — make it computed, not asserted). (3) Storage-site selection constrains project scale: `CARBON_STORES` capacity/injection rates cap the deliverable CO₂, so a project matched to a near-full site faces a real bottleneck. (4) Rung 3: calibrate LCOH outputs against published blue-H2 cost ranges (IEA/Global CCS Institute) per route and pin a reference in bench_quant. Extract to `POST /api/v1/blue-hydrogen/lcoh`.

**Prerequisites.** Gas price series coverage; a 45Q parameter set (rate, tenor, capture-threshold eligibility). **Acceptance:** LCOH responds to real regional gas prices; the 45Q credit appears as an itemised $/kg reduction over its window; a capacity-constrained storage site limits project size; outputs land in IEA's cited ranges.

### 9.2 Evolution B — Blue-hydrogen project-economics copilot (LLM tier 2)

**What.** "Is an ATR-with-pre-combustion-CCS plant in the US Gulf competitive with grey H2 at $4/MMBtu gas and $85/t 45Q?" combines feedstock, capture route, credit, and lifecycle emissions — a natural tool-calling workflow. The copilot runs the Evolution-A LCOH model across routes, reports the grey/blue/green comparison, and narrates the methane-slip sensitivity (the module's genuine analytical strength — upstream leakage >2% erodes the emissions advantage), every $/kg and kgCO₂/kg from tool output.

**How.** Backend extraction of `calcBlueH2Lcoh` and the emissions overlay (`POST /api/v1/blue-hydrogen/lcoh`); tool schemas from it. Grounding corpus: this Atlas record — §7.1's cost-stack formula and §7.2's route table — plus the IEA/45Q references. The copilot's honesty duty centres on the methane-slip claim: it must report lifecycle emissions inclusive of the GWP100-weighted slip and flag when upstream leakage assumptions dominate the blue-vs-grey verdict. Storage-site selection and its capacity constraint are surfaced from the `CARBON_STORES` data.

**Prerequisites.** Evolution A's backend extraction and 45Q wiring. **Acceptance:** every LCOH and emissions figure traces to a tool response; the methane-slip assumption is stated in any blue-vs-grey comparison; 45Q impact is shown as a computed $/kg over its window, not an asserted range.