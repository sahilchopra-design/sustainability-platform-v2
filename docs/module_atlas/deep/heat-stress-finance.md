## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code note.** The guide (EP-DP1) gives an ILO productivity formula
> `ProductivityLoss = ExposedWorkers × HoursLost × WageRate × (1+multiplier)` and a VSL-based health EAL.
> The code does **not** compute either — each city's `prodLoss`, `heatDeaths`, `gdpImpact` and
> `insuranceGap` are `sr()` PRNG draws, and productivity loss is *not* derived from WBGT via an exposure-
> response function (WBGT and prodLoss are independent seeds). The only live formula is a flat RCP
> scenario multiplier. Sections below document the seeded model the code runs.

### 7.1 What the module computes

`CITIES` (60) are seeded from independent PRNG streams (`sr(seed)=frac(sin(seed+1)×10⁴)`):

```js
wbgt        = 24 + sr(i×7)×17          // 24–41 °C WBGT (independent of prodLoss)
prodLoss    = 3 + sr(i×11)×22          // 3–25% (its own seed — not a WBGT function)
adaptCost   = 0.2 + sr(i×13)×4.8       // $bn
labourRisk  = min(100, 20 + sr(i×17)×70)
heatDeaths  = round(10 + sr(i×19)×490)
gdpImpact   = 0.5 + sr(i×23)×6.5       // % GDP
insuranceGap= 20 + sr(i×31)×70         // %
```

Scenario overlay:
```js
scenarioMultiplier = RCP8.5 ? 1.8 : RCP6.0 ? 1.4 : 1.0     // applied to impacts in scenario tab
```

### 7.2 Parameterisation

| Field | Seeded range | Anchor |
|---|---|---|
| WBGT | 24–41 °C | >33 °C = dangerous for outdoor work (ILO) |
| Productivity loss | 3–25% | tropical outdoor 15–28% (ILO) |
| Insurance gap | 20–90% | protection-gap ranges |
| RCP multiplier | 1.0 / 1.4 / 1.8 | RCP 4.5 / 6.0 / 8.5 |

`SECTOR_DATA` (8 sectors: Construction, Agriculture, Mining…) seeds exposed workers, productivity loss,
adaptation capex, heat mortality, insurance coverage and NGFS RCP 4.5/8.5 impacts. 60 real city names
(Karachi, Delhi, Dubai, Lagos, Athens…) across 8 regions. No ILO exposure-response constants or wage
rates appear — the guide's `ExposedWorkers × HoursLost × Wage` chain is absent.

### 7.3 Calculation walkthrough

Cities filter by region and a WBGT-minimum slider. KPIs aggregate the seeded fields: `avgWbgt`,
`avgProdLoss`, `totalAdaptCost`, `totalHeatDeaths`, `avgGdpImpact`, `avgInsGap`. The scenario tab
multiplies impacts by the RCP multiplier. Sector tab shows per-sector exposure and NGFS RCP projections.

### 7.4 Worked example (filtered aggregate)

Filter to WBGT ≥ 33 °C, MENA region — suppose 6 cities pass with mean prodLoss 18.2%, summed adaptCost
$14.3bn, summed heatDeaths 1,840, under RCP 8.5 (×1.8):

| KPI | Computation | Result |
|---|---|---|
| avgWbgt | mean(filtered wbgt) | e.g. 35.4 °C |
| avgProdLoss | mean(filtered prodLoss) | 18.2% |
| totalAdaptCost | Σ adaptCost | $14.3bn |
| scenario-adjusted deaths | 1,840 × 1.8 | 3,312 |

The RCP 8.5 multiplier scales the (synthetic) impacts by 1.8× — a coarse scenario overlay, not a
downscaled climate projection. WBGT filtering correctly surfaces the hottest cities, but their
productivity loss is drawn independently, so a 41 °C city can show a lower prodLoss than a 34 °C one.

### 7.5 Data provenance & limitations

- **Entirely synthetic** (`sr()` PRNG). Only the 60 city names, 8 regions and 8 sectors are real.
- **WBGT and productivity loss are decoupled** — prodLoss is its own seed, not the ILO exposure-response
  of WBGT, so the core physical→economic linkage the guide describes is not present.
- No wage rates, exposed-worker hours, or VSL — the guide's `ProductivityLoss` and `HeatEAL_health`
  formulas are not implemented; the RCP multiplier (1.0/1.4/1.8) is the only scenario mechanism.

### 8 · Model Specification

**Status: specification — not yet implemented in code.** Below is the ILO/VSL model the guide describes.

**8.1 Purpose & scope.** Quantify the financial cost of extreme heat (labour productivity loss, health
EAL) by city and sector under WBGT projections, for insurers, agri-banks and corporate heat-risk teams.

**8.2 Conceptual approach.** The ILO heat-stress productivity function (WBGT → work-hours lost) combined
with a VSL/DALY health cost, per ILO Working on a Warmer Planet and WHO Environmental Burden of Disease;
WBGT projected from downscaled SSP/RCP.

**8.3 Mathematical specification.**
```
WorkHoursLost_s = ExposedWorkers_s × hours_lost(WBGT, workload_intensity_s)   // ILO ERF
   hours_lost rises sharply above WBGT 26–33 °C, workload-dependent
ProductivityLoss$_s = WorkHoursLost_s × AvgWage_s
HeatEAL_health = ΔMortality × VSL + ΔMorbidity × DailyCost
GDP_impact = Σ_s ProductivityLoss$_s / GDP
Scenario: WBGT(SSP, horizon) from downscaled projections → re-evaluate ERF
```

| Parameter | Source |
|---|---|
| WBGT→hours-lost ERF | ILO Heat and Human Performance 2019 (workload-specific) |
| VSL | WHO VSL (LMIC ~$1M, HIC ~$5M) |
| Exposed workers/wages | ILOSTAT sectoral employment |
| WBGT projections | NASA GISS / downscaled SSP-RCP |
| Morbidity cost | WHO EBD |

**8.4 Data requirements.** City WBGT (historical + projected), sectoral employment and wages, mortality/
morbidity baselines, workload-intensity by sector. The page has city/sector taxonomy but not the ERF
inputs.

**8.5 Validation.** Reconcile GDP loss against ILO's $2.4tn/yr-by-2030 estimate; back-test heat deaths
against Lancet Countdown (Europe 2022 61k); sensitivity on VSL and WBGT thresholds.

**8.6 Limitations & model risk.** ERF is workload- and acclimatisation-dependent; wage and employment
data are coarse in LMICs; VSL is contested. Conservative fallback: report work-hours-lost and GDP-impact
ranges rather than point VSL-monetised figures.

**Framework alignment:** ILO Working on a Warmer Planet (2019) — the productivity ERF; WHO Environmental
Burden of Disease — health EAL; Lancet Countdown (2023) — heat-mortality tracking; IPCC AR6 WG2 Ch7 —
SSP heat projections; the WBGT index (>33 °C dangerous) — the physical exposure metric.
