## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry specifies two named formulas: a
> multiplicative compound-risk score `CLRisk = PhysicalHazard × LabourVulnerability ×
> SupplyChainDependency`, and an exponential heat-stress productivity-loss curve
> `HeatStressProductivityLoss = 1 − exp(−HeatExposure/ThermalComfort)` attributed to IPCC AR5
> physiological research. **Neither formula appears in the code.** The page computes only
> unweighted arithmetic means of independently-seeded risk fields, and a single **linear** scenario
> multiplier (`tempMult = 1 + (tempScenario − 1.5) × 0.1`) applied to heat-stress scores — there is
> no product-of-three-factors compound score and no exponential productivity function anywhere in
> the file. Sections below document what the code actually implements.

### 7.1 What the module computes

70 synthetic "supply chains" (`SUPPLY_CHAINS`), each assigned a commodity (`i % 6` — deterministic
round-robin over `COMMODITIES`) and region (`i % 7` — deterministic round-robin over `REGIONS`, not
randomised) via modulo cycling rather than a random draw, plus nine independently-seeded 0–10 (or
0–50%) risk fields: `heatStressRisk`, `floodRisk`, `workersAffected` (0.1–5.0M), `wageRisk` (5–50%),
`laborRightRisk`, `childLaborIndex`, `genderPayGap` (5–50%), `modernSlaveryRisk`, and
`climateAdaptationScore`. Each uses the platform's seeded PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`
with a distinct integer multiplier per field (`i*7`, `i*11`, `i*13`, …) — fields are mutually
independent draws, not derived from one another.

### 7.2 Temperature-scenario adjustment (the only cross-field transformation)

```js
tempMult = 1 + (tempScenario − 1.5) × 0.1
adjustedHeatRisk = heatStressRisk × tempMult
```

`tempScenario` is a UI slider (1.5 °C–4.0 °C, step 0.5). At the slider's minimum (1.5 °C, the Paris
1.5 °C anchor) `tempMult = 1.00` (no adjustment); at 4.0 °C, `tempMult = 1.25` — a flat +25% linear
uplift to every supply chain's heat-stress score regardless of baseline exposure or region. This is
the **only** place temperature scenario enters any calculation; flood, labour-rights, wage, child
labour, modern-slavery and adaptation scores are unaffected by the scenario slider.

| Parameter | Value | Provenance |
|---|---|---|
| Base scenario anchor | 1.5 °C | Paris Agreement Article 2 aspirational threshold |
| Slope | 0.1 per °C | Synthetic demo value — no cited empirical heat-productivity elasticity |
| Slider range | 1.5–4.0 °C | Spans NGFS Net Zero 2050 to Current Policies temperature outcomes |

### 7.3 Calculation walkthrough

1. **Generation** — 70 rows built once at module load; commodity/region assigned by index modulo
   (deterministic, not random), all nine risk metrics independently seeded.
2. **Filtering** — `filtered` applies commodity, region, and a *risk-level* filter that buckets on
   `getRiskLabel(heatStressRisk)` (`≥7 High / ≥4 Medium / else Low`) — note the risk-level filter
   always tests the **unadjusted** `heatStressRisk`, not the temperature-adjusted value used
   elsewhere on the page.
3. **KPI aggregation** — `totalWorkers` sums `workersAffected` across `filtered`; `avgHeatRisk`,
   `avgLaborRights`, `avgAdaptation` are simple means with an explicit `filtered.length ? … : 0`
   zero-division guard (safe).
4. **Cross-tabs by commodity/region** — `workersByCommodity`, `wageRiskByCountry` (top-15 by
   `wageRisk`), `radarByCommodity` (5-dimension radar per commodity, `wageRisk` scaled ÷10 to fit the
   0–10 radar axis alongside the other four 0–10 metrics) — all unweighted group means.
5. **Scatter (Heat × Labour)** — `scatterData` plots temperature-adjusted heat stress (x) against raw
   labour-rights risk (y) per chain — a visual correlation check, not a computed compound score.
6. **Detail table filter is a no-op** — line 346:
   `filtered.filter(s => s.laborRightRisk > ddThreshold || s.heatStressRisk*tempMult > ddThreshold ||
   true)` — the trailing `|| true` makes the entire predicate always `true`, so the "Due Diligence
   Threshold" slider (`ddThreshold`, 1–10) has **no filtering effect** on the rendered table despite
   being presented as an interactive control.

### 7.4 Worked example

Take chain `i=5` ('China Electronics', commodity index `5%6=5`→Construction — note the round-robin
means chain 5 is actually labelled `COMMODITIES[5]='Construction'` despite its "Electronics" name,
illustrating that name and assigned commodity are independently sourced arrays). `heatStressRisk =
1+sr(35)×9`. Computing `sr(35)=frac(sin(36)×10⁴)`: `sin(36 rad)≈-0.9918`, ×10⁴=-9918, frac of a
negative number via `x-Math.floor(x)` → `-9918 - (-9919) = 0.082` → `heatStressRisk ≈
1+0.082×9=1.74`. At `tempScenario=4.0°C`: `tempMult=1+(4.0-1.5)×0.1=1.25`; adjusted heat risk
`=1.74×1.25=2.18` → still `getRiskLabel(2.18)='Low'` (needs ≥4 for Medium). This shows the linear
+25% ceiling uplift is too small to reclassify most Low-risk chains into Medium/High bands purely
from scenario stress — the scenario slider mainly re-scales magnitude within a risk band rather than
migrating chains across bands.

### 7.5 Companion analytics

- **8-tab structure** — Overview, Heat Stress, Flood Risk, Labor Rights, Wage Risk, Child Labor,
  Modern Slavery, Adaptation Capacity — each a single bar/scatter chart of one metric's group mean
  by commodity or region; no tab combines multiple risk dimensions into a composite score.
- **Radar chart** — hard-codes only 3 of 6 commodities (Textiles, Electronics, Food) as radar series;
  Automotive, Chemicals, Construction are computed in `radarByCommodity` but never rendered.

### 7.6 Data provenance & limitations

- **100% synthetic demo data.** All 70 supply chains and all nine risk metrics are `sr()`-seeded;
  commodity/region assignment is deterministic round-robin, not sampled from real trade-flow data.
- No compound `CLRisk` score, no exponential heat-productivity-loss function, and no wet-bulb globe
  temperature (WBGT) calculation exist in code despite being named in the guide's acronym list and
  formula — see §8 for the specification these should follow.
- The "Due Diligence Threshold" slider is non-functional (§7.3.6) — a UI defect, not just a modelling
  simplification.
- `wageRisk` and `genderPayGap` are drawn from the same distribution shape (`5+sr()×45`) but
  `genderPayGap` is never surfaced in any chart or table in this file — dead data.

**Framework alignment:** ILO's *Ensuring Safety and Health at Work in a Changing Climate* (2023)
motivates the heat-stress/labour-rights framing but its WBGT-based productivity-loss methodology is
not implemented. CS3D (EU Corporate Sustainability Due Diligence Directive) and the German LkSG are
cited as the regulatory drivers for supply-chain human-rights due diligence but the module has no
due-diligence workflow (submission, remediation tracking, tier escalation) — it is a risk-exposure
dashboard only, not a due-diligence system of record.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Support CS3D/LkSG-mandated human-rights and environmental due diligence by quantifying compound
climate-labour risk per supply chain node, and estimate productivity/output-at-risk from physical
heat exposure — replacing the current independent-mean dashboard with the guide's intended
multiplicative risk model and physiologically grounded productivity-loss curve.

### 8.2 Conceptual approach

Two linked sub-models, benchmarking against **ILO's heat-stress productivity methodology** (used in
ILO's 2019 *Working on a Warmer Planet* report, itself derived from ISO 7243 WBGT thresholds and
Kjellstrom et al. physiological work-capacity curves) and **Verisk Maplecroft's Human Rights /
Climate compound-risk indices**, which multiply independent hazard, vulnerability, and exposure
components rather than averaging them — averaging masks nodes that are extreme on one dimension.

### 8.3 Mathematical specification

```
# Heat-stress productivity loss (ISO 7243 WBGT work-capacity curve, Kjellstrom 2009 form)
WorkCapacity(WBGT) = 100 / (1 + (WBGT / 32.93)^17.3)              (%, sigmoid decay)
ProductivityLoss    = 1 − WorkCapacity(WBGT)/100                   ∈ [0,1]

# Compound climate-labour risk (multiplicative, per guide intent)
PhysicalHazard(node)      = w1·HeatExposure + w2·FloodRisk           (0–10, normalised)
LabourVulnerability(node) = w3·(10−LabourRightsScore) + w4·ChildLaborIdx + w5·ModernSlaveryRisk
SupplyChainDependency(node) = WorkersAffected(node) / Σ_all WorkersAffected      (criticality weight)

CLRisk(node) = PhysicalHazard(node) × LabourVulnerability(node) × (1 + SupplyChainDependency(node))
             ∈ [0, 100+]   (product, NOT sum — a 0 on any hazard dimension does not zero the score
             because Dependency term is additive as (1+·); Hazard/Vulnerability are themselves
             weighted sums to avoid the score collapsing whenever one input is 0)
```

| Parameter | Value | Calibration source |
|---|---|---|
| WBGT sigmoid center | 32.93 °C | ISO 7243 heat-stress standard / Kjellstrom (2009) empirical work-capacity curve |
| WBGT sigmoid steepness | 17.3 | Kjellstrom (2009), fitted to observed agricultural/industrial labour data |
| Hazard weights w1,w2 | 0.6, 0.4 | Reflects heat as dominant acute driver of productivity loss vs. flood (episodic); calibrate against ILO 2023 sector loss data |
| Vulnerability weights w3-w5 | 0.5, 0.25, 0.25 | Weighted toward labour-rights baseline per ILO core-conventions framework; child labour and modern slavery treated as tail-risk flags |
| Dependency normalisation | Σ workers | Standard criticality weighting — larger-workforce nodes weighted higher in portfolio CLRisk roll-up |

### 8.4 Data requirements

- Location-level WBGT projections by SSP/RCP and decade (source: NASA/NOAA reanalysis + CMIP6
  downscaled products, free; commercial: Verisk Maplecroft Climate Hazard).
- ILO core-convention ratification and enforcement scores by country (ILO NORMLEX, free).
- Verified workforce counts per supply-chain node (currently synthetic `workersAffected` — needs
  supplier HR/ERP feed).
- Modern-slavery and child-labour incident registers (Global Slavery Index, free; RepRisk, vendor).

### 8.5 Validation & benchmarking plan

Validate `WorkCapacity(WBGT)` against ILO's published country-level heat-productivity-loss estimates
(2030/2045 horizons) — target ±15% agreement. Backtest `CLRisk` ranking against realised supplier
audit findings (NGO reports, OSHA-equivalent citations) using rank-correlation (Spearman); sensitivity
-test the hazard/vulnerability weight split ±20%.

### 8.6 Limitations & model risk

WBGT sigmoid assumes outdoor/manual labour conditions; indoor climate-controlled facilities need a
separate, less severe curve — misapplying the outdoor curve to e.g. semiconductor cleanrooms would
overstate risk. The multiplicative CLRisk form is sensitive to the additive-dependency design choice
(`1+Dependency` vs. pure product) — document this explicitly in any model validation package so
reviewers understand why a zero-hazard node still carries residual risk.
