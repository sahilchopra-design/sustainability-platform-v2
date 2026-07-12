# Sovereign Physical Risk
**Module ID:** `sovereign-physical-risk` · **Route:** `/sovereign-physical-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Country-level physical hazard exposure and vulnerability assessment across flood, heat, drought, cyclone and sea-level rise using multi-model IPCC scenario projections.

> **Business value:** Provides multi-hazard, multi-scenario physical climate vulnerability scoring for sovereign issuers supporting sovereign bond risk management.

**How an analyst works this module:**
- Score each country on five physical hazard dimensions using IPCC AR6 regional projections.
- Assess economic and population sensitivity: coastal population share, agricultural GDP, urban heat island.
- Measure adaptive capacity: infrastructure quality, institutional readiness, fiscal space for adaptation.
- Aggregate to physical vulnerability index and map to sovereign bond portfolio exposure.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHART_COLORS`, `COUNTRIES_PHY`, `COUNTRY_NAMES`, `HAZARDS`, `INFRA_COUNTRIES`, `INFRA_SECTORS`, `NGFS_DATA`, `NGFS_ECONOMIES`, `NGFS_SCENARIOS`, `NGFS_YEARS`, `REGIONS_LIST`, `REGION_MAP_PHY`, `SCENARIO_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS_LIST` | `['Africa','Asia-Pacific','Europe','Latin America','Middle East','North America','South Asia'];` |
| `COUNTRIES_PHY` | `COUNTRY_NAMES.map((name,i)=>{` |
| `floodBase` | `regionIdx===6?6+sr(s)*3:regionIdx===1?5+sr(s+1)*4:regionIdx===0?4+sr(s+2)*4:2+sr(s+3)*5;` |
| `droughtBase` | `regionIdx===4?7+sr(s+4)*2:regionIdx===0?5+sr(s+5)*3:regionIdx===6?4+sr(s+6)*3:1+sr(s+7)*5;` |
| `heatBase` | `regionIdx===4?8+sr(s+8)*1.5:regionIdx===6?6+sr(s+9)*2:regionIdx===0?5+sr(s+10)*3:1+sr(s+11)*5;` |
| `cycloneBase` | `regionIdx===1?6+sr(s+12)*3:regionIdx===3?5+sr(s+13)*3:regionIdx===6?4+sr(s+14)*3:0.5+sr(s+15)*4;` |
| `seaBase` | `regionIdx===6?7+sr(s+16)*2:regionIdx===1?5+sr(s+17)*3:regionIdx===0?3+sr(s+18)*4:0.5+sr(s+19)*4;` |
| `wildfireBase` | `regionIdx===2?4+sr(s+20)*3:regionIdx===1?3+sr(s+21)*4:1+sr(s+22)*5;` |
| `compositePhysicalRisk` | `+((floodRisk+droughtRisk+heatStressRisk+cycloneRisk+seaLevelRiskRating+wildfireRisk)/6*10).toFixed(1);` |
| `gdpAtRisk2030Pct` | `+(1+compositePhysicalRisk*0.3+sr(s+23)*4).toFixed(1);` |
| `gdpAtRisk2050Pct` | `+(gdpAtRisk2030Pct*1.8+sr(s+24)*3).toFixed(1);` |
| `agricultureExposurePct` | `+(10+compositePhysicalRisk*2+sr(s+25)*15).toFixed(1);` |
| `coastalPopExposedM` | `+(sr(s+26)*80+0.5).toFixed(1);` |
| `infrastructureVulnerabilityScore` | `+Math.min(100,(compositePhysicalRisk*8+sr(s+27)*25)).toFixed(1);` |
| `adaptationCapacity` | `+(95-(compositePhysicalRisk*6)-(regionIdx>=4?15:0)+sr(s+28)*20).toFixed(1);` |
| `climateVulnerabilityIndex` | `+(Math.min(100,100-adaptationCapacity)).toFixed(1);` |
| `scenario2030RCP26` | `+(gdpAtRisk2030Pct*0.6).toFixed(1);` |
| `scenario2030RCP45` | `+(gdpAtRisk2030Pct*0.85).toFixed(1);` |
| `scenario2030RCP85` | `+(gdpAtRisk2030Pct*1.4).toFixed(1);` |
| `lossAndDamageEstimateBnUSD` | `+(compositePhysicalRisk*sr(s+29)*20+1).toFixed(1);` |
| `adaptationFinancingNeedBnUSD` | `+(compositePhysicalRisk*sr(s+30)*15+0.5).toFixed(1);` |
| `infraScores` | `INFRA_SECTORS.reduce((a,sec,si)=>({...a,[sec]:+Math.min(100,(infrastructureVulnerabilityScore+sr(s+31+si)*30-15)).toFixed(1)}),{});` |
| `_PHYS_MAP` | `Object.fromEntries((EMDAT_PHYSICAL_HAZARD_FREQUENCY\|\|[]).map(c=>[c.country,c]));` |
| `_GAIN_PHY` | `Object.fromEntries((ND_GAIN_COUNTRY_SCORES\|\|[]).map(c=>[c.country,c]));` |
| `NGFS_DATA` | `NGFS_ECONOMIES.map((eco,ei)=>{` |
| `selNGFSData` | `useMemo(()=>NGFS_DATA.find(d=>d.economy===selNGFS)\|\|NGFS_DATA[0],[selNGFS]);  /* ── Tab 0: Risk Overview ────────────────────────────────────────────────── */ const renderOverview=()=>{ const topRisk=[...COUNTRIES_PHY].sort((a,b)=>b.compositePhysicalRisk-a.compositePhysicalRisk).slice(0,15).map(c=>({name:c.name.length>10?c.name.slice(0,10` |
| `byRegion` | `REGIONS_LIST.map(r=>{` |
| `top25` | `[...COUNTRIES_PHY].sort((a,b)=>b.compositePhysicalRisk-a.compositePhysicalRisk).slice(0,25);` |
| `hazardAvg` | `HAZARDS.map(h=>({hazard:h,global:+(COUNTRIES_PHY.reduce((s,c)=>s+c[h.toLowerCase().replace(' ','')+'Risk']\|\|s+c[Object.keys(c).find(k=>k.includes(h.toLowerCase().split(' ')[0]))\|\|'floodRisk'],0)/cphyLen).toFixed(1)}));` |
| `globalHazardAvg` | `HAZARDS.map(h=>({name:h,avg:+(COUNTRIES_PHY.reduce((s,c)=>s+c[hazardKey[h]],0)/cphyLen).toFixed(1)}));` |
| `gdpData` | `[...COUNTRIES_PHY].sort((a,b)=>b.gdpAtRisk2050Pct-a.gdpAtRisk2050Pct).slice(0,18).map(c=>({` |
| `scatterData` | `COUNTRIES_PHY.map(c=>({x:c.adaptationCapacity,y:c.gdpAtRisk2050Pct,z:c.lossAndDamageEstimateBnUSD,name:c.name}));` |
| `infraBar` | `INFRA_COUNTRIES.map(c=>({name:c.name.length>9?c.name.slice(0,9)+'..':c.name,...INFRA_SECTORS.reduce((a,sec)=>({...a,[sec]:c.infraScores[sec]}),{})}));` |
| `scenData` | `NGFS_SCENARIOS.map(scen=>({` |
| `areaData` | `NGFS_YEARS.map((yr,yi)=>({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHART_COLORS`, `COUNTRY_NAMES`, `HAZARDS`, `INFRA_SECTORS`, `NGFS_ECONOMIES`, `NGFS_SCENARIOS`, `NGFS_YEARS`, `REGIONS_LIST`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Hazards Modelled | — | IPCC AR6 | Physical hazard types assessed: flood, heat stress, drought, cyclone, and sea-level rise. |
| Highest Exposed Country | — | Calculated | Country with highest composite physical vulnerability index across all five hazards. |
| RCP Scenarios | — | IPCC | Emission scenarios assessed: RCP 2.6, RCP 4.5, RCP 8.5 for 2030 and 2050 horizons. |
- **IPCC AR6 hazard projections, ND-GAIN, World Bank CCPK, Swiss Re data** → Hazard scoring, vulnerability aggregation, RCP scenario comparison → **Physical vulnerability indices, hazard heatmaps, portfolio physical risk reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Physical Vulnerability Index
**Headline formula:** `(Hazard Exposure × 0.4) + (Sensitivity × 0.35) + (1 – Adaptive Capacity) × 0.25`

Country physical climate vulnerability combining multi-hazard exposure, economic sensitivity, and adaptive capacity deficit.

**Standards:** ['IPCC AR6', 'ND-GAIN', 'World Bank CCDR']
**Reference documents:** IPCC AR6 Working Group II Regional Chapters; ND-GAIN Country Index Physical Risk Module; World Bank Climate Change Knowledge Portal; Swiss Re Institute Country Risk Scoring

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Propagate the real-data overlay and implement the weighted vulnerability index (analytics ladder: rung 1 → 3)

**What.** This module is partway to grounded but has a documented internal inconsistency: hazard scores are region-biased `sr()` draws (a genuine design choice — South Asia flood base is highest, Middle East heat base is highest), the composite is an **unweighted mean of six hazards** rather than the guide's `(Exposure×0.4)+(Sensitivity×0.35)+(1−Adaptive Capacity)×0.25`, and — critically per §7.6 — once `compositePhysicalRisk` is overwritten with real EM-DAT/ND-GAIN data, the **downstream fields don't recompute**: `gdpAtRisk2030Pct`, infrastructure vulnerability, and RCP splits stay frozen at values derived from the pre-overlay synthetic composite. Plus `agricultureExposurePct` can exceed 100% (no clamp). Evolution A makes the real overlay flow through and implements the actual weighted index.

**How.** (1) Recompute all downstream fields from the EM-DAT/ND-GAIN-overlaid composite so an overlaid country's GDP-at-risk and infrastructure scores are consistent with its real hazard data — the highest-value fix. (2) Implement the guide's three-term weighted vulnerability index (hazard exposure, economic sensitivity via coastal population/agri-GDP, adaptive capacity via ND-GAIN readiness) replacing the unweighted hazard mean. (3) Source hazard severity from IPCC AR6 WG2 regional projections rather than hand-tuned regional bases. (4) Clamp `agricultureExposurePct` at 100%. (5) Add the RCP scenario runs as independent projections rather than fixed multiples of the 2030 figure.

**Prerequisites.** IPCC AR6 regional hazard data and coastal-population/agri-GDP sensitivity inputs; EM-DAT/ND-GAIN are already partially wired. **Acceptance:** an overlaid country's GDP-at-risk recomputes from its real composite; the vulnerability index uses the three-term weighting; no exposure percentage exceeds 100%; RCP scenarios are independent runs.

### 9.2 Evolution B — Sovereign physical-risk copilot (LLM tier 1)

**What.** A copilot for the sovereign-bond risk manager: "which hazards drive this country's physical vulnerability?", "how does GDP-at-risk change from 2030 to 2050 under RCP 8.5?", "rank my sovereign portfolio by adaptive-capacity deficit" — answered from the (Evolution-A consistent) composite, the six-hazard decomposition, and the ND-GAIN readiness data.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sovereign-physical-risk/ask`, corpus = this Atlas record (the hazard taxonomy, the vulnerability index, IPCC AR6 / ND-GAIN framework notes) plus live page state. Hazard-driver explanations decompose the composite into the six IPCC AR6 hazards; scenario answers narrate the RCP projections; portfolio rankings narrate deterministic sorts. The copilot flags the region-biased nature of hazard scores honestly.

**Prerequisites (hard).** Evolution A's overlay propagation — narrating GDP-at-risk figures that are frozen at pre-overlay synthetic values for the very countries that have real data would present the module's internal inconsistency as an authoritative answer. **Acceptance:** every hazard/GDP-at-risk figure traces to the consistent computed record; scenario answers cite the RCP run; a country outside the 80-country set returns a refusal.