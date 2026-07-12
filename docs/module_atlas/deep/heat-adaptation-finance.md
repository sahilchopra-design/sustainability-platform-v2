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
