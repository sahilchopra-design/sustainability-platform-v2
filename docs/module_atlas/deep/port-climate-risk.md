## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide specifies a weighted composite
> `PortRisk = w_P·PhysicalHazard + w_T·TransitionRisk + w_O·OperationalDisruption` and a
> multiplicative `PhysicalExposure = SLR_penetration × InfrastructureVulnerability × TradeValue`.
> **Neither is computed.** The code uses only an **unweighted mean of four hazard scores** for the
> composite; transition risk, SLR penetration, and infrastructure vulnerability never enter any
> formula. Real port *names* are used, but every hazard, capex and readiness value is an independent
> `sr()` draw. §8 specifies the multi-hazard exposure model the guide describes.

### 7.1 What the module computes

Per port, four hazard scores (1–10) are averaged into a physical-risk composite and bucketed:

```js
avgPhysicalRisk = (floodRisk + stormSurgeRisk + heatRisk + droughtRisk) / 4     // equal weights
riskLevel = avg ≥ 7.5 ? 'Extreme' : avg ≥ 5.5 ? 'High' : avg ≥ 3.5 ? 'Medium' : 'Low'
```

Portfolio aggregates over the filtered set:
```js
totalThroughput = Σ throughputMt
avgPhysicalRisk = Σ p.avgPhysicalRisk / n
totalAdaptCapex = Σ adaptationCapex
greenInfraPct   = count(shorepower ∨ lngBunkering) / n × 100
```

### 7.2 Parameterisation / seed rubric

| Field | Formula | Range | Provenance |
|---|---|---|---|
| `floodRisk` | `1 + sr(i·3)·9` | 1–10 | synthetic demo value |
| `stormSurgeRisk` | `1 + sr(i·7)·9` | 1–10 | synthetic demo value |
| `heatRisk` | `1 + sr(i·11)·9` | 1–10 | synthetic demo value |
| `droughtRisk` | `1 + sr(i·13)·9` | 1–10 | synthetic demo value |
| `seaLevelExposure` | `0.5 + sr(i·23)·4.5` | 0.5–5.0 m | synthetic — computed but **not used** in composite |
| `throughputMt` | `10 + sr(i·5)·790` | 10–800 Mt | synthetic demo value |
| `cargoValue` | `5 + sr(i·19)·495` | $5–500B | synthetic demo value |
| `adaptationCapex` | `10 + sr(i·29)·490` | $10–500M | synthetic demo value |
| `operationalDisruptionRisk` | `5 + sr(i·31)·65` | 5–70 | synthetic; **not** in composite |
| `renewableEnergyPct` | `5 + sr(i·43)·75` | 5–80 % | synthetic demo value |
| `PORT_NAMES` | 55 real global ports (Shanghai, Singapore, Rotterdam…) | curated labels only |

All hazard scores draw from **independent** seed streams, so a port's flood and storm-surge risk are
uncorrelated — physically implausible (both driven by coastal exposure), and `seaLevelExposure` is
orthogonal to `floodRisk` despite being the same underlying hazard.

### 7.3 Calculation walkthrough

1. 55 ports built at load; `region = REGIONS[i % 6]` cycles regions deterministically.
2. Filters: region, risk level, green-infra (`greenShippingInfra ≥ 6`).
3. Composite = plain mean of 4 hazards → `riskLevel` bucket.
4. `slrScenario` and `stormIntensity` sliders exist in state but do **not** rescale any hazard score
   in the aggregates — they are display controls, not model inputs.
5. Chart series sort/slice the top-15 ports by throughput, flood+storm, heat+drought, disruption,
   capex, and renewable %.

### 7.4 Worked example

A port with floodRisk 8.0, stormSurgeRisk 7.0, heatRisk 4.0, droughtRisk 3.0:

| Output | Computation | Result |
|---|---|---|
| avgPhysicalRisk | (8+7+4+3)/4 | 5.5 |
| riskLevel | 5.5 ≥ 5.5 → 'High' | High |

The equal weighting means acute coastal hazards (flood 8, surge 7) are diluted by inland hazards
(heat 4, drought 3) even though a container port's dominant loss driver is inundation — a weighting
flaw the guide's `w_P/w_T/w_O` scheme was meant to fix.

### 7.5 Data provenance & limitations

- **All quantitative data synthetic**, from `sr(seed)=frac(sin(seed+1)×10⁴)`; only port names and
  region labels are real.
- Composite ignores transition risk, SLR penetration, infrastructure vulnerability, cargo value, and
  operational disruption — despite all being present as fields. It is a flat 4-hazard average.
- SLR and storm-intensity sliders are inert with respect to the risk math.

**Framework alignment:** PIANC *Climate Change Adaptation for Ports* (2020) — cited for the hazard
taxonomy (flood/surge/heat/drought), not the scoring · OECD/ITF Port Outlook 2023 and World Bank Port
Reform Toolkit — referenced for throughput/adaptation framing · IMO 2023 GHG Strategy — motivates the
transition-risk term that is absent from code · UNCTAD $14Tn / 80 %-by-sea figures appear as guide
prose only.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce a defensible port-level climate-risk score and expected annual loss (EAL) combining physical
inundation, operational downtime, and fossil-throughput transition risk — for port operators,
maritime-infrastructure funds, and trade-finance lenders sizing adaptation capex.

### 8.2 Conceptual approach
A **catastrophe-model-style expected-loss framework** (hazard × exposure × vulnerability), in the
lineage of Swiss Re CatNet and the World Bank/PIANC port-adaptation methodology, layered with a
**transition-revenue-at-risk** module mirroring Carbon Tracker's stranded-throughput analysis. Keep
physical and transition risk as separate, weighted pillars rather than one flat average.

### 8.3 Mathematical specification
```
Inundation_p   = P(SLR + surge > quay_elevation_p | scenario s, year t)
AAL_phys_p     = Σ_h AnnualExceedProb_h × Vulnerability_h × AssetValue_p
Downtime_p     = ExpectedDisruptionDays_p / 365 × ThroughputRevenue_p
TransitionRaR_p= FossilThroughputShare_p × Revenue_p × (1 − DemandIndex_s,t)
PortRisk_p     = w_P·norm(AAL_phys) + w_O·norm(Downtime) + w_T·norm(TransitionRaR)
AdaptationNPV_p= Σ_t (ΔAAL_avoided − OpexΔ)_t/(1+r)^t − AdaptCapex_0
```

| Parameter | Calibration source |
|---|---|
| SLR / surge return periods | IPCC AR6 SLR scenarios (SSP1-2.6…SSP5-8.5); NOAA/DIVA coastal DB |
| `quay_elevation`, `AssetValue` | port GIS + asset registers; World Bank port exposure DB |
| `Vulnerability_h` | PIANC damage functions by asset class |
| `ExpectedDisruptionDays` | historical closure records; Swiss Re sigma marine |
| `FossilThroughputShare`, `DemandIndex` | Carbon Tracker port exposure; IEA WEO fossil demand paths |
| `w_P,w_O,w_T`, `r` | expert-set (e.g. 0.5/0.2/0.3), issuer WACC; sensitivity-tested |

### 8.4 Data requirements
`quay_elevation`, `asset_value`, `commodity_mix`, `fossil_share`, `historical_closures`,
`throughput_mt`, `revenue`, `adaptation_options_cost`. Sources: port GIS/asset registers (primary),
World Bank port-climate DB (free), IPCC AR6 SLR (free), IEA WEO, Carbon Tracker. Platform holds
region and throughput proxies; elevation/GIS are new.

### 8.5 Validation & benchmarking plan
Backtest `Downtime` against observed weather-closure days at instrumented ports; reconcile `AAL_phys`
against Swiss Re / commercial cat-model port outputs where available; benchmark `TransitionRaR`
against Carbon Tracker stranded-throughput estimates. Sensitivity-test on SLR scenario and weights.

### 8.6 Limitations & model risk
Quay-elevation and asset-value data are sparse and port-specific; surge-inundation coupling is highly
local; fossil-demand paths are scenario-uncertain. Conservative fallback: present PortRisk and
AdaptationNPV as SSP-scenario bands, and floor Inundation probability using deterministic
worst-case surge + SLR where stochastic data is missing.
