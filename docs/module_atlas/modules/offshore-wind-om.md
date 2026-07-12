# Offshore Wind O&M & Asset Performance Management
**Module ID:** `offshore-wind-om` · **Route:** `/offshore-wind-om` · **Tier:** B (frontend-computed) · **EP code:** EP-DR5 · **Sprint:** DR

## 1 · Overview
Comprehensive offshore wind operations and maintenance analytics covering turbine component failure rates, weather-window vessel dispatch, OPEX modelling, predictive maintenance economics, blade erosion impact, fleet availability modelling, digital twin value assessment, and long-term OPEX trajectory across 18 analytical tabs for offshore wind asset managers.

> **Business value:** Designed for offshore wind asset managers, O&M service providers, and infrastructure fund asset management teams. Covers the full offshore wind operational analytics stack from turbine reliability and vessel dispatch through blade erosion management, predictive maintenance economics, and digital twin implementation — providing the operational due diligence framework for buying, selling, or managing operating offshore wind assets.

**How an analyst works this module:**
- Set fleet parameters in the left panel: number of turbines, age, rated MW, and select turbine model (different models have different component failure rates)
- Configure maintenance strategy toggle (Corrective Only / Preventive / Predictive/CBM) and enable remote monitoring; "Availability Model" tab updates live with the selected strategy
- Open "Failure Rate Database" tab for the component failure rate table: gearbox, main bearing, generator, blade, pitch, yaw, transformer, power electronics — with MTTR days and annualized cost $/kW
- Navigate to "Weather Window" tab for seasonal access analysis and optimal maintenance campaign timing; "Vessel Dispatch" shows 12-month CTV/SOV/HLV utilization and vessel pooling economics
- Check "Maintenance Cost" waterfall: major corrective → minor corrective → preventive → remote monitoring → vessel → port → insurance → overhead; "OPEX Breakdown" shows $/kW/yr by component
- Open "Blade Erosion" tab for the leading edge erosion model: tip speed vs erosion rate, annual AEP loss, repair campaign cost vs AEP recovery NPV, erosion protection coating upgrade economics
- Navigate "Predictive Maintenance" for CBM vs time-based comparison: availability uplift, false alarm rate, implementation cost NPV, and payback period
- Check "Component Lifecycle" for replacement schedule (gearbox: 10-15yr; blades: 20yr; PCS: 8-12yr) and "Spare Parts" for strategic inventory EOQ analysis with lead time and stockout probability
- Open "Digital Twin" tab for architecture assessment and value quantification; "Fleet Benchmarking" compares your fleet KPIs vs 8 comparable offshore wind farms
- Review "OPEX Trajectory" for 25-year cost profile including warranty, LTSA, and post-warranty ad-hoc periods; "Annual Performance" shows 12-month dashboard with turbine-level ranking

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BENCHMARKS`, `COMPONENTS`, `KpiCard`, `MONTHS`, `OUTAGE_EVENTS`, `SectionHeader`, `SelectRow`, `SideLabel`, `SliderRow`, `TAB_NAMES`, `TURBINE_MODELS`, `ToggleRow`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TURBINE_MODELS` | 6 | `name`, `mw`, `failMult` |
| `COMPONENTS` | 11 | `name`, `baseRate`, `mttr`, `costK`, `lifetime` |
| `BENCHMARKS` | 9 | `avail`, `opexKw`, `lostPct`, `techDays` |
| `OUTAGE_EVENTS` | 6 | `turbines`, `days`, `cause`, `cost` |

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
| `derived` | `useMemo(() => { const ageFactor = 1 + turbineAge * 0.03;` |
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
| `totalOpexM` | `opexM + remoteMonitorCostM + insuranceCostM;` |
| `opexPerMwh` | `annualAep > 0 ? (totalOpexM * 1e6) / annualAep : 0;` |
| `techDaysPerTurbine` | `baseFailRate * avgMttr * 2.5;` |
| `age` | `turbineAge + i;` |
| `ageFactor` | `1 + age * 0.03;` |
| `rows` | `COMPONENTS.map((c, i) => {` |
| `adj` | `c.baseRate * model.failMult * derived.ageFactor;` |
| `annCostKw` | `ratedMw > 0 ? (adj * c.costK * 1000) / (ratedMw * 1000) : 0;` |
| `expectedFailures` | `nTurbines * adj;` |
| `totalAnnCost` | `rows.reduce((s, r) => s + r.annCostKw * ratedMw * 1000 * nTurbines / 1e6, 0);` |
| `highestRisk` | `[...rows].sort((a, b) => b.adj - a.adj)[0];` |
| `wearout` | `i > 12 ? (i - 12) * 0.04 : 0;` |
| `opPerKw` | `nTurbines * ratedMw > 0 ? (op * 1e6) / (nTurbines * ratedMw * 1000) : 0;` |
| `monthlyAccess` | `MONTHS.map((m, i) => {` |
| `ctvAccess` | `seasonal * (accessHs >= 1.5 ? 1.0 : 0.85);` |
| `sovAccess` | `seasonal * (accessHs >= 2.5 ? 1.0 : 0.92);` |
| `heliAccess` | `Math.min(0.95, seasonal + 0.1);` |
| `annualAvgAccess` | `seasonalPcts.reduce((s, v) => s + v, 0) / Math.max(1, seasonalPcts.length);` |
| `optimalWindows` | `monthlyAccess.filter(m => m.ctv > 80).map(m => m.month).join(', ');` |
| `weatherDelayCostM` | `(MONTHS.length * (1 - annualAvgAccess) * 10 * dayRate * 1000) / 1e6;` |
| `vesselData` | `MONTHS.map((m, i) => {` |
| `annualVesselCost` | `(fleetSize * dayRate * 365 * utilPct / 100) / 1000;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BENCHMARKS`, `COMPONENTS`, `MONTHS`, `OUTAGE_EVENTS`, `TAB_NAMES`, `TURBINE_MODELS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Fleet Availability | `1 − (fault_rate × MTTR + weather_downtime + planned)` | IEC 61400-26 | Best-in-class offshore O&M (e.g. Gemini, Hornsea 1): 96–97%; industry average: 93–95%; older turbines with early gearbox failures: 88–92% |
| OPEX (offshore) | `Fixed + variable + vessel charter` | ORE Catapult 2023 | Fixed-bottom offshore: $70–100/kW/yr; floating (higher vessel cost): $90–130/kW/yr; reducing with digitalization and CTV/SOV pooling efficiency |
| Gearbox Failure Rate | `Empirical fleet data (SPARTA, ReliaWind)` | ORE Catapult / ReliaWind | Gearbox: highest cost component failure; mean replacement cost £500–800k offshore; MTTR 10–20 days depending on HLV availability; drives major O&M cost variability |
| Weather Window (CTV) | `% days Hs < 1.5m (CTV access limit)` | Site metocean data | North Sea average: 60–70% accessible days; summer peak: 85%; winter trough: 40–50%; SOV expands to 80–85% of days at Hs < 2.5m threshold |
| Blade Erosion AEP Loss | `ΔCp from leading edge roughness × AEP` | Blade inspection data | Sandy/rainy sites (UK North Sea, Taiwan): 1.5–3%/yr; milder sites: 0.5–1%/yr; protective coating (VorTex) reduces erosion rate 60–80%; repair cost vs AEP recovery typically positive NPV after ~5yr service |
| Predictive Maint Saving | `CBM vs time-based maintenance` | Digital O&M studies | Condition-based monitoring (CMS vibration + oil particle count + thermal imaging) enables 2–4 week early fault detection vs reactive failure; reduces MTTR from 20 to 5 days for gearbox; OPEX saving $10–25/kW/yr |
- **Fleet parameters + turbine model → component failure rates + MTTR (seeded by turbine type)** → Availability model: 1 − (fail_rate × MTTR/8760) − weather_downtime − planned → **Fleet availability %, lost production GWh, revenue impact $M**
- **Site Hs distribution (seeded) × CTV/SOV access threshold → weather window % by month** → Vessel dispatch optimisation: CTV for minor, SOV for major, HLV for crane work → **Vessel utilization %, charter cost $M, optimal vessel fleet composition**
- **Blade erosion model: tip speed + rain rate → erosion rate → AEP loss %** → Repair NPV: ΔRevenue(AEP recovery) − repair cost → break-even year → **Annual AEP loss %, optimal repair trigger year, coating upgrade NPV**

## 5 · Intermediate Transformation Logic
**Methodology:** MTBF Availability Model + Arrhenius Blade Erosion + CBM Value Calculator
**Headline formula:** `Availability = 1 − (λ_fail × MTTR / 8760) − weather_downtime − planned_maint; OPEX_total = Σ(λᵢ × Cost_repair_i) + Vessel_charter + Fixed_O&M`

Turbine availability: technical availability = 1 − (failure_rate × MTTR / 8760); total availability includes weather downtime (% of days Hs > access limit per season), planned maintenance (~3–5 days/turbine/yr). Vessel dispatch: CTV for minor corrective (Hs < 1.5m), SOV for major corrective (Hs < 2.5m), HLV for crane-required (Hs < 1.0m). Blade erosion: leading edge erosion at tip speeds >80m/s; AEP loss 0.5–3%/yr depending on rain intensity and coating; repair cost vs AEP recovery NPV determines optimum intervention threshold.

**Standards:** ['DNVGL-RP-0416 Reliability of Offshore Structures', 'IEC 61400-26 Wind Turbine Availability', 'ORE Catapult Offshore Wind O&M Report 2023']
**Reference documents:** ORE Catapult — Offshore Wind Operations & Maintenance Report 2023; DNVGL-RP-0416:2016 — Reliability, Availability, Maintainability, and Safety (RAMS) for Wind Turbines; IEC 61400-26-1:2019 — Wind Energy Generation Systems — Availability for Wind Turbines; SPARTA — System Performance, Availability and Reliability Trend Analysis (ORE Catapult offshore wind database); Mishnaevsky, L. — Leading Edge Erosion of Wind Turbine Blades: Understanding, Prevention and Protection (Coatings, 2021)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

An MTBF-style availability and OPEX model for offshore wind O&M, decomposing fleet availability
into technical, weather, and planned-maintenance downtime, and pricing corrective/preventive/
predictive maintenance strategies — closely matching the guide's stated formula set.

```
techDowntime      = failureRatePerYr × mttrDays / 365
weatherDowntime    = (1 − weatherWindowPct/100) × 0.05
availability       = 1 − techDowntime − weatherDowntime − plannedMaintDays/365
annualAep          = totalMw × 8760 × avail × 0.42      // 42% assumed capacity factor
lostRevM           = totalMw × 8760 × 0.42 × (1−avail) × revPerMwh / 1e6
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Assumed capacity factor | 0.42 (hard-coded, commented `// 42% capacity factor`) | Synthetic demo value; mid-range for offshore per guide's 38–58% CF range, but not user-adjustable in the AEP formula shown |
| Base failure rate | `0.35 × model.failMult × ageFactor × stratFactor` | Synthetic demo value; `failMult` varies by turbine model (`TURBINE_MODELS`, 6 rows) |
| Age factor | `1 + turbineAge × 0.03` (3%/yr degradation in failure rate) | Synthetic demo value, directionally consistent with ageing-fleet reliability decline |
| Weather window function | `max(40, 75 − (distPort−30)×0.2)` | Synthetic demo value; distance-to-port penalty on accessible days |
| `mttrCostPerK` | 0.4 (commented "simplified") | Explicitly flagged in-code as a simplification |
| Component failure table (`COMPONENTS`, 11 rows) | gearbox/bearing/generator/blade/etc. with `baseRate`, `mttr`, `costK`, `lifetime` | Modelled on ORE Catapult SPARTA-style component taxonomy per guide; seed values, not live registry data |
| Blade wearout | `i>12 ? (i-12)×0.04 : 0` | Synthetic demo value: wearout accelerates after year 12 |

### 7.3 Calculation walkthrough

1. **Fleet availability**: `derived` (`useMemo`) computes `baseFailRate`, `weatherWindowPct`,
   `totalMw`, `annualAep`, `lostAep`, `lostRevM`, and OPEX per kW in one block, correctly cascading
   from the raw fleet inputs (turbine count, age, model, strategy) through to $-denominated outputs.
2. **Component-level cost** (`rows`): each of 11 components gets an age/model-adjusted failure rate
   `adj = c.baseRate × model.failMult × ageFactor`, an annualized cost-per-kW
   (`adj × c.costK×1000 / (ratedMw×1000)`), and expected failure count
   (`nTurbines × adj`) — summed to `totalAnnCost`; `highestRisk` picks the component with the
   largest adjusted failure rate via an in-place-safe `[...rows].sort()`.
3. **Weather window / vessel dispatch**: `monthlyAccess` computes CTV (`Hs<1.5m`), SOV (`Hs<2.5m`),
   and heli accessibility per month from a seasonal multiplier, feeding `annualAvgAccess` and a
   `weatherDelayCostM` estimate; `vesselData`/`annualVesselCost` price fleet charter economics
   (`fleetSize × dayRate × 365 × utilPct/100`).
4. **OPEX build**: `totalOpexM = opexM + remoteMonitorCostM + insuranceCostM`, with
   `opexPerMwh = totalOpexM×1e6 / annualAep` guarded against zero AEP.

### 7.4 Worked example

80-turbine fleet, 12 MW turbines (960 MW total), turbine age 3 yr, corrective-only strategy,
distance to port 50 km:

| Step | Computation | Result |
|---|---|---|
| Age factor | 1 + 3×0.03 | 1.09 |
| Base failure rate | 0.35 × 1.0 × 1.09 × 1.0 | 0.382/turbine/yr |
| Weather window | max(40, 75−(50−30)×0.2) | 71% |
| Weather downtime | (1−0.71)×0.05 | 1.45% |
| Technical downtime (MTTR≈10d) | 0.382×10/365 | 1.05% |
| Availability | 1 − 1.05% − 1.45% − planned | ≈ **96–97%** (before planned maintenance days) |
| Annual AEP | 960,000 kW × 8760 × 0.965 × 0.42 | ≈ 3,398,000 MWh |
| Lost AEP (vs 100% avail) | 960,000×8760×0.42×0.035 | ≈ 123,500 MWh |

This availability range (96–97%) sits at the top of the guide's stated 92–97% industry band,
consistent with "best-in-class" fleet assumptions at 3 years of age.

### 7.5 Data provenance & limitations

- **All fleet, component, and weather parameters are synthetic demo values**; the component
  failure-rate table is styled on ORE Catapult SPARTA/ReliaWind but not populated from that
  database.
- `mttrCostPerK = 0.4` is explicitly marked "simplified" in the source comment — a single blended
  repair-cost factor rather than component-specific vessel/crew/spare-part costing.
- Capacity factor is hard-coded at 42% in the top-level AEP formula, decoupled from the site-level
  capacity-factor modelling in the companion `offshore-wind-resource` module — a cross-module
  consistency gap (a fleet manager changing site assumptions there would see no effect here).
- Blade erosion / predictive-maintenance NPV tabs exist per the guide's `userInteraction` list but
  their specific formulas were not captured in the extracted `computed` set beyond the wearout
  factor noted above.

**Framework alignment:** IEC 61400-26 (availability definition) and DNVGL-RP-0416 (RAMS) motivate
the `1 − Σdowntime` structure and are correctly reflected in the additive downtime decomposition;
CTV/SOV/HLV access-threshold logic (Hs 1.5m/2.5m) matches published offshore O&M vessel-dispatch
practice.

## 9 · Future Evolution

### 9.1 Evolution A — Real reliability data and user-adjustable capacity factor (analytics ladder: rung 2 → 4)

**What.** §7 shows a correctly-built MTBF availability + OPEX model: technical/weather/planned-maintenance downtime decomposition, corrective/preventive/predictive strategy pricing, blade-erosion economics, all matching the guide. §7.2 flags the honest simplifications: capacity factor is hard-coded 0.42 (not user-adjustable in the AEP formula despite being a key driver), the component failure table (`COMPONENTS`, 11 rows) is modelled on ORE Catapult SPARTA taxonomy but uses seed values not live data, and `mttrCostPerK = 0.4` is explicitly flagged in-code as "simplified." Evolution A grounds the reliability data and adds predictive maintenance forecasting.

**How.** (1) Replace the hard-coded 0.42 CF with the actual capacity factor from the fleet's rated MW and the resource-module's AEP (cross-link to `offshore-wind-resource`), so lost-revenue reflects real generation. (2) Calibrate `COMPONENTS` base failure rates to the real ORE Catapult SPARTA database (named in §5) — SPARTA publishes offshore component reliability trends; store dated in a reference table. (3) Rung-4 predictive step: layer a condition-based-maintenance forecast that predicts component failure timing from age/failure-rate curves, quantifying the CBM-vs-time-based availability uplift the guide describes — the platform's forecasting tooling (statsmodels/sklearn) supports this.

**Prerequisites.** SPARTA reliability data (ORE Catapult — partially public); cross-module CF wiring; documenting the failure-forecast model per Atlas §8. **Acceptance:** CF is user-adjustable and flows to AEP/lost-revenue; component failure rates trace to SPARTA; the CBM uplift derives from a failure forecast, not a seed constant.

### 9.2 Evolution B — Asset-management O&M copilot (LLM tier 2)

**What.** A copilot for the offshore-wind asset-manager users §1 targets: "what's fleet availability under predictive maintenance for these 60 turbines?", "how much lost revenue from gearbox failures this year?", "is the blade-erosion coating upgrade NPV-positive?", "compare CBM vs time-based payback" — executed against the availability/OPEX/erosion engine, decomposing results into the technical/weather/planned downtime terms.

**How.** Tool calls to endpoints wrapping the availability model, OPEX waterfall, and blade-erosion NPV; system prompt from this Atlas page's §5 formulas and the DNVGL-RP-0416 / IEC 61400-26 / ORE Catapult references named in §5. Strategy comparisons (corrective/preventive/predictive) are tool calls returning real availability deltas; the coating-upgrade and CBM-payback questions are NPV recomputations. Fabrication validator matches every availability %, $/kW, and NPV to a tool response; the copilot frames outputs as operational-due-diligence-grade (§1 targets buy/sell/manage decisions), and must disclose the assumed capacity factor (until Evolution A makes it live).

**Prerequisites.** Compute endpoints; Evolution A for real reliability data and adjustable CF. **Acceptance:** every availability/OPEX/NPV figure traces to a tool call; strategy comparisons return real uplift deltas; the copilot states its CF assumption explicitly.