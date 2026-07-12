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
