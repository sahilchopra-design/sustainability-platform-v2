# Port Climate Risk Analytics
**Module ID:** `port-climate-risk` · **Route:** `/port-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-DJ5 · **Sprint:** DJ

## 1 · Overview
Quantifies climate physical and transition risks to port infrastructure and trade flows. Models sea level rise impacts on port access, extreme weather operational disruption, shipping decarbonisation effects on port revenue mix, and adaptation investment requirements.

> **Business value:** Applicable to port operators, maritime infrastructure funds, trade finance banks, and sovereign transport ministries. Provides port-level physical risk quantification for asset management decisions, transition risk for port operators diversifying away from fossil fuel throughput, and adaptation investment economics.

**How an analyst works this module:**
- Select port and review climate hazard exposure
- Model SLR inundation on port access and infrastructure
- Calculate operational disruption from extreme weather
- Assess transition risk from fossil fuel throughput decline
- Generate PIANC/World Bank-aligned adaptation investment plan

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `KpiCard`, `PORTS`, `PORT_NAMES`, `REGIONS`, `RISK_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `getAvgRisk` | `p => +((p.floodRisk + p.stormSurgeRisk + p.heatRisk + p.droughtRisk) / 4).toFixed(1);` |
| `floodR` | `+(1 + sr(i * 3) * 9).toFixed(1);` |
| `stormR` | `+(1 + sr(i * 7) * 9).toFixed(1);` |
| `heatR` | `+(1 + sr(i * 11) * 9).toFixed(1);` |
| `droughtR` | `+(1 + sr(i * 13) * 9).toFixed(1);` |
| `greenInfra` | `+(1 + sr(i * 17) * 9).toFixed(1);` |
| `avg` | `(floodR + stormR + heatR + droughtR) / 4;` |
| `totalThroughput` | `filtered.reduce((a, p) => a + p.throughputMt, 0);` |
| `totalAdaptCapex` | `filtered.reduce((a, p) => a + +p.adaptationCapex, 0);` |
| `throughputData` | `[...filtered].sort((a, b) => b.throughputMt - a.throughputMt).slice(0, 15).map(p => ({` |
| `adaptVsRisk` | `filtered.map(p => ({` |
| `greenInfraData` | `REGIONS.map(r => {` |
| `floodStormData` | `[...filtered].sort((a, b) => b.floodRisk + b.stormSurgeRisk - a.floodRisk - a.stormSurgeRisk).slice(0, 15).map(p => ({` |
| `heatDroughtData` | `[...filtered].sort((a, b) => b.heatRisk + b.droughtRisk - a.heatRisk - a.droughtRisk).slice(0, 15).map(p => ({` |
| `disruptionData` | `[...filtered].sort((a, b) => b.operationalDisruptionRisk - a.operationalDisruptionRisk).slice(0, 15).map(p => ({` |
| `adaptData` | `[...filtered].sort((a, b) => b.adaptationCapex - a.adaptationCapex).slice(0, 15).map(p => ({` |
| `decarb` | `[...filtered].sort((a, b) => b.renewableEnergyPct - a.renewableEnergyPct).slice(0, 15).map(p => ({` |
| `value` | `filtered.filter(p => p.riskLevel === rl).reduce((a, p) => a + p.cargoValue, 0).toFixed(0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PORT_NAMES`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Port Throughput Value | — | UNCTAD Review of Maritime Transport 2023 | 80% of global trade volume moves by sea — port disruption has outsized GDP impact |
| Ports at SLR Risk | — | World Bank Port Climate Exposure 2022 | 30 of the top 100 global ports face significant sea level rise exposure by 2050 under RCP8.5 |
| Coal Port Revenue Risk | — | Carbon Tracker Port Exposure 2023 | Coal represents 25% of bulk port revenue globally — at risk from energy transition demand destruction |
- **Port infrastructure data (elevation, footprint, quay length)** → Physical risk assessment → **Port-level SLR inundation probability and infrastructure loss**
- **Historical weather disruption + operational data** → Operational disruption modelling → **Annual port downtime probability and revenue impact**
- **Port commodity throughput by type (coal, LNG, containers)** → Transition risk calculation → **Revenue at risk from fossil fuel demand destruction by scenario**

## 5 · Intermediate Transformation Logic
**Methodology:** Port Climate Risk Score
**Headline formula:** `PortRisk = w_P × PhysicalHazardScore + w_T × TransitionRisk + w_O × OperationalDisruption; PhysicalExposure = SLR_penetration × InfrastructureVulnerability × TradeValue`

Port physical risk combines inundation probability with operational disruption from storms; transition risk models revenue loss from fossil fuel throughput decline as shipping decarbonises

**Standards:** ['OECD/ITF Port Outlook 2023', 'PIANC Climate Change Adaptation for Ports 2020', 'IMO 2023 GHG Strategy — Port Impacts', 'World Bank Port Reform Toolkit Climate Module']
**Reference documents:** PIANC — Climate Change Adaptation Planning for Ports and Inland Waterways (2020); OECD/ITF Port Outlook 2023; World Bank Port Reform Toolkit — Climate Change Module; UNCTAD Review of Maritime Transport 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Weighted composite + real SLR exposure (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide specifies a weighted composite (`PortRisk = w_P·PhysicalHazard + w_T·TransitionRisk + w_O·OperationalDisruption`) and a multiplicative `PhysicalExposure = SLR_penetration × InfrastructureVulnerability × TradeValue`, but the code uses only an unweighted mean of four hazard scores; transition risk, SLR penetration, and infrastructure vulnerability never enter any formula, and every hazard/capex value is an independent `sr()` draw over real port names. Evolution A builds the documented models over real hazard data.

**How.** (1) Implement the weighted composite with the transition and operational-disruption terms the guide names: transition risk from a port's fossil-fuel-throughput share (real port throughput data — UNCTAD Review of Maritime Transport named in §5 has commodity splits), operational disruption from extreme-weather frequency at the port's coordinates. (2) Implement `PhysicalExposure = SLR_penetration × vulnerability × trade_value` using the Physical Risk Digital Twin's sea-level and cyclone grids for real SLR/storm exposure at each port's location, port infrastructure vulnerability by asset type, and real trade value. (3) The PIANC/World Bank adaptation plan (§1) then keys to the actual highest-exposure hazards, not seeded capex.

**Prerequisites.** Real port throughput/trade data (UNCTAD/OECD-ITF named in §5); the digital-twin sea-level grid is thin (152 rows) — caveat SLR coverage per port; remove `sr()`. **Acceptance:** PortRisk decomposes into the three weighted terms; PhysicalExposure is the documented product over real SLR data; two ports at different coordinates/throughput profiles score differently.

### 9.2 Evolution B — Port-risk-diligence copilot (LLM tier 1 → 2)

**What.** A copilot for the port-operator/infra-fund/trade-finance users §1 targets: "what's the climate risk for Rotterdam under SSP5-8.5?", "how exposed is this port's revenue to shipping decarbonisation?", "what adaptation capex does the PIANC framework recommend?" — grounded, post-Evolution-A, in the weighted composite and the PIANC/World Bank/UNCTAD references named in §5.

**How.** Near-term tier-1 is framework-only (explaining port climate-adaptation approaches from the standards corpus), because today's port hazard/capex numbers are seeded and must not be narrated as a port's real risk. Post-Evolution-A: tool calls to the PortRisk composite and PhysicalExposure engine, decomposing each port's score into physical/transition/operational terms with the fabrication validator matching every figure to outputs; the adaptation plan drafts from the computed exposure. Provenance cites the SLR-grid vintage and coverage tier per port.

**Prerequisites.** Tier 1 needs the standards corpus + explicit current-state disclosure; port scoring gated on Evolution A. **Acceptance:** framework answers cite PIANC/World Bank; port risk scores (post-Evolution-A) trace to the weighted-composite tool with the three-term decomposition; the copilot refuses to score ports from the current seeded data.