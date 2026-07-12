# Agricultural Climate Risk
**Module ID:** `agricultural-climate-risk` · **Route:** `/agricultural-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-DG1 · **Sprint:** DG

## 1 · Overview
Quantifies climate physical risks to agricultural assets and supply chains using crop yield models, water stress indices, and extreme weather event databases. Calculates farm-level Expected Annual Loss (EAL), crop insurance adequacy gaps, and agricultural lender portfolio exposure.

> **Business value:** Essential for agricultural lenders, crop insurers, food companies with Scope 3 supply chain exposure, and sovereign risk managers in food-dependent economies. Provides TCFD physical risk metrics for agricultural portfolios and supports TNFD nature-related disclosure for land-use intensive sectors.

**How an analyst works this module:**
- Select crop type, country and agricultural zone
- Apply climate hazard scores (drought, flood, heat, frost)
- Calculate yield loss distribution by SSP scenario
- Assess crop insurance adequacy gap
- Generate agricultural lender portfolio risk report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ADAPT_MEASURES`, `CROPS`, `CROP_SCI`, `Card`, `HAZARDS`, `Kpi`, `NAMES`, `PORTFOLIO`, `REGIONS`, `SCENARIOS`, `SCEN_COLORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ADAPT_MEASURES` | 9 | `capex`, `yieldRecovery`, `roi` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt0` | `v => Number(v).toLocaleString('en-GB', { maximumFractionDigits: 0 });` |
| `REGIONS` | `['South Asia','Sub-Saharan Africa','Latin America','East Asia','Europe','North America','MENA','Oceania'];` |
| `yieldByScenario` | `useMemo(() => CROPS.map(crop => {` |
| `yieldTrajectory` | `useMemo(() => [2025,2030,2040,2050,2060,2080].map((yr, i) => ({` |
| `hazardMatrix` | `useMemo(() => REGIONS.map((reg, ri) => {` |
| `stressData` | `useMemo(() => SCENARIOS.map((sc, si) => ({` |
| `avg` | `+(PORTFOLIO.reduce((s,a) => s+a[key], 0)/PORTFOLIO.length).toFixed(1);` |
| `comp` | `Math.round(a.physRisk*0.6 + a.transitionRisk*0.4);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ADAPT_MEASURES`, `CROPS`, `HAZARDS`, `NAMES`, `REGIONS`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Crop Yield Loss by 2050 | — | IPCC AR6 WGII Chapter 5 | Average global crop yield losses per decade under RCP4.5 — accelerates under RCP8.5 |
| Agricultural Water Stress | — | WRI AQUEDUCT 2023 | Agriculture uses 70% of global freshwater — water stress is primary climate risk for irrigated crops |
| Crop Insurance Protection Gap | — | Swiss Re Sigma Agricultural 2023 | Only 35% of global agricultural climate losses are covered by insurance |
- **Farm-level GIS data (crop type, area, yield history)** → EAL calculation → **Crop-level expected annual loss by hazard**
- **AQUEDUCT water stress scores by basin** → Water risk assessment → **Irrigated agriculture water availability risk under 2030/2050**
- **Crop price indices + insurance product data** → Insurance gap analysis → **Uninsured climate loss exposure by crop and region**

## 5 · Intermediate Transformation Logic
**Methodology:** Agricultural Climate EAL
**Headline formula:** `EAL_crop = Σ [P(event_i) × YieldLoss_i × Price_i × Area_i]; DroughtExposure = AIR × WaterStressScore`

Integrates crop vulnerability functions with multi-hazard exceedance probability curves; AI Aridity Index combined with AQUEDUCT water stress quantifies compound drought-heat exposure

**Standards:** ['IPCC AR6 WGII Chapter 5 — Food, Fibre and Other Ecosystem Products', 'FAO GAEZ v4 Crop Modelling', 'World Resources Institute AQUEDUCT 3.0', 'NGFS Scenarios Agricultural Sector']
**Reference documents:** IPCC AR6 WGII Chapter 5 — Food, Fibre and Other Ecosystem Products; FAO Global Agro-Ecological Zones v4 (GAEZ v4); World Resources Institute AQUEDUCT 3.0 Water Risk Atlas; NGFS Scenarios in the Agricultural Sector (2022)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide (EP-DG1) specifies a physical **Expected Annual
> Loss** integral `EAL_crop = Σ[P(event_i) × YieldLoss_i × Price_i × Area_i]` and a drought
> composite `DroughtExposure = AIR × WaterStressScore`. **Neither is computed.** No exceedance-
> probability curve, crop price, planted area or aridity index is present. Yield changes,
> physical-risk scores and portfolio losses are all **seeded random draws** presented directly.
> Sections below document what the code actually renders.

### 7.1 What the module computes

Seven tabs over a synthetic universe of 48 agricultural regions (`PORTFOLIO`), each generated
from the platform PRNG `sr(s)=frac(sin(s+1)×10⁴)`:

| Field | Formula | Meaning |
|---|---|---|
| `baselineYield` | `2.5 + sr·8` | t/ha baseline |
| `yieldChange26` | `−5 − sr·12` | % yield Δ under RCP 2.6 (−5…−17%) |
| `yieldChange45` | `−8 − sr·18` | RCP 4.5 (−8…−26%) |
| `yieldChange85` | `−14 − sr·22` | RCP 8.5 (−14…−36%) |
| `heatStressDays` | `12 + sr·72` | days above crop threshold |
| `precipChange` | `−22 + sr·52` | % precipitation Δ |
| `droughtFreq` | `1 + sr·7` | events/decade |
| `physRisk` | `20 + sr·72` | 20–92 physical-risk score |
| `loanExposure` | `5 + sr·90` | $M lender exposure |
| `ltv` | `40 + sr·38` | loan-to-value % |

The RCP ordering is *enforced by construction* (each scenario's base and slope worsen), so the
qualitative message — deeper yield loss under higher forcing — is guaranteed but not derived
from any climate model.

### 7.2 Parameterisation — the science tables

Two hand-authored reference tables carry genuine agronomic content (used descriptively, not in
loss math):

**Crop science (`CROP_SCI`, 10 crops):** heat-stress threshold, CO₂-fertilisation yield uplift,
water need (mm/season), optimum temperature. Examples — Coffee heatThresh 30°C/optTemp 20°C
(flagged VERY HIGH vulnerability), Cotton heatThresh 42°C, Soy CO₂ uplift +10%, Rice water
need 1,200 mm. Vulnerability label: heatThresh <33 → VERY HIGH, <37 → HIGH, else MODERATE.
These values are broadly consistent with FAO/agronomic literature (C3 crops like soy/wheat show
larger CO₂ response than C4 maize; coffee/cocoa are heat-sensitive).

**Adaptation measures (`ADAPT_MEASURES`, 8):** capex ($/ha-equivalent), yield recovery (pp),
ROI %. Highest ROI: Weather Derivatives 72%, Climate Insurance 68%, Crop Diversification 55%;
lowest: Agroforestry 22%. ROI figures are static seed values, not computed from capex/recovery.

### 7.3 Calculation walkthrough

- **Overview KPIs** over the filtered set: `avgYield` (mean of the selected scenario's yield-Δ
  column), `avgHeat`, `avgRisk`, `totalExposure = Σ loanExposure`, `highRisk = count(physRisk >
  65)`. Scenario key maps RCP 2.6/8.5 to their columns, everything else to RCP 4.5.
- **Yield-by-crop** averages each crop's three RCP columns across all regions of that crop.
- **Yield trajectory** (2025–2080) is a seeded declining fan: e.g.
  `RCP 8.5 = −6 − 4.8·i + sr·1.5` per time-step i — a synthetic path, not a GAEZ projection.
- **Hazard matrix** — 8 regions × 6 hazards, each cell `15 + sr·78`, a heatmap of independent
  draws (no hazard-model coupling).
- **Portfolio stress** — per RCP scenario:
  `expectedLoss = 2 + 3.2·si + sr·1.5`, `stressLoss = 5 + 6.8·si + sr·2.5`,
  `nplRate = 1.5 + 1.6·si + sr·0.8` (%) — monotone-increasing in scenario severity by design.

### 7.4 Worked example — filtered portfolio KPIs

Filter to Wheat under RCP 8.5. Suppose the wheat subset has 5 regions with `yieldChange85`
values [−22.1, −18.4, −30.7, −25.0, −16.9] and physRisk [70, 55, 88, 62, 48], loanExposure
[45, 30, 90, 60, 25]:

| KPI | Computation | Result |
|---|---|---|
| Avg yield Δ | (−22.1−18.4−30.7−25.0−16.9)/5 | **−22.6%** |
| High physical risk | count(physRisk > 65) → {70,88} | **2 regions** |
| Total exposure | 45+30+90+60+25 | **$250M** |

The dashboard would headline "−22.6% avg yield Δ (RCP 8.5), 2 high-risk regions, $250M
exposure" — all derived by simple aggregation of the seeded fields.

### 7.5 Data provenance & limitations

- **All region-level numbers are synthetic PRNG draws**; region *names* (Punjab India, Mato
  Grosso Brazil, Iowa USA, …) are real breadbaskets but the attached metrics are not sourced.
- The crop-science and adaptation-measure tables are hand-authored literature-plausible
  constants, not live FAO GAEZ / CGIAR outputs.
- **No EAL model:** the guide's probabilistic loss integral, drought×water-stress composite,
  crop price and planted area are entirely absent — "expected loss" and "NPL rate" are seeded
  scenario curves, not credit-risk computations.
- Hazard-matrix cells and yield trajectories are independent random draws, so a region can show
  high drought yet low soil-erosion with no physical correlation.
- Adaptation ROI is a static field, not `f(capex, yieldRecovery, price)` — no payback or NPV is
  computed for adaptation options.

### 7.6 Framework alignment

- **IPCC AR6 WGII Ch.5 (Food, Fibre, Ecosystems)** — the RCP-ordered yield-decline framing
  (larger losses under higher forcing, CO₂-fertilisation partially offsetting) reflects AR6's
  crop-model consensus; here it is imposed via seed structure rather than modelled.
- **FAO GAEZ v4** — the crop suitability parameters (heat threshold, optimum temperature, water
  need) mirror GAEZ's agro-climatic crop requirements, though GAEZ's spatial suitability engine
  is not run.
- **WRI Aqueduct 3.0** — cited for water stress; the module carries `precipChange`/`droughtFreq`
  fields but does not implement Aqueduct's baseline-water-stress indicator.
- **NGFS agricultural sector / TCFD scenarios** — the four-RCP portfolio stress tab
  (expected vs stressed loss, NPL rate) follows the TCFD/NGFS scenario-analysis presentation for
  lenders, with synthetic loss rates standing in for a scenario-conditioned credit model.
- **CGIAR CCAFS** — referenced for climate-smart adaptation options; the adaptation-finance tab
  lists CCAFS-style measures with illustrative ROI.

## 9 · Future Evolution

### 9.1 Evolution A — Probabilistic crop EAL with real hazard and price inputs (analytics ladder: rung 1 → 3)

**What.** Per the §7 mismatch flag, the guide's EAL integral
`EAL_crop = Σ[P(event_i) × YieldLoss_i × Price_i × Area_i]` and the drought composite
`DroughtExposure = AIR × WaterStressScore` are **not computed** — the 48 regions' yield
changes, physical-risk scores and portfolio losses are all seeded PRNG draws whose only real
structure is the RCP ordering imposed by construction. The genuine agronomic content lives in
two hand-authored tables (CROP_SCI heat thresholds/CO₂ uplift; ADAPT_MEASURES). Evolution A
builds the real EAL: crop-vulnerability functions × hazard exceedance-probability curves ×
commodity price × planted area, plus the AQUEDUCT-based drought×water-stress composite the
guide specifies — the platform already has a physical-risk digital twin (wildfire/flood/
cyclone grids) to source hazard probabilities.

**How.** `POST /api/v1/agri-climate/eal` (crop, area, coordinates, SSP → EAL by hazard,
insurance gap) sourcing hazard exceedance from the existing `ref_*_zones` PostGIS grids and
WRI Aqueduct water-stress scores; CROP_SCI vulnerability parameters become the damage
functions; adaptation ROI computed as `f(capex, yieldRecovery, price)` instead of a static
seed field. Rung 3 calibration: backtest modelled yield losses against FAO GAEZ historical
anomalies and Swiss Re Sigma agricultural loss ratios (the 35%-insured anchor the page cites).

**Prerequisites (hard).** Purge the pervasive `sr()` draws per the no-fabricated-random
guardrail; source commodity prices and planted-area data (currently entirely absent);
reuse the digital-twin hazard grids rather than re-deriving. **Acceptance:** two regions with
identical crop but different Aqueduct water stress produce different drought exposure; EAL
scales with planted area and price; adaptation ROI recomputes from capex and recovery.

### 9.2 Evolution B — Agri physical-risk copilot on the loan book (LLM tier 1)

**What.** A chat panel answering "why is coffee flagged VERY HIGH vulnerability?" (heatThresh
30°C < 33 rule from CROP_SCI), "which regions are high physical risk under RCP 8.5?", and
"what's the insurance protection gap for this wheat portfolio?" — grounded in the page's
computed KPIs (avg yield Δ, high-risk count, total exposure) and the crop-science table. Since
the loss numbers are synthetic scenario curves today, the copilot must state that expected-
loss and NPL figures are seeded scenario paths, not credit-risk computations (§7.5).

**How.** Tier-1 roadmap pattern: §7.1 field table, §7.2 crop-science parameters and §7.6
framework alignment (IPCC AR6 WGII Ch.5, FAO GAEZ, WRI Aqueduct, NGFS) embedded as the module
corpus; page state (crop/scenario filter, portfolio subset) passed as context so answers cite
the actual on-screen aggregates; served via `POST /api/v1/copilot/agricultural-climate-risk/
ask` with a refusal path for un-computed asks. After Evolution A, graduates to tier 2 by
tool-calling `POST /agri-climate/eal` for real per-portfolio loss what-ifs.

**Prerequisites.** Atlas corpus embedded (roadmap D3); grounding carries the §7 mismatch note.
**Acceptance:** cited aggregates match the §7.4 worked example (−22.6% avg yield Δ, 2 high-
risk regions, $250M exposure); asking for a probabilistic EAL before Evolution A returns a
refusal naming the absent exceedance-curve/price/area inputs.