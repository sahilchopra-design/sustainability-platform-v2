## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch (partial).** The guide's formula, `Physical Vulnerability Index =
> (Hazard Exposure×0.4) + (Sensitivity×0.35) + (1−Adaptive Capacity)×0.25`, is **not** the formula in
> code. The code instead computes `compositePhysicalRisk` as an unweighted mean of six 0–10 hazard
> scores × 10, and derives `adaptationCapacity` and downstream GDP-at-risk/infrastructure fields from
> that composite via separate hand-tuned linear formulas — not the guide's three-term weighted
> blend. The real-data overlay (EM-DAT, ND-GAIN) also creates an internal inconsistency: once
> `compositePhysicalRisk` is overwritten with EM-DAT-derived data, the *downstream* fields
> (`gdpAtRisk2030Pct`, `infrastructureVulnerabilityScore`, RCP scenario splits) are **not**
> recomputed — they remain frozen at values derived from the pre-overlay synthetic composite. See
> §7.6 for detail.

### 7.1 What the module computes

For 80 countries (`COUNTRY_NAMES`), seed `s = i×17+7`, six hazard scores (0–10, region-biased):

```
flood, drought, heatStress, cyclone, seaLevel, wildfire ∈ [0,10]   // region-conditioned base + sr() noise, capped at 10
compositePhysicalRisk = mean(6 hazards) × 10                        // 0–100 scale
```

Region conditioning uses a hand-curated `REGION_MAP_PHY` (7 regions) to set each hazard's baseline
—e.g. flood base is highest for South Asia (`regionIdx=6`: `6+sr()×3`) and Asia-Pacific
(`regionIdx=1`: `5+sr()×4`); heat-stress base is highest for Middle East (`regionIdx=4`:
`8+sr()×1.5`); cyclone base is highest for Asia-Pacific and Latin America. This regional biasing is
a genuine (if hand-tuned, not IPCC-derived) design choice — it is not pure noise.

### 7.2 Downstream formulas (all linear in `compositePhysicalRisk`)

```
gdpAtRisk2030Pct            = 1 + compositePhysicalRisk×0.3 + sr()×4
gdpAtRisk2050Pct             = gdpAtRisk2030Pct×1.8 + sr()×3
agricultureExposurePct       = 10 + compositePhysicalRisk×2 + sr()×15        // NOT capped at 100 — see §7.6
infrastructureVulnerabilityScore = min(100, compositePhysicalRisk×8 + sr()×25)
adaptationCapacity            = clamp(5,95, 95 − compositePhysicalRisk×6 − (regionIdx≥4 ? 15 : 0) + sr()×20)
climateVulnerabilityIndex     = min(100, 100 − adaptationCapacity)
scenario2030RCP2.6/4.5/8.5    = gdpAtRisk2030Pct × 0.6 / 0.85 / 1.4
lossAndDamageEstimateBnUSD    = compositePhysicalRisk × sr() × 20 + 1
adaptationFinancingNeedBnUSD  = compositePhysicalRisk × sr() × 15 + 0.5
infraScores[sector]            = min(100, infrastructureVulnerabilityScore + sr()×30 − 15)   // per of 5 sectors
```

The `climateVulnerabilityIndex = 100 − adaptationCapacity` identity is the fix for the previously
documented double-counting bug (REM-38 backlog item: CVI used to add `compositePhysicalRisk` on top
of an already-embedded term) — the code as it stands now derives CVI purely as the complement of
adaptive capacity, avoiding double-counting.

### 7.3 Calculation walkthrough

1. **Hazard generation** — six region-biased hazard scores per country, capped at 10.
2. **Composite** — simple unweighted mean × 10 (not the guide's 0.4/0.35/0.25 weighted blend).
3. **Real-data overlay (GAP-005)** — for countries present in `EMDAT_PHYSICAL_HAZARD_FREQUENCY`,
   `compositePhysicalRisk` is overwritten with `min(100, composite_hazard_score×10)` from real EM-DAT
   disaster-frequency data, and `avgAnnualFloodEvents`/`avgAnnualDroughtEvents`/`avgAnnualStormEvents`/
   `economicLossesAvgBn`/`populationAffectedAvg` are attached. Similarly `adaptationCapacity` and
   `climateVulnerabilityIndex` are overwritten from `ND_GAIN_COUNTRY_SCORES` (`readiness×100`,
   `vulnerability×100`). **Because this overlay runs after all downstream fields are already
   computed, `gdpAtRisk2030Pct/2050Pct`, `infrastructureVulnerabilityScore`, `infraScores`, and the
   three RCP scenario splits are never refreshed against the new real composite** — for overlaid
   countries these fields reflect the discarded synthetic hazard mix, not the real EM-DAT-derived
   risk level.
4. **NGFS scenario panel** — 5 economies × 5 NGFS scenarios × 7 years (2020–2050); GDP impact
   `= −[mult(scenario)×2 + year_index×0.5 + composite/20] + noise`, with scenario multipliers
   `[1.0, 0.7, 0.3, 0.6, 1.3]` for `[Current Policies, NDC Scenario, 1.5°C Orderly, Disorderly
   Transition, Hot House World]` — i.e. **1.5°C Orderly has the smallest GDP-impact multiplier and
   Hot House World the largest**, correctly encoding "orderly transition ⇒ least physical-risk GDP
   drag" (this is the corrected ordering referenced in the REM-38 backlog fix).
5. **Infrastructure vulnerability** — per-sector scores (Ports, Roads, Energy Grid, Water Systems,
   Agriculture) scattered ±15 around the country's `infrastructureVulnerabilityScore`.

### 7.4 Worked example — Bangladesh (index 0, South Asia, `regionIdx=6`)

`s = 0×17+7 = 7`.

| Hazard | Formula | Result |
|---|---|---|
| Flood | `6+sr(7)×3` | 7.7 |
| Drought | `4+sr(13)×3` | 4.2 |
| Heat stress | `6+sr(16)×2` | 6.1 |
| Cyclone | `4+sr(21)×3` | 5.5 |
| Sea level | `7+sr(23)×2` | 7.4 |
| Wildfire | `1+sr(29)×5` | 4.4 |
| **Composite** | mean×10 | **58.8** |

Downstream: `gdpAtRisk2030Pct = 1+58.8×0.3+sr(30)×4 = 21.1%`; `gdpAtRisk2050Pct = 21.1×1.8+sr(31)×3
= 38.8%`; `infrastructureVulnerabilityScore = min(100, 58.8×8+sr(34)×25) = 100` (hits the cap);
`adaptationCapacity = clamp(5,95, 95−58.8×6−15+sr(35)×20) = 5` (hits the floor, since regionIdx=6≥4
applies the −15 South-Asia/MENA penalty term); `climateVulnerabilityIndex = 100−5 = 95`. RCP splits:
2.6→12.7%, 4.5→17.9%, 8.5→29.5%.

**Notable defect surfaced by this example:** `agricultureExposurePct = 10+58.8×2+sr(32)×15 =
129.4%` — a percentage exceeding 100%, because the formula has no upper clamp (unlike
`infrastructureVulnerabilityScore`, which is explicitly `min(100, …)`). Any country with
`compositePhysicalRisk` above roughly 45 combined with a high noise draw can produce an
out-of-range agriculture-exposure percentage.

### 7.5 Companion analytics

- **NGFS Alignment tab** — country GDP-impact trajectories to 2050 across the 5 standard NGFS
  scenarios, with correctly-ordered severity multipliers (see §7.3.4).
- **Infrastructure Vulnerability tab** — 20-country × 5-sector heatmap, each sector a ±15-point
  scatter around the country composite — descriptive dispersion, not sector-specific hazard modelling
  (e.g. ports are not specifically flood/sea-level-weighted despite being the most exposed sector in
  reality).
- **Country Profiles** — per-country detail combining all of the above fields plus loss-and-damage
  and adaptation-financing-need dollar estimates.

### 7.6 Data provenance & limitations

- **Synthetic core, partial real overlay.** Hazard scores and every downstream derived field are
  `sr()`-seeded; EM-DAT hazard frequency and ND-GAIN readiness/vulnerability are real data wired in
  for two output fields per country, but — as documented in §7.3 — the overlay does not propagate
  to dependent fields, producing an internally inconsistent record for overlaid countries (real
  composite risk, but synthetic-composite-derived GDP-at-risk/infrastructure/RCP fields).
- `agricultureExposurePct` can exceed 100% (see worked example) — no upper clamp exists.
- The guide's stated 0.4/0.35/0.25 weighted-blend formula for physical vulnerability is not
  implemented; the actual composite is an unweighted mean of the six hazards.
- RCP 6.0 is referenced in some sovereign guides but not modelled here — only RCP 2.6/4.5/8.5 splits
  exist, all derived as fixed multiples of the 2030 GDP-at-risk figure rather than independent
  scenario runs.

**Framework alignment:** IPCC AR6 WG2 (hazard taxonomy — flood/drought/heat/cyclone/SLR/wildfire —
real categories, synthetic severity); ND-GAIN Country Index (real readiness/vulnerability data,
partially wired, not propagated downstream); NGFS Phase-consistent scenario set (5 real scenario
names with a correctly-ordered synthetic severity ranking); World Bank Climate Change Knowledge
Portal / Swiss Re Institute (named in guide as sources, not ingested).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Replace the linear, hand-tuned `compositePhysicalRisk → GDP-at-risk/infrastructure` chain with a
defensible, catastrophe-model-style sovereign physical-risk engine usable for sovereign bond
screening and NGFS-scenario capital-impact estimation.

### 8.2 Conceptual approach

Mirror **Swiss Re CatNet / Munich Re NATHAN** country hazard-frequency-severity modelling combined
with **World Bank Climate Change Knowledge Portal** exposure layers: for each hazard, combine a
peril-specific *frequency* (return-period curve) with a *vulnerability* (damage) function applied to
exposed GDP/population/infrastructure stock, rather than an unweighted mean of 0–10 hazard scores.
This mirrors how (1) catastrophe models decompose loss as `Hazard × Exposure × Vulnerability`, and
(2) **NGFS scenario damage functions** (Kalkuhl-Wenz, Burke-Hsiang-Miguel) translate temperature
pathways into country-level GDP damage, giving RCP/NGFS splits real scenario grounding instead of
fixed multipliers of a single 2030 estimate.

### 8.3 Mathematical specification

```
Per-peril annual expected loss (% GDP):
  EL_peril,c = Frequency_peril,c × Σ_exposure (ExposedValue × Vulnerability(severity))

Composite physical risk (0-100):
  PhysRisk_c = 100 × Σ_peril EL_peril,c / GDP_c                      // damage-based, not score-averaged

GDP-at-risk under NGFS scenario s, year y:
  GDPatRisk_c,s,y = DamageFunction_s(ΔT_y) × Sensitivity_c            // Burke-Hsiang-Miguel-style quadratic in ΔT

Adaptation-adjusted loss:
  NetLoss_c = GrossLoss_c × (1 − AdaptationEffectiveness_c)
```

| Parameter | Calibration source |
|---|---|
| Peril frequency curves | EM-DAT historical event frequency by country/peril (free, already partially ingested) |
| Vulnerability/damage functions | World Bank GFDRR peril-specific damage curves; IPCC AR6 WG2 regional chapters |
| NGFS damage function | Burke, Hsiang & Miguel (2015) quadratic temperature-growth relationship, or NGFS's own damage function set (Phase IV) |
| Adaptation effectiveness | ND-GAIN readiness sub-index, mapped to a 0–40% loss-reduction range per World Bank CCDR studies |

### 8.4 Data requirements

| Field | Source | Already in platform? |
|---|---|---|
| Peril frequency | EM-DAT (free) | Yes — `EMDAT_PHYSICAL_HAZARD_FREQUENCY` |
| Exposed GDP/population/infra stock | World Bank WDI + national infrastructure inventories | Partial |
| Damage/vulnerability functions | World Bank GFDRR, NGFS Phase IV | No |
| ND-GAIN readiness (adaptation proxy) | Notre Dame GAIN (free) | Yes — `ND_GAIN_COUNTRY_SCORES` |

### 8.5 Validation & benchmarking plan

- Backtest expected-loss estimates against EM-DAT's own recorded historical economic losses
  (`economicLossesAvgBn`, already present in the seed) for the same countries — target within 2× of
  historical average annual loss.
- Compare NGFS GDP-at-risk output against published NGFS Phase IV country-level GDP-impact tables
  for the 5 NGFS_ECONOMIES already modelled.
- Sensitivity: vary adaptation-effectiveness assumption ±10pp, confirm net-loss ranking stability.

### 8.6 Limitations & model risk

- Country-level aggregation masks sub-national hazard concentration (e.g. coastal vs. inland
  provinces) — acceptable for sovereign-level screening, not asset-level underwriting.
- Damage functions are contested in the climate-economics literature (Burke-Hsiang-Miguel vs.
  Kalkuhl-Wenz diverge materially at high ΔT) — disclose which function is used and provide a
  sensitivity band, not a single point estimate.
- Always clamp derived percentage fields to [0,100] — the current code's uncapped
  `agricultureExposurePct` (§7.4) is exactly the failure mode this specification must avoid.
