# EV Transition Finance
**Module ID:** `ev-transition-finance` · **Route:** `/ev-transition-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DF5 · **Sprint:** DF

## 1 · Overview
Analyses the financial implications of electric vehicle adoption for automotive OEMs, fleet operators, charging infrastructure investors, and auto lenders. Models ICE stranded asset risk, EV profitability curves, charging infrastructure NPV, and auto loan portfolio climate transition exposure.

> **Business value:** Directly applicable to auto lenders (ECB climate risk guidance), automotive OEM investors, fleet managers, and charging infrastructure funds. Quantifies ICE stranded asset risk in auto loan books, enables EV TCO advisory for fleet clients, and provides charging network investment analytics.

**How an analyst works this module:**
- Select vehicle segment and market for TCO comparison
- Model EV vs ICE total cost over ownership period
- Assess ICE stranded asset risk in auto loan portfolio
- Analyse charging infrastructure investment NPV
- Review OEM transition plan alignment with 2030/2035 targets

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BATTERY_CURVE`, `CHARGER_TYPES`, `Card`, `FLEETS`, `GEOS`, `KpiCard`, `OEM_DATA`, `POWERTRAIN`, `SEGMENTS`, `TABS`, `TCO_BASE`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `BATTERY_CURVE` | 12 | `year`, `cost` |
| `OEM_DATA` | 11 | `oem`, `evShare`, `sales2024`, `target2030` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt0` | `v => Number(v).toLocaleString('en-GB', { maximumFractionDigits:0 });` |
| `SEGMENTS` | `['Passenger Car','Light Commercial (LCV)','Heavy Goods (HGV)','Bus & Coach','2-Wheeler','Van'];` |
| `CHARGER_TYPES` | `['Level 2 (7kW)','DC Fast (50kW)','Ultra-Rapid (150kW)','HPC (350kW)'];` |
| `seg` | `SEGMENTS[Math.floor(sr(i*7)*SEGMENTS.length)];` |
| `geo` | `GEOS[Math.floor(sr(i*11)*GEOS.length)];` |
| `fleetSz` | `Math.round(50 + sr(i*13)*4950);` |
| `evPct` | `Math.round(5 + sr(i*17)*80);` |
| `iceUnits` | `Math.round(fleetSz*(1-evPct/100));` |
| `bevUnits` | `fleetSz - iceUnits;` |
| `tcoBEV` | `base.bevPrice + (base.fuelBEV*5) + (base.maintBEV*5) - (base.bevPrice*base.residBEV);` |
| `tcoICE` | `base.icePrice + (base.fuelICE*5) + (base.maintICE*5) - (base.icePrice*base.residICE);` |
| `strandedValue` | `iceUnits * base.icePrice * (1 - evPct/100) * 0.25; // £k` |
| `zevMandateGap` | `Math.max(0, 80 - evPct); // % gap to 2035 mandate` |
| `capexNeeded` | `bevUnits * (base.bevPrice - base.icePrice); // £k incremental capex` |
| `chargerInfra` | `Math.round(bevUnits / 4); // charger count (1:4 ratio)` |
| `tcoBySegment` | `useMemo(() => SEGMENTS.map(seg => {` |
| `elecAdj` | `energyPx / 0.28; // scale by electricity price vs base` |
| `fuelAdj` | `fuelPx   / 1.65;` |
| `chargerEcon` | `useMemo(() => [ { type:'Level 2 (7kW)', capex:8,    opex:0.5, sessions:5,   revPerSess:2.5,  utilPct:20 }, { type:'DC Fast (50kW)',capex:35,   opex:3.5, sessions:15,  revPerSess:8.0,  utilPct:35 }, { type:'Ultra-Rapid (150kW)',capex:80,opex:8.0,sessions:20, revPerSess:15.0, utilPct:40 }, { type:'HPC (350kW)',   capex:150,  opex:14,  sessi` |
| `annRev` | `c.sessions * 365 * c.revPerSess / 1000; // £k/yr` |
| `annOpex` | `c.opex; // £k/yr` |
| `payback` | `(c.capex / (annRev - annOpex)).toFixed(1);` |
| `gap` | `o.target2030 - o.evShare;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BATTERY_CURVE`, `CHARGER_TYPES`, `GEOS`, `OEM_DATA`, `POWERTRAIN`, `SEGMENTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global EV Sales Share 2023 | — | IEA Global EV Outlook 2024 | EVs reached 18% of new car sales globally in 2023; China 38%, Europe 25%, US 9% |
| TCO Parity Year | — | BloombergNEF EV Market Outlook 2024 | EV total cost of ownership parity with ICE equivalent — varies by segment and market |
| Charging Infrastructure Gap | — | IEA Net Zero 2023 | Current global public chargers: 2.7M — 5× scale-up required for IEA Net Zero scenario |
- **Vehicle sales data + loan origination by segment** → TCO and stranding risk calculation → **Portfolio exposure to ICE stranded assets by maturity year**
- **Charging infrastructure utilisation and tariff data** → Charging NPV modelling → **IRR and payback for public charging network investment**
- **EV adoption curve by market and policy scenario** → Fleet transition planning → **Optimal fleet electrification schedule by cost minimisation**

## 5 · Intermediate Transformation Logic
**Methodology:** EV Total Cost of Ownership
**Headline formula:** `TCO_EV = CapEx_EV + Σ[(EnergyCost_t + Maint_t + Insurance_t - ResidualValue_t)] / (1+r)^t; ICE_StrandingRisk = max(0, RemainingLoanLife - EVParityYear)`

TCO parity between EV and ICE reached in most segments by 2025–2027; stranding risk quantifies auto loans outstanding beyond EV parity year in a given market

**Standards:** ['IEA Global EV Outlook 2024', 'BloombergNEF EV Market Outlook 2024', 'IPCC AR6 WGIII Chapter 10 — Transport', 'ECB Working Paper — Auto Loan Climate Risk']
**Reference documents:** IEA Global EV Outlook 2024; BloombergNEF Electric Vehicle Market Outlook 2024; IPCC AR6 WGIII Chapter 10 — Transport; ECB Working Paper 2023 — Transition Risk in Auto Lending

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `CleanTechAdvancedAnalytics`

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial-mismatch flag.** The MODULE_GUIDES entry (EP-DF5) promises a **discounted**
> TCO `Σ[(Energy+Maint+Insurance−Residual)]/(1+r)^t` plus ICE-stranding risk
> `max(0, RemainingLoanLife − EVParityYear)`. **The code's TCO is undiscounted (fixed 5-year horizon,
> no r) and the stranding measure is a simple `iceUnits·icePrice·(1−evPct/100)·0.25` fleet write-down,
> not a loan-life-vs-parity calculation.** The `TCO_BASE` cost table is realistic; fleet instances are
> seeded. Documented below.

### 7.1 What the module computes

**(a) Segment TCO** (undiscounted, 5-year, per `TCO_BASE[seg]`):
```js
tcoBEV = base.bevPrice + (base.fuelBEV·5) + (base.maintBEV·5) − (base.bevPrice·base.residBEV)
tcoICE = base.icePrice + (base.fuelICE·5) + (base.maintICE·5) − (base.icePrice·base.residICE)
```
i.e. capex + 5×annual energy + 5×annual maintenance − residual (as a fraction of capex). Energy
sensitivities: `elecAdj = energyPx/0.28`, `fuelAdj = fuelPx/1.65` scale the fuel terms live.

**(b) Fleet stranding & capex**:
```js
iceUnits     = round(fleetSz·(1 − evPct/100))
strandedValue = iceUnits·base.icePrice·(1 − evPct/100)·0.25    // 25% write-down of residual ICE fleet
zevMandateGap = max(0, 80 − evPct)                             // % gap to a 2035 80% mandate
capexNeeded  = bevUnits·(base.bevPrice − base.icePrice)        // incremental fleet electrification cost
chargerInfra = round(bevUnits/4)                               // 1 charger per 4 BEVs
```

**(c) Charger economics** (hand-set table, not seeded):
```js
annRev  = c.sessions·365·c.revPerSess/1000       // £k/yr
payback = (c.capex / (annRev − c.opex)).toFixed(1)
```

### 7.2 Parameterisation & provenance

| Element | Value | Provenance |
|---|---|---|
| `TCO_BASE` (6 segments) | e.g. Passenger Car: ICE £28k / BEV £38k, fuelICE 9.5 / fuelBEV 3.0, maintICE 5.0 / maintBEV 3.0, resid 0.45 / 0.38; HGV £120k/£200k; Bus £250k/£380k | **Realistic hand-set £k costs** — BEV capex premium, lower BEV energy/maint, lower BEV residual (all directionally correct per ICCT/BNEF) |
| Residual fractions | 0.28–0.50 | Editorial but plausible |
| Stranding write-down | 0.25 | Hard-coded haircut assumption |
| ZEV mandate target | 80% by 2035 | **Real** — UK ZEV Mandate trajectory reaches 80% cars by 2030 / 100% by 2035; EU 100% 2035 |
| `elecAdj` base 0.28 £/kWh, `fuelAdj` base 1.65 £/L | UK-representative energy prices |
| `charger table` (L2 £8k … HPC £150k, util 20–45%) | Hand-set realistic infrastructure economics |
| `BATTERY_CURVE` (12), `OEM_DATA` (11) | Battery cost decline + OEM EV-share/target data — illustrative |
| Fleet instances (`fleetSz`, `evPct`, `geo`) | seeded `sr()` |

### 7.3 Calculation walkthrough

1. Fleet generated with seeded size, EV%, geography.
2. `iceUnits`/`bevUnits` split by `evPct`; `capexNeeded` = incremental BEV cost × BEV units.
3. `strandedValue` = 25% write-down on the remaining ICE fleet's book value.
4. `zevMandateGap` = distance to the 80% mandate.
5. Segment TCO from `TCO_BASE` with live energy-price scaling; charger payback from the static table.

### 7.4 Worked example (Passenger Car, base energy prices)

| Step | Computation | Result (£k) |
|---|---|---|
| tcoBEV | 38 + 3.0·5 + 3.0·5 − 38·0.38 | 38 + 15 + 15 − 14.44 = **53.56** |
| tcoICE | 28 + 9.5·5 + 5.0·5 − 28·0.45 | 28 + 47.5 + 25 − 12.6 = **87.90** |
| TCO gap | tcoICE − tcoBEV | **£34.34k in favour of BEV** over 5 years |

Fleet of 1,000 at evPct = 30 (bevUnits = 300):
`capexNeeded = 300·(38−28) = £3,000k`; `strandedValue = 700·28·0.70·0.25 = £3,430k`;
`zevMandateGap = 80 − 30 = 50%`. The BEV TCO advantage (£34k/vehicle) is real arithmetic; the fleet
counts are seeded.

### 7.5 Data provenance & limitations

- **`TCO_BASE` is realistic and hand-set**; the 5-year TCO is genuine arithmetic (but **undiscounted**).
- **Fleet instances are synthetic** (`sr()`) — size, EV%, geography.
- **Stranding is a flat 25% haircut**, not the guide's `RemainingLoanLife − EVParityYear` loan-life
  measure; there is no auto-loan amortisation schedule.
- **No discounting / NPV** despite the guide's discounted formula; no explicit EV-parity-year solve.
- Insurance term in the guide formula is omitted from `TCO_BASE`.

**Framework alignment:** Cost structure aligns with **ICCT** and **BloombergNEF EV Outlook** TCO
methodology (BEV capex premium offset by lower energy/maintenance) and the **UK ZEV Mandate / EU 2035**
phase-out for the mandate gap. Auto-lender stranded-asset framing echoes **ECB** transition-risk-in-auto-
lending guidance, but the loan-book mechanics are simplified to a portfolio write-down.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Add discounting, an EV-parity-year solve, and a
loan-amortisation-based stranding measure.

**8.1 Purpose & scope.** Deliver a discounted EV-vs-ICE TCO, an EV-parity year per segment/market, and an
auto-loan-book ICE stranded-asset exposure by maturity — for OEM investors, fleet advisory, and auto
lenders.

**8.2 Conceptual approach.** Discounted lifecycle TCO (ICCT/BNEF) plus a structural stranding model:
loans whose remaining life extends beyond the market's EV-parity year face residual-value impairment, per
**ECB** auto-lending climate-risk work and **IPCC AR6 WGIII** transport transition pathways.

**8.3 Mathematical specification.**

```
TCO_v = Capex_v + Σ_t (Energy_{v,t}+Maint_{v,t}+Insurance_{v,t})/(1+r)^t − RV_v/(1+r)^T
EVParityYear_{seg,mkt} = min t : TCO_BEV(t) ≤ TCO_ICE(t)
ICE stranding (loan ℓ): impair_ℓ = Balance_ℓ · LGD · 1[RemainingLife_ℓ > EVParityYear]
Portfolio stranded = Σ_ℓ impair_ℓ   (bucketed by maturity year)
Charger IRR: solve Σ_t (Rev_t − Opex_t)/(1+IRR)^t = Capex_0
```

| Parameter | Source |
|---|---|
| Discount rate r | Lender WACC |
| Segment costs | ICCT / BNEF (extends `TCO_BASE`) |
| EV adoption / parity paths | IEA Global EV Outlook, BNEF |
| Residual-value decline for ICE | BNEF residual curves under transition |
| LGD | Auto-loan LGD (secured, ~30–45%) |

**8.4 Data requirements.** Auto-loan tape (balance, remaining life, collateral segment); segment TCO
inputs; EV-adoption curves by market; residual-value projections. Platform holds NGFS scenarios and
`GLOBAL_COMPANY_MASTER`; needs a loan tape for the stranding block.

**8.5 Validation & benchmarking plan.** Reconcile EV-parity years against BNEF/ICCT published parity;
backtest residual impairment against observed ICE resale declines; sensitivity of stranded exposure to
parity-year and LGD.

**8.6 Limitations & model risk.** EV-parity year is scenario-dependent — report a range. Residual-value
projections for both ICE and BEV are the dominant uncertainty. Conservative fallback: if parity year is
uncertain, use the earliest credible year (more conservative stranding).

## 9 · Future Evolution

### 9.1 Evolution A — Discounted TCO and a real auto-loan stranding model (analytics ladder: rung 2 → 3)

**What.** The page carries genuinely useful anchors — a 12-point battery cost curve, real OEM EV-share/target rows (11 OEMs), plausible per-segment TCO base tables with price-adjustable energy/fuel scaling, and charger economics with computed paybacks. The soft spots: the TCO is undiscounted (`base.bevPrice + fuelBEV·5 + maintBEV·5 − resid`, vs the guide's `Σ(…)/(1+r)^t`), the fleet rows are seeded, and the headline lender metric — ICE stranded value — is a bare heuristic (`iceUnits × icePrice × (1−evPct/100) × 0.25`) rather than the guide's `StrandingRisk = max(0, RemainingLoanLife − EVParityYear)` model. Evolution A hardens both.

**How.** (1) Shared TCO engine with `ev-fleet-finance`'s Evolution A (discounted, residual-value curves) — this module consumes it for the segment-comparison and parity-year views; parity year becomes a *computed* crossing point per segment/market rather than a cited range. (2) The stranding model per the guide: auto-loan cohorts (origination year, term, segment, market) intersected with computed parity years → exposure outstanding beyond parity, by maturity bucket — the ECB-guidance metric the overview names; loan cohorts from `portfolios_pg` or uploaded book data. (3) OEM table gains `as_of` and sources (the data is real but undated); battery curve refreshes from BNEF-published annual points. (4) Rung 3: bench-pin the TCO discounting and the parity-crossing solver; validate one segment's parity year against the BNEF/ICCT published estimate it cites.

**Prerequisites.** Loan-book input schema; the ×0.25 heuristic retired when the cohort model lands (not kept as a fallback). **Acceptance:** parity year for a fixture segment reproduces from the TCO curves' crossing; stranding exposure changes correctly when loan terms shorten; every OEM row carries source and date.

### 9.2 Evolution B — Auto-lender transition-risk analyst (LLM tier 2)

**What.** A tool-calling analyst for the module's most differentiated audience — auto lenders under ECB climate-risk expectations: "how much of our 2024-vintage HGV book is outstanding beyond EV parity, and what does a two-year-earlier parity shift do to it?" It runs Evolution A's stranding model per cohort, stress-shifts parity years via the TCO engine's scenario inputs (fuel/electricity prices, battery-cost trajectory), and drafts the supervisory-facing exposure note with the transmission logic explicit (parity year → residual-value pressure → LGD implication), each figure from tool output.

**How.** Tools: `compute_parity_year(segment, market, scenario)`, `run_stranding_analysis(book, scenario)`, `get_oem_alignment(oem)`, `get_battery_curve()`. Grounding corpus = this Atlas record's §5 (both formulas) and the ECB working-paper reference. The LGD implication is framed carefully: the module computes exposure-beyond-parity; translating that into LGD uplift requires the credit models in `dme-pd-engine`/`energy-transition-credit-portal` — the analyst hands off rather than improvising a loss number, the tier-2 boundary discipline.

**Prerequisites (hard).** Evolution A — a supervisory note built on the ×0.25 heuristic and seeded fleets would misstate transition risk to exactly the audience (ECB-supervised lenders) that checks. **Acceptance:** a golden book's stranding table matches scripted model runs; parity-shift stress results reproduce; LGD questions route to the credit modules by name rather than being answered here.