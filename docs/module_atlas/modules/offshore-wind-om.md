# Offshore Wind O&M & Asset Performance Management
**Module ID:** `offshore-wind-om` · **Route:** `/offshore-wind-om` · **Tier:** B (frontend-computed) · **EP code:** EP-DR5 · **Sprint:** DR

## 1 · Overview
Comprehensive offshore wind operations and maintenance analytics covering turbine component failure rates, weather-window vessel dispatch, OPEX modelling, predictive maintenance economics, blade erosion impact, fleet availability modelling, digital twin value assessment, and long-term OPEX trajectory across 18 analytical tabs for offshore wind asset managers.

> **Business value:** Designed for offshore wind asset managers, O&M service providers, and infrastructure fund asset management teams. Covers the full offshore wind operational analytics stack from turbine reliability and vessel dispatch through blade erosion management, predictive maintenance economics, and digital twin implementation — providing the operational due diligence framework for buying, selling, or managing operating offshore wind assets.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BENCHMARKS`, `COMPONENTS`, `KpiCard`, `MONTHS`, `OUTAGE_EVENTS`, `SectionHeader`, `SelectRow`, `SideLabel`, `SliderRow`, `TAB_NAMES`, `TURBINE_MODELS`, `ToggleRow`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtPct` | `v => (isFinite(v) ? `${(v * 100).toFixed(1)}%` : '—');` |
| `techDowntime` | `failureRatePerYr * mttrDays / 365;` |
| `weatherDowntime` | `(1 - weatherWindowPct / 100) * 0.05;` |
| `planned` | `plannedMaintDays / 365;` |
| `correctiveCost` | `nTurbines * failureRate * mttrCostPerK * 1000;` |
| `vesselCost` | `nTurbines * failureRate * mttrCostPerK * 0.3;` |
| `fixed` | `nTurbines * mwEach * 1000 * fixedCostPerKw;` |
| `ageFactor` | `1 + turbineAge * 0.03;` |
| `baseFailRate` | `0.35 * model.failMult * ageFactor * stratFactor;` |
| `weatherWindowPct` | `Math.max(40, 75 - (distPort - 30) * 0.2);` |
| `totalMw` | `nTurbines * ratedMw;` |
| `annualAep` | `totalMw * 8760 * avail * 0.42; // MWh, 42% capacity factor` |
| `lostAep` | `totalMw * 8760 * 0.42 * (1 - avail);` |
| `lostRevM` | `(lostAep * revPerMwh) / 1e6;` |
| `mttrCostPerK` | `0.4; // simplified` |
| `vesselDayRateFull` | `dayRate * 1000;` |
| `remoteMonitorCostM` | `remoteMonitor ? nTurbines * 8000 / 1e6 : 0;` |
| `insuranceCostM` | `(totalMw * 1000 * 1500 * insuranceRate) / (100 * 1e6);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BENCHMARKS`, `COMPONENTS`, `MONTHS`, `OUTAGE_EVENTS`, `TAB_NAMES`, `TURBINE_MODELS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Fleet Availability | `1 − (fault_rate × MTTR + weather_downtime + planned)` | IEC 61400-26 | Best-in-class offshore O&M (e.g. Gemini, Hornsea 1): 96–97%; industry average: 93–95%; older turbines with ear |
| OPEX (offshore) | `Fixed + variable + vessel charter` | ORE Catapult 2023 | Fixed-bottom offshore: $70–100/kW/yr; floating (higher vessel cost): $90–130/kW/yr; reducing with digitalizati |
| Gearbox Failure Rate | `Empirical fleet data (SPARTA, ReliaWind)` | ORE Catapult / ReliaWind | Gearbox: highest cost component failure; mean replacement cost £500–800k offshore; MTTR 10–20 days depending o |
| Weather Window (CTV) | `% days Hs < 1.5m (CTV access limit)` | Site metocean data | North Sea average: 60–70% accessible days; summer peak: 85%; winter trough: 40–50%; SOV expands to 80–85% of d |
| Blade Erosion AEP Loss | `ΔCp from leading edge roughness × AEP` | Blade inspection data | Sandy/rainy sites (UK North Sea, Taiwan): 1.5–3%/yr; milder sites: 0.5–1%/yr; protective coating (VorTex) redu |
| Predictive Maint Saving | `CBM vs time-based maintenance` | Digital O&M studies | Condition-based monitoring (CMS vibration + oil particle count + thermal imaging) enables 2–4 week early fault |
- **Fleet parameters + turbine model → component failure rates + MTTR (seeded by turbine type)** → Availability model: 1 − (fail_rate × MTTR/8760) − weather_downtime − planned → **Fleet availability %, lost production GWh, revenue impact $M**
- **Site Hs distribution (seeded) × CTV/SOV access threshold → weather window % by month** → Vessel dispatch optimisation: CTV for minor, SOV for major, HLV for crane work → **Vessel utilization %, charter cost $M, optimal vessel fleet composition**
- **Blade erosion model: tip speed + rain rate → erosion rate → AEP loss %** → Repair NPV: ΔRevenue(AEP recovery) − repair cost → break-even year → **Annual AEP loss %, optimal repair trigger year, coating upgrade NPV**

## 5 · Intermediate Transformation Logic
**Methodology:** MTBF Availability Model + Arrhenius Blade Erosion + CBM Value Calculator
**Headline formula:** `Availability = 1 − (λ_fail × MTTR / 8760) − weather_downtime − planned_maint; OPEX_total = Σ(λᵢ × Cost_repair_i) + Vessel_charter + Fixed_O&M`
**Standards:** ['DNVGL-RP-0416 Reliability of Offshore Structures', 'IEC 61400-26 Wind Turbine Availability', 'ORE Catapult Offshore Wind O&M Report 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).