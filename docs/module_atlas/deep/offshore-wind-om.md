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
