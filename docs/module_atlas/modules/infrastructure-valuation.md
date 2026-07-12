# Infrastructure Valuation
**Module ID:** `infrastructure-valuation` · **Route:** `/infrastructure-valuation` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides climate-risk adjusted infrastructure asset valuation integrating physical and transition risk factors into discounted cash flow (DCF) models, net asset value (NAV) computation, and internal rate of return (IRR) stress testing. Covers stranded asset probability weighting and insurance cost escalation under climate scenarios.

> **Business value:** Enables infrastructure investors and lenders to quantify climate risk in asset valuations, compare climate-adjusted IRRs across asset classes, assess stranded asset probability under 1.5°C scenarios, and disclose climate VaR in accordance with TCFD recommendations for asset owners.

**How an analyst works this module:**
- Input the asset cash flow model and select the applicable climate scenario (NGFS Orderly, Disorderly, or Hot House World).
- Configure the stranded asset probability curve for the asset type and geography under the selected scenario.
- Run the climate-adjusted NAV and compare against the base case to compute the climate value at risk.
- Stress-test the IRR against carbon price pathways and insurance cost escalation assumptions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CP_SCENARIOS`, `ENERGY_ASSETS`, `GREENIUM_DATA`, `INFRA_PROJECTS`, `REG_PERIODS`, `UK_UTILITIES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `UK_UTILITIES` | 16 | `name`, `sector`, `rab`, `wacc`, `allowedReturn`, `actualROCE`, `regPeriod` |
| `INFRA_PROJECTS` | 21 | `name`, `type`, `capex`, `revModel`, `equityPct`, `targetIRR` |
| `GREENIUM_DATA` | 14 | `greenium`, `esgScore`, `ghgIntensity`, `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `carbonCostRatio` | `(carbonIntensity * carbonPrice2030) / 1000;` |
| `timeDiscountFactor` | `Math.max(0, 1 - (remainingLife / 30));` |
| `demandSubstitution` | `Math.min(0.12, carbonIntensity * 0.08);` |
| `base` | `carbonCostRatio * 0.8 + timeDiscountFactor * 0.15 + demandSubstitution;` |
| `REG_PERIODS` | `['Ofgem RIIO-ED2 (2023-2028)', 'Ofwat PR24 (2025-2030)', 'CAA Q6 (2022-2027)'];` |
| `names` | `['Drax Coal Units 1-3', 'Fiddlers Ferry Gas CCGT', 'West Burton A Coal', 'Saltend Chemicals Gas', 'Kilroot Coal Plant', 'Ferrybridge D Gas', 'Cottam Gas CCGT', 'Ince Marshes Gas', 'Barry Gas CCGT', 'Connahs Quay Gas', 'G` |
| `allowedRev` | `editRab * (selectedUtility.allowedReturn / 100);` |
| `regGap` | `(selectedUtility.actualROCE / 100 - selectedUtility.allowedReturn / 100) * editRab;` |
| `debt` | `gfCapex * (1 - gfEquity / 100);` |
| `equity` | `gfCapex * (gfEquity / 100);` |
| `annualRev` | `gfCapex * (0.18 + sr(selectedProject * 3 + 1) * 0.12);` |
| `annualOpex` | `annualRev * 0.35;` |
| `annualDsvc` | `debt * 0.07;` |
| `fcf` | `annualRev - annualOpex - annualDsvc;` |
| `irr` | `gfTargetIRR / 100 * (1 - gfConstRisk * 0.008);` |
| `equityIRR` | `irr + 0.025 + (1 - gfEquity / 100) * 0.015;` |
| `dscr` | `(annualRev - annualOpex) / Math.max(annualDsvc, 0.001); // guard: equity=100% → debt=0 → annualDsvc=0` |
| `dscrMin` | `dscr * (0.85 + sr(selectedProject * 5 + 2) * 0.1);` |
| `payback` | `equity / Math.max(0.01, fcf);` |
| `npvHaircut` | `prob * 0.85;` |
| `climateValue` | `a.bookValue * (1 - npvHaircut);` |
| `strandYear` | `prob > 0.7 ? 2030 + Math.floor((1 - prob) * 20) : prob > 0.4 ? 2035 + Math.floor((1 - prob) * 15) : 2045 + Math.floor((1 - prob) * 10);` |
| `strandedPortfolio` | `useMemo(() => { const totalBook = strandedAssets.reduce((s, a) => s + a.bookValue, 0);` |
| `totalStranded` | `strandedAssets.reduce((s, a) => s + (a.bookValue - a.climateValue), 0);` |
| `weightedProb` | `strandedAssets.reduce((s, a) => s + a.prob * a.bookValue, 0) / totalBook;` |
| `year` | `2025 + i;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GREENIUM_DATA`, `INFRA_PROJECTS`, `REG_PERIODS`, `UK_UTILITIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate VaR (% NAV) | — | NGFS / EDHECinfra | Maximum NAV loss at 95% confidence under the NGFS Disorderly transition scenario; coastal and fossil fuel infrastructure bear the highest climate VaR. |
| Stranded Asset Probability (%) | — | IEA NZE stranded asset analysis | Probability that the asset becomes economically unviable before end of technical life under a 1.5°C scenario; coal plants average 60â€“80%; wind farms <1%. |
| Insurance Cost Escalation (% pa) | — | Swiss Re sigma / Lloyd's market data | Annual rate of physical risk insurance premium escalation for high-risk infrastructure assets; compound effect on 30-year cash flows is material. |
| IRR Sensitivity to Carbon Price (ΔIRR/€10 tCO2) | — | Scenario stress test | IRR reduction per €10/tCO2 carbon price increase; gas power plants typically show -0.8 to -1.2% IRR sensitivity. |
- **Infrastructure asset cash flow model** → Apply stranded asset probability and climate cost overlays → **Climate-adjusted cash flows by year and scenario**
- **NGFS economic impact data by scenario** → Map GDP and sector impact to infrastructure revenue assumptions → **Revenue stress factors by scenario**
- **Insurance market data (Swiss Re sigma)** → Model insurance premium escalation curves for asset type and geography → **Climate insurance cost escalation by asset**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted NAV
**Headline formula:** `NAV_climate = Σ_t (CF_t × (1 - Stranded_prob_t) - ClimateCost_t) / (1 + r_t)^t`

Adjusts the traditional DCF by discounting each year's cash flows by the cumulative stranded asset probability under the climate scenario, and deducting projected climate-related costs including insurance premium escalation, flood defence capex, and carbon pricing impacts. The risk-free rate r_t is further adjusted for physical risk premium in high-vulnerability geographies.

**Standards:** ['EDHECinfra Infrastructure Valuation', 'IPCC AR6 Physical Risk Cost Estimates', 'NGFS Climate Scenario Economic Impacts']
**Reference documents:** EDHECinfra â€” Climate Risk in Infrastructure Investment (2022); NGFS â€” Case Studies of Climate-Related Physical Risks and Impacts (2020); IEA â€” World Energy Outlook Stranded Asset Analysis (2023); Swiss Re Institute â€” Economics of Climate Change (2021)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module is more genuinely computational than most of its infrastructure siblings: it implements a
real (if simplified) stranding-probability function, a UK RAB regulatory model, a greenfield DCF, and
an ESG-greenium view. The guide's `NAV_climate` formula is only loosely reflected — the code applies
a **stranding-probability haircut to book value**, not a year-by-year discounted climate-adjusted cash
flow. Utility and project data are curated constants; energy-asset book values and several DCF inputs
are `sr()`-seeded.

### 7.1 What the module computes

**Stranding probability** (the analytic core, with source-cited inline comments):

```js
strandingProb(carbonIntensity, cp2030, remainingLife, policyShock=1.0):
  carbonCostRatio   = (carbonIntensity × cp2030) / 1000
  timeDiscountFactor= max(0, 1 − remainingLife/30)          // shorter life ⇒ nearer stranding
  demandSubstitution= min(0.12, carbonIntensity × 0.08)
  base              = carbonCostRatio×0.8 + timeDiscountFactor×0.15 + demandSubstitution
  return min(0.95, base × policyShock)
```

**Stranded value** and portfolio roll-up:

```js
npvHaircut  = prob × 0.85                     // 85% of value at risk if fully stranded
climateValue= bookValue × (1 − npvHaircut)
totalStranded = Σ (bookValue − climateValue)
weightedProb  = Σ prob×bookValue / Σ bookValue
```

**RAB model** (regulated utilities):

```js
allowedRev = editRab × allowedReturn%
regGap     = (actualROCE% − allowedReturn%) × editRab      // over/under-earning vs regulator
rabGrowth  = editRab × (1 + 0.03 + sr(...)×0.04)^i          // 5-period RAB accretion
```

**Greenfield DCF** (project finance):

```js
debt=capex×(1−equity%); annualRev=capex×(0.18+sr×0.12); annualOpex=0.35×annualRev
annualDsvc=debt×0.07;    fcf=annualRev−annualOpex−annualDsvc
irr = targetIRR × (1 − constRisk×0.008)                     // heuristic, NOT a solved IRR
dscr= (annualRev−annualOpex)/max(annualDsvc, 0.001)
npv = Σ_{y=1..25} fcf/1.08^y − equity
```

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| Stranding weights | carbonCost 0.8 / time 0.15 / demand 0.12 cap | Author heuristic; inline-cited to NGFS Phase 4 taxonomy |
| Carbon-cost normaliser | ÷1000 | Scales tCO₂ intensity × $/t to a 0–1 ratio |
| Life horizon | 30 yr | `timeDiscountFactor` denominator |
| Prob cap | 0.95 | Keeps a valid probability |
| NPV haircut fraction | 0.85 | Share of book value lost if stranded |
| `CP_SCENARIOS` carbon prices | NZ2050 250/600/1200; Below2C 150/350/800; …; CurrentPolicy 25/60/120 ($/t 2030/40/50) | NGFS-style scenario ladder; `policyShock` 1.35→0.80 |
| `ENERGY_ASSETS.carbonIntensity` | 0.05–0.88 tCO₂/unit | Curated per asset (coal ~0.85, gas ~0.40, transmission ~0.08) |
| Book values, remaining life | `sr()`-seeded (200–2000 £M; 5–40 yr) | Synthetic |
| DCF revenue yield | `0.18 + sr×0.12` of capex | `sr()`-seeded |
| Debt service rate | 7% of debt | Hard-coded |
| Discount rate | 8% (`1.08^y`) | Hard-coded project WACC |
| RAB values (rab/wacc/allowedReturn/actualROCE) | curated | Real UK utilities (National Grid, Thames Water, Heathrow…) |
| `GREENIUM_DATA` | −45 to +25 bps | Curated by asset type (green assets negative spread, fossil positive) |

### 7.3 Calculation walkthrough

1. **Stranded tab:** pick a scenario → `strandingProb` per energy asset using its carbon intensity,
   the scenario's 2030 carbon price, remaining life, and policy-shock multiplier → haircut → climate
   value → sort by probability; portfolio sums stranded value and builds a 2025–2050 cumulative
   timeline keyed on each asset's `strandYear`.
2. **RAB tab:** select a utility → allowed revenue, regulatory gap (ROCE vs allowed), 5-period RAB
   growth path.
3. **Greenfield tab:** set capex/equity/target IRR/construction risk → DCF returns IRR (heuristic),
   equity IRR, DSCR, payback, 25-year NPV @8%, and a 6-factor tornado.
4. **Greenium tab:** plots curated greenium vs ESG score and GHG intensity.

### 7.4 Worked example (Drax Coal Units, NZ2050)

`carbonIntensity = 0.85`, `cp2030 = 250`, `remainingLife = 12`, `policyShock = 1.35`, `bookValue ≈ £1,600M`:

| Step | Computation | Result |
|---|---|---|
| carbonCostRatio | 0.85 × 250 / 1000 | 0.2125 |
| timeDiscountFactor | max(0, 1 − 12/30) | 0.60 |
| demandSubstitution | min(0.12, 0.85×0.08 = 0.068) | 0.068 |
| base | 0.2125×0.8 + 0.60×0.15 + 0.068 | 0.328 |
| prob (× policyShock, cap 0.95) | 0.328 × 1.35 | **0.443 → 44.3%** |
| npvHaircut | 0.443 × 0.85 | **37.7%** |
| climateValue | 1600 × (1 − 0.377) | **£997M** |
| stranded value | 1600 − 997 | **£603M** |
| strandYear (0.4<prob≤0.7) | 2035 + floor((1−0.443)×15) | **2043** |

### 7.5 Companion analytics on the page

- **Stranded portfolio** timeline (cumulative stranded value 2025–2050) and weighted stranding prob.
- **DCF tornado** — capex/revenue/WACC sensitivity ranked by |impact|.
- **ESG greenium** — spread vs ESG-score / GHG-intensity scatter illustrating the pricing wedge.

### 7.6 Data provenance & limitations

- RAB utility parameters and project pipeline are **curated realistic constants**; energy-asset book
  values, DCF revenue yield, and RAB growth noise are **`sr()`-seeded** (`sr(s)=frac(sin(s+1)×10⁴)`).
- Stranding probability is a transparent heuristic weighting, **not** a structural/reduced-form default
  model; the 85% haircut is a fixed loss-given-stranding, not asset-specific.
- Greenfield `irr = targetIRR × (1 − constRisk×0.008)` is a scaling of the *target*, not a solved
  internal rate of return; only the NPV loop is a genuine discounting.
- Stranding "NAV haircut" is applied to book value in one step, unlike the guide's year-by-year
  `NAV_climate = Σ CF_t(1−strandedProb_t)/(1+r)^t`.

**Framework alignment:** *NGFS Phase IV scenarios* — the carbon-price ladder and policy-shock
multipliers mirror NGFS orderly/disorderly/hot-house logic (aggressive NZ2050 shock 1.35 vs benign
Current Policy 0.80). *IEA NZE stranded-asset analysis* — the carbon-intensity → stranding mapping
approximates IEA's fossil-asset viability screening. *EDHECinfra* — cited for infra valuation but the
code uses simple DCF, not EDHECinfra's calibrated risk-factor NAV. *TCFD physical/transition* — the
stranded-value disclosure shape aligns with TCFD transition-risk reporting.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce a defensible **climate-adjusted NAV and stranding-loss distribution** for regulated and
merchant infrastructure assets, replacing the single-step book-value haircut with a scenario-conditioned
discounted cash-flow model and a probabilistic stranding curve.

### 8.2 Conceptual approach
Combine (a) a **structural stranding model** — asset becomes uneconomic when climate-adjusted marginal
cost exceeds market clearing price, per IEA NZE viability analysis and Moody's/Carbon-Tracker stranded-
asset work — with (b) a **year-by-year NGFS-conditioned DCF**, mirroring EDHECinfra's calibrated
infrastructure NAV and MSCI Climate VaR repricing.

### 8.3 Mathematical specification
For asset *a*, year *t*, scenario *s*:

```
MC_a(t,s)   = OpMC_a + CarbonIntensity_a · CarbonPrice_s(t)            // climate-adjusted marginal cost
StrandProb_a(t,s) = Φ( (MC_a(t,s) − Price_s(t)) / σ_price )            // structural, Φ = normal CDF
CF_a(t,s)   = Rev_a(t,s)·(1 − StrandProb_a(t,s)) − Opex_a(t) − Carbon_a(t,s) − Capex_a(t)
NAV_a(s)    = Σ_{t=1}^H CF_a(t,s) / (1 + r_a + φ_phys,a)^t             // physical-risk premium φ
ClimateVaR_a= NAV_a(base) − Percentile_5( {NAV_a(s)} over scenario draws )
DSCR_a(t)   = (Rev_a(t)−Opex_a(t)) / DebtService_a(t)   ;  IRR: solve Σ CF/(1+irr)^t = 0 (Newton)
```

| Parameter | Source |
|---|---|
| Carbon price paths `CarbonPrice_s(t)` | NGFS Phase IV; IEA WEO/NZE |
| Power/commodity price `Price_s(t)` | IEA WEO; national market curves |
| Price volatility `σ_price` | Historical wholesale price vol |
| Asset carbon intensity | Trucost / plant-level data |
| Physical premium `φ_phys` | Swiss Re sigma; hazard exposure by geography |
| Discount rate `r_a` | RAB WACC (regulated) or project WACC |

### 8.4 Data requirements
Asset economics (opex, capex schedule, output, carbon intensity, debt terms), scenario price/carbon
paths, geography for physical premium. Platform has: NGFS-style scenario ladder, curated RAB/WACC,
carbon intensities. Needs: market price curves and IRR solver (currently heuristic).

### 8.5 Validation & benchmarking plan
Reconcile NAV and Climate VaR against EDHECinfra / MSCI Climate VaR for overlapping assets; backtest
stranding calls against historical UK coal/gas retirements (Drax, Fiddlers Ferry); sensitivity of NAV
to carbon path and `σ_price`; verify IRR solver against a spreadsheet DCF.

### 8.6 Limitations & model risk
Structural stranding is sensitive to the price-volatility assumption; single-factor carbon price
ignores basis and regional ETS differences; the 85% loss-given-stranding should be asset-specific
(salvage/repurposing value). Fallback: report NAV as a scenario range and stranding as a probability
band with explicit horizon.

## 9 · Future Evolution

### 9.1 Evolution A — Structural stranding and a year-by-year climate DCF (analytics ladder: rung 2 → 3)

**What.** More genuinely computational than its siblings — a transparent stranding heuristic (`carbonCostRatio·0.8 + timeDiscount·0.15 + demandSubstitution`, hand-traced for Drax at 44.3%), a real UK RAB regulatory model on curated utility data, and a genuine 25-year NPV loop — but §7.6 lists what remains heuristic: the stranding "NAV haircut" hits book value in one step (`prob × 0.85`) instead of the guide's year-by-year `NAV = Σ CF_t(1−StrandProb_t)/(1+r)^t`; the greenfield `irr = targetIRR × (1 − constRisk×0.008)` is a scaling of the target, not a solved rate; loss-given-stranding is a fixed 85%; and energy-asset book values plus DCF revenue yields are `sr()`-seeded. Evolution A implements the §8 structural model: `StrandProb(t,s) = Φ((MC(t,s) − Price(t,s))/σ_price)` with NGFS carbon paths, cash flows attenuated year-by-year, a Newton-Raphson IRR solver, and asset-specific salvage values replacing the flat 85%.

**How.** (1) A backend route (`POST /infra-valuation/climate-nav`) so the DCF is server-side and shareable; the platform already has Newton IRR implementations (hydrogen-project-finance) to reuse as the pattern. (2) NGFS carbon paths from the platform's seeded Phase 5 extract (used by infra-debt-portfolio-manager) instead of the hard-coded `CP_SCENARIOS` ladder. (3) The §8.5 backtest: stranding calls validated against realised UK coal/gas retirements — Drax and Fiddlers Ferry are in the module's own asset names, so the test data is already on the page. (4) `sr()` book values replaced by entered or curated asset economics.

**Prerequisites.** Market price curves (or a documented proxy) for the `Price(t,s)` term; the heuristic retained as a labeled screening fallback. **Acceptance:** stranding probability varies over time within one scenario; IRR solves to NPV=0 within tolerance; the Drax worked example re-derives with the structural model and the difference vs the heuristic is documented.

### 9.2 Evolution B — Stranded-asset and RAB analyst for infra investors (LLM tier 2)

**What.** A tool-calling analyst spanning the module's four distinct views: "walk me through why Drax strands at 44% under NZ2050" (the §7.4 decomposition is the template), "which utilities over-earn vs their allowed return?" (the RAB `regGap` view on real Ofgem/Ofwat-regulated names), "what does the greenium scatter imply for financing a gas asset?", "stress this project's DSCR at 60% gearing." Each answer executes against the Evolution A route or reads the curated RAB/greenium tables.

**How.** Tier 2: tool schemas over `/climate-nav` and a RAB-calculation route; scenario comparisons run the same asset across the NGFS ladder in parallel tool calls with the ladder cited. Discipline rules from §7.6: pre-Evolution-A the copilot must label the stranding number a "transparent heuristic weighting, not a structural default model" and the greenfield IRR a target-scaling; the 85% loss-given-stranding assumption is disclosed whenever stranded value is quoted; RAB answers cite the regulatory period (RIIO-ED2, PR24) from `REG_PERIODS` since allowed returns are period-specific. Regulated vs merchant asset questions route to the correct sub-model explicitly.

**Prerequisites.** Evolution A's routes (currently all frontend math); Phase 2 tooling. **Acceptance:** every £M/% figure traces to a tool call or named table row; scenario answers show all ladder points run; heuristic-vs-structural provenance always stated.