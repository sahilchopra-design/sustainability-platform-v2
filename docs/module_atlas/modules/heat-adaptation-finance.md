# Heat Adaptation Finance
**Module ID:** `heat-adaptation-finance` · **Route:** `/heat-adaptation-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EK2 · **Sprint:** EK

## 1 · Overview
8-city urban heat analytics (Phoenix/Delhi/Dubai/Karachi/Miami), 7 urban cooling solutions with temperature reduction and BCR, labour productivity loss by warming scenario (ILO), health cost trend, 6-segment investment map, and green bond / SLB finance structures.

> **Business value:** Used by city bond issuers financing urban cooling infrastructure, infrastructure investors screening heat adaptation markets, and corporate HR teams quantifying labour productivity loss under climate scenarios.

**How an analyst works this module:**
- Review 8 cities by heat days 2024/2050, urban heat island intensity, GDP at risk, and labour loss
- Compare 7 urban cooling solutions with cost per hectare, temperature reduction, co-benefits, and finance eligibility
- Analyse labour productivity loss curve across 9 warming scenarios (1.5°C–5.5°C) for global and tropical regions
- Explore 6 investment segments with market size ($Bn) and CAGR growth projections

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CITIES`, `HEAT_HEALTH_COST`, `INVESTMENT_SEGMENTS`, `KpiCard`, `PRODUCTIVITY_IMPACT`, `Pill`, `SOLUTIONS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CITIES` | 9 | `country`, `heatDays2024`, `heatDays2050`, `urbHeatIsland`, `gdpAtRisk`, `laborProdLoss`, `hospitalAdmit`, `coolCostM`, `greenCoverage` |
| `SOLUTIONS` | 8 | `costPerHa`, `tempReduction`, `lifetime`, `cobenefits`, `eligibility` |
| `INVESTMENT_SEGMENTS` | 7 | `size`, `cagr`, `opportunity` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sortedCities` | `useMemo(() => [...CITIES].sort((a, b) => b[sortCity] - a[sortCity]), [sortCity]);` |
| `totalGdpRisk` | `CITIES.reduce((a, b) => a + b.gdpAtRisk, 0);` |
| `avgHeatDays2050` | `CITIES.reduce((a, b) => a + b.heatDays2050, 0) / CITIES.length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITIES`, `INVESTMENT_SEGMENTS`, `SOLUTIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global heat mortality (2024) | `Deaths attributable to heat (Lancet 2023)` | Lancet Countdown Indicator 1.1 2023 | Heat mortality up 68% since 1990–2000 baseline; elderly (>65) account for 72% of deaths; coastal and tropical cities highest risk. |
| Labour productivity loss (2°C) | `Global annual economic loss (ILO)` | ILO Heat and Human Performance Report 2019 | Agriculture (68% outdoor) and construction (60% outdoor) most exposed; tropical LMICs bear disproportionate burden. |
| District cooling CAGR | `Market growth 2024–2030` | IEA District Cooling Market Report 2023 | District cooling more energy-efficient than distributed AC; Dubai covers 90% of commercial space; Abu Dhabi, Singapore expanding rapidly. |
- **ILO 2019 + Lancet 2023 + IEA District Cooling + EU Taxonomy Art 7.4 + CBI ARC + GCF Adaptation + AIIB UCCRTF** → City analytics + solution comparison + productivity loss chart + investment map + finance structures → **Urban planners, city bond issuers, infrastructure investors, and corporate heat risk analysts**

## 5 · Intermediate Transformation Logic
**Methodology:** Urban Heat Economic Loss
**Headline formula:** `Labour_Loss = WorkHours_lost × AvgWage × WorkforceSize; GDP_Impact = Labour_Loss + Healthcare_Cost + CapitalImpairment; BCR_Cooling = (Labour_Gain + Health_Saving + Energy_Saving) / (CapEx + PV_OpEx); CAGR_opportunity = ((Market_2030 / Market_2024)^(1/6) − 1)`

ILO estimates 2.2% loss of total working hours at 1.5°C, rising to 4.5% at 3°C; tropical regions face 15–28% outdoor labour productivity loss; adaptation market growing 8–15% CAGR.

**Standards:** ['ILO Heat Stress and Productivity 2019', 'Lancet Countdown on Health 2023', 'EU Taxonomy Art. 7.4 Urban Heat']
**Reference documents:** ILO (2019) – Working on a Warmer Planet: Heat Stress and Labour Productivity; Lancet Countdown (2023) – Tracking Progress on Health and Climate Change; IEA (2023) – District Cooling Market Outlook

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ℹ️ **Guide↔code note.** The guide (EP-EK2) lists labour-loss, GDP-impact, cooling BCR and
> CAGR-opportunity formulas. The page mostly **displays** these as pre-set city/solution constants
> rather than computing them live: `laborProdLoss`, `gdpAtRisk`, `coolCostM` are fixed per city; solution
> `tempReduction`/`costPerHa`/`lifetime` are fixed per solution. The interactive element is a budget
> slider and city sorting. So the module is a well-anchored **reference + benchmarking** tool, not a
> live BCR calculator.

### 7.1 What the module computes

Live computations are aggregates and sorts over fixed data:

```js
sortedCities   = [...CITIES].sort((a,b) => b[sortCity] − a[sortCity])
totalGdpRisk   = Σ CITIES[i].gdpAtRisk          // % GDP at risk summed
avgHeatDays2050= mean(CITIES[i].heatDays2050)
```

The productivity-impact and health-cost series carry a small `sr()` seeded noise term on top of a fixed
trend (see §7.2). Solution comparison (cost/ha, °C reduction, lifetime, finance eligibility) is a
static ranking.

### 7.2 Parameterisation

**`CITIES`** (8 rows, hard-coded, realistic) — Phoenix, Delhi, Dubai, Bangkok, Karachi, Madrid,
Melbourne, São Paulo:

| City | Heat days 2024→2050 | UHI °C | GDP at risk % | Labour loss % | Green cover % |
|---|---|---|---|---|---|
| Phoenix | 110→165 | 4.2 | 3.8 | 12 | 12 |
| Delhi | 98→148 | 3.8 | 6.2 | 22 | 8 |
| Dubai | 145→178 | 5.1 | 8.4 | 28 | 6 |
| Karachi | 102→155 | 4.6 | 5.8 | 24 | 4 |
| Madrid | 72→118 | 3.1 | 2.4 | 8 | 22 |

Tropical cities (Dubai, Karachi, Delhi) carry the highest labour loss and lowest green cover — matching
ILO's finding of 15–28% tropical outdoor productivity loss.

**`SOLUTIONS`** (7) — real NbS/cooling interventions with cost/ha and °C reduction: Urban Tree Canopy
$42k/ha / −2.4 °C / 50 yr lifetime (best cost-effectiveness); District Cooling $340k/ha / −3.2 °C
(highest cooling, highest cost). **`PRODUCTIVITY_IMPACT`** — 9 warming scenarios (1.5–5.5 °C): global
loss `1.2 + i×0.8 + noise`, tropics `2.4 + i×1.6 + noise` (ILO-shaped). **`HEAT_HEALTH_COST`** — 2025–
2050, medical/productivity/mortality cost trends with seeded noise. **`INVESTMENT_SEGMENTS`** — 6 market
segments with size ($bn) and CAGR (Early Warning Tech fastest at 15.4%).

### 7.3 Calculation walkthrough

Cities are sortable by any metric; the budget slider (`budgetM`) sizes solution deployment. KPIs sum/
average the fixed city fields. The productivity and health-cost charts use the seeded-trend series. The
solution and investment tabs are static reference rankings with finance-eligibility tags.

### 7.4 Worked example (cost-effectiveness ranking)

Comparing cooling per dollar for two solutions (implicit from the fixed data):

```
Urban Tree Canopy: −2.4 °C at $42k/ha over 50 yr → 0.0571 °C per $1k, ~0.00114 °C/$1k-yr
District Cooling:  −3.2 °C at $340k/ha over 40 yr → 0.0094 °C per $1k
```

Tree canopy delivers ~6× more cooling per dollar and 50-year life — but District Cooling delivers more
absolute °C reduction at scale. The page surfaces this trade-off via the cost/ha vs °C columns rather
than a single computed BCR.

### 7.5 Data provenance & limitations

- City heat/GDP/labour data and solution cost/°C data are **hard-coded illustrative** values (aligned to
  ILO/Lancet/IEA ranges), not live climate-model output.
- The productivity-impact and health-cost series add an `sr()=frac(sin(seed+1)×10⁴)` noise term to a
  fixed linear trend — so they are semi-synthetic.
- **No live BCR** is computed: the guide's `BCR = (labour + health + energy saving)/(CapEx + PV OpEx)`
  is representable from the columns but the page does not calculate it; solutions are compared on raw
  cost/°C.

### 8 · Model Specification

**Status: specification — not yet implemented in code** (the page displays cost/°C columns; a live
benefit-cost engine that monetises labour, health and energy benefits is not present).

**8.1 Purpose & scope.** Compute benefit-cost ratios for urban heat-adaptation interventions by city,
monetising avoided labour loss, health cost and energy demand, for city bond issuers and infra investors.

**8.2 Conceptual approach.** A cost-benefit model combining the ILO heat-stress productivity function
with WHO health-cost monetisation and building-energy savings, per the ILO Working on a Warmer Planet
methodology and IEA district-cooling economics.

**8.3 Mathematical specification.**
```
Labour_loss$ = WorkHours_lost(WBGT) × AvgWage × WorkforceSize
   WorkHours_lost = f(WBGT above threshold) per ILO exposure-response
Health_saving = ΔMortality × VSL + ΔMorbidity × DailyCost   (from °C reduction)
Energy_saving = ΔCooling_demand × electricity_price
BCR = (Labour_gain + Health_saving + Energy_saving) / (CapEx + PV(OpEx))
CAGR = (Market_2030/Market_2024)^(1/6) − 1
Intervention °C reduction from SOLUTIONS × deployment area
```

| Parameter | Source |
|---|---|
| WBGT→hours-lost | ILO Heat and Human Performance 2019 |
| VSL / health cost | WHO VSL; Lancet Countdown mortality |
| °C reduction per solution | urban-climate studies (page priors) |
| Energy/electricity price | IEA District Cooling; regional tariffs |
| Discount rate | 5–8% municipal |

**8.4 Data requirements.** City WBGT projections, workforce/wage, mortality baselines, solution
deployment plan, energy prices. The page holds city heat/labour data and solution cost/°C priors.

**8.5 Validation.** Reconcile BCR against Global Commission on Adaptation heat-adaptation returns;
back-test labour-loss against ILO country estimates; sensitivity on VSL and discount rate.

**8.6 Limitations & model risk.** WBGT exposure-response is population-averaged; °C-reduction estimates
per solution are site-specific; co-benefit monetisation is contested. Conservative fallback: report
cost/°C and payback ranges (as the page does) rather than a single BCR.

**Framework alignment:** ILO Working on a Warmer Planet (2019) — labour-productivity loss; Lancet
Countdown (2023) — heat mortality (489k/yr) and health cost; IEA District Cooling — cooling economics
(8.4% CAGR); EU Taxonomy Art 7.4 / CBI Adaptation & Resilience Criteria — the green-bond eligibility
tags on each solution.

## 9 · Future Evolution

### 9.1 Evolution A — Live BCR engine from the ILO exposure-response function (analytics ladder: rung 1 → 2)

**What.** The page is a well-anchored reference tool (8 real cities with hard-coded heat-days/UHI/labour-loss, 7 costed cooling solutions) but computes almost nothing: live math is sorting, `totalGdpRisk` summation and `avgHeatDays2050` — and the guide's headline `BCR = (Labour_gain + Health_saving + Energy_saving)/(CapEx + PV OpEx)` is never calculated; solutions are compared on raw cost/°C only. Evolution A builds the §8 benefit-cost engine: WBGT-driven work-hours lost per the ILO 2019 exposure-response, health savings from °C reduction × mortality baselines, energy savings from displaced cooling demand, producing a per-city, per-solution BCR the budget slider can actually optimise against.

**How.** (1) New `heat_adaptation` route: inputs city, solution mix (from the existing `SOLUTIONS` cost/°C/lifetime columns), deployment hectares from `budgetM`; outputs Labour_gain, Health_saving, Energy_saving, BCR and payback. (2) City WBGT/wage/workforce parameters seeded from ILO country tables and the page's own `CITIES` fields (e.g. Dubai 28% labour loss). (3) The two semi-synthetic chart series (`PRODUCTIVITY_IMPACT`, `HEAT_HEALTH_COST`) drop their `sr()` noise terms and render the deterministic ILO-shaped trends. (4) Validate BCRs against Global Commission on Adaptation heat-adaptation return benchmarks per §8.5.

**Prerequisites.** The seeded-noise terms removed (documented in §7.5); city wage/workforce reference data added — the page currently has heat and cost priors but no monetisation inputs. **Acceptance:** the §7.4 tree-canopy vs district-cooling trade-off reproduces as a BCR ranking with stated VSL/discount assumptions; changing the budget slider changes BCR-optimal allocation deterministically.

### 9.2 Evolution B — City-issuer copilot for cooling-bond structuring (LLM tier 1 → 2)

**What.** A copilot for city bond issuers and infra investors on the EP-EK2 page: "why does Dubai carry 8.4% GDP at risk?", "which solutions are EU Taxonomy Art 7.4 eligible and why?", "at a $50M budget, what's the best cooling per dollar?" Answers ground in this page's unusually strong static corpus — the 8-city table, the 7-solution eligibility tags (EU Taxonomy/CBI ARC/GCF), and the §7.4 worked cost-effectiveness example.

**How.** Tier 1 first: atlas record into `llm_corpus_chunks`; page state (current sort column, `budgetM`) passed as context so the copilot narrates the visible ranking, including the honest caveat that city figures are illustrative values aligned to ILO/Lancet ranges (§7.5), not live climate-model output. After Evolution A, tier 2 tool-calling: natural-language what-ifs ("rerun Karachi with tree canopy only at $20M") execute against the new BCR endpoint, with the no-fabrication validator checking every $ and °C figure against tool output.

**Prerequisites.** Copilot router + corpus (Phase 1); tier 2 gated on Evolution A since the module has no backend endpoints today. **Acceptance:** finance-eligibility answers cite the correct framework tag per solution; tier-2 what-if answers contain no numerics absent from the logged tool call.