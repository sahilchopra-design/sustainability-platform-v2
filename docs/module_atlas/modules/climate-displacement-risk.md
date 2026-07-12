# Climate Displacement Risk Analytics
**Module ID:** `climate-displacement-risk` · **Route:** `/climate-displacement-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-DI4 · **Sprint:** DI

## 1 · Overview
Quantifies financial exposure to climate-driven population displacement including migration flows, stranded real estate, sovereign fiscal stress, and remittance disruption. Models climate migration scenarios using IPCC SSP pathways and World Bank GROUNDSWELL projections.

> **Business value:** Essential for sovereign debt analysts modelling social cohesion risk, EM equity investors in real estate and financial services, and development finance institutions programming climate adaptation. Directly linked to V20 agenda and UNHCR climate displacement finance mechanisms.

**How an analyst works this module:**
- Select country or region for displacement risk assessment
- Apply GROUNDSWELL scenario to migration projections
- Calculate stranded real estate and fiscal cost
- Model remittance disruption from climate-forced migration
- Generate UNHCR/IOM-aligned climate displacement risk report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BLUE`, `COUNTRY_NAMES`, `DISPLACEMENT_COUNTRIES`, `DRIVERS`, `HIST_YEARS`, `INDIGO`, `PURPLE`, `REGIONS`, `RISK_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Sub-Saharan Africa', 'South Asia', 'Southeast Asia', 'MENA', 'Latin America', 'Pacific Islands', 'East Africa', 'Central America'];` |
| `DRIVERS` | `['Sea Level', 'Drought', 'Flood', 'Heat', 'Conflict-Climate'];` |
| `currentDisplacedM` | `+(0.1 + sr(i * 7) * 9.9).toFixed(2);` |
| `displacementRiskScore` | `Math.round(10 + sr(i * 11) * 85);` |
| `tempMultiplier` | `1 + (tempScenario - 1.5) * 0.15;` |
| `financeBoost` | `financeTarget / 100;` |
| `totalDisplaced` | `filtered.reduce((s, c) => s + c.currentDisplacedM, 0);` |
| `totalProjected2040` | `filtered.reduce((s, c) => s + c.projected2040M * tempMultiplier, 0);` |
| `avgAdaptFunding` | `filtered.length ? filtered.reduce((s, c) => s + c.adaptationFunding * financeBoost, 0) / filtered.length : 0;` |
| `refugeePct` | `filtered.length ? (filtered.filter(c => c.climateRefugeeRecognition).length / filtered.length) * 100 : 0;` |
| `scatterData` | `filtered.map(c => ({` |
| `driverBreakdown` | `DRIVERS.map(d => ({` |
| `globalTrend` | `HIST_YEARS.map((yr, idx) => {` |
| `baseFactor` | `0.4 + idx * 0.1;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRY_NAMES`, `DRIVERS`, `HIST_YEARS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Internal Climate Migrants by 2050 | — | World Bank GROUNDSWELL 2021 | 216M internal climate migrants projected by 2050 under moderate scenario — up to 1.2Bn under high scenario |
| Climate Displacement 2022 | — | IDMC Global Report 2023 | New internal displacements from climate/weather disasters in 2022 — 8× conflict-related |
| Remittance-Climate Risk | — | World Bank Migration and Development 2023 | 45 developing countries depend on remittances >5% of GDP — climate migration disrupts sending-country income |
- **IDMC displacement event database by country/hazard** → Displacement probability calculation → **Annual displacement events and affected population by scenario**
- **World Bank GROUNDSWELL migration scenarios** → Long-term migration projections → **Internal migration flows by corridor and decade to 2050**
- **Real estate and remittance data by sending country** → Financial impact modelling → **Stranded asset value + remittance disruption cost by climate scenario**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Migration Financial Risk
**Headline formula:** `DisplacementRisk = P(climate_event) × PopulationExposed × MigrationPropensity × FinancialImpact; RemittanceDisruption = RemittanceFlow × DisplacementShare × IncomeShock`

Migration propensity combines climate hazard severity, adaptive capacity, and mobility constraints; financial impact aggregates abandoned assets, fiscal cost, and remittance reduction

**Standards:** ['World Bank GROUNDSWELL 2021', 'IPCC AR6 WGII Chapter 7 — Health, Wellbeing and Changing Disease Dynamics', 'UNHCR Climate Displacement Report 2023', 'IOM World Migration Report 2024']
**Reference documents:** World Bank GROUNDSWELL: Preparing for Internal Climate Migration (2021); IDMC Global Report on Internal Displacement 2023; UNHCR Climate Change and Disaster Displacement 2023; IPCC AR6 WGII Chapter 7 — Health, Wellbeing and Changing Disease Dynamics

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry specifies a compound displacement-risk
> formula `DisplacementRisk = P(climate_event) × PopulationExposed × MigrationPropensity ×
> FinancialImpact` and `RemittanceDisruption = RemittanceFlow × DisplacementShare × IncomeShock`.
> **Neither formula is implemented.** In the code, `displacementRiskScore` is a single `sr()`-seeded
> number (`round(10 + sr(i·11)×85)`), and displacement/remittance/funding fields are independent
> seeded draws. The module is a **displacement-risk dashboard over 65 seeded countries** with a real
> temperature-scenario multiplier and finance what-if, but no probabilistic displacement model. The
> sections below document the code.

### 7.1 What the module computes

65 countries (real names) with `sr()`-seeded attributes, plus two genuine on-page levers — a
temperature multiplier and an adaptation-finance boost:

```
tempMultiplier   = 1 + (tempScenario − 1.5) × 0.15
financeBoost     = financeTarget / 100
totalDisplaced   = Σ currentDisplacedM
totalProjected2040= Σ projected2040M × tempMultiplier
avgAdaptFunding  = Σ (adaptationFunding × financeBoost) / N
refugeePct       = count(climateRefugeeRecognition) / N × 100
```

The projection scaling is the only real logic: higher warming (`tempScenario`) linearly inflates
2040/2060 displacement projections at 15 % per °C above 1.5 °C.

### 7.2 Parameterisation / synthetic country generation

Every quantitative field is `sr()`-seeded (real country names, fabricated numbers):

| Field | Generation | Range |
|---|---|---|
| `currentDisplacedM` | `0.1 + sr(i·7)×9.9` | 0.1–10 M |
| `projected2040M` | `currentDisplacedM × (1.5 + sr(i·13)×3.5)` | 1.5–5× current |
| `projected2060M` | `currentDisplacedM × (2.5 + sr(i·17)×7)` | 2.5–9.5× current |
| `displacementRiskScore` | `round(10 + sr(i·11)×85)` | 10–95 |
| `adaptationFunding` | `0.05 + sr(i·19)×4.95` | $0.05–5 Bn |
| `socialCohesionRisk` / `hostCountryCapacity` | `1 + sr()×9` | 1–10 |
| `remittanceGdpPct` | `1 + sr(i·37)×29` | 1–30 % |
| `climateRefugeeRecognition` | `sr(i·41) > 0.6` | boolean |
| `region` / `driver` | `i % REGIONS.length` / `i % DRIVERS.length` | round-robin |

`tempMultiplier` slope (0.15/°C) and `financeBoost` are the only non-seeded constants.

### 7.3 Calculation walkthrough

1. Filters slice `DISPLACEMENT_COUNTRIES` by region / risk band / refugee recognition.
2. `getRiskLabel(score)` bins the seeded score into Low/Medium/High/Critical (25/50/75 thresholds).
3. `top15Projection` sorts by `projected2040M × tempMultiplier`.
4. `scatterData` plots adaptation funding (× boost) vs projected 2040 displacement.
5. `globalTrend` builds a 2010–2060 series with a linear `baseFactor = 0.4 + idx×0.1` and applies
   `tempMultiplier` to years ≥ 2025.
6. `driverBreakdown` counts countries and mean displacement per driver.

### 7.4 Worked example — projection under 2.5 °C

Country with `currentDisplacedM = 4.0`, `projected2040M = 12.0` (seeded), `adaptationFunding = 2.0`,
under `tempScenario = 2.5 °C`, `financeTarget = 150`:

| Step | Computation | Result |
|---|---|---|
| tempMultiplier | 1 + (2.5 − 1.5)×0.15 | 1.15 |
| financeBoost | 150/100 | 1.50 |
| Projected 2040 (adj) | 12.0 × 1.15 | **13.8 M** |
| Adaptation funding (adj) | 2.0 × 1.50 | **$3.0 Bn** |
| Risk band | score 60 → ≥ 50 | **High** |

Raising the scenario from 1.5 → 2.5 °C adds 15 % to every projection uniformly — a flat elasticity,
not a hazard- or region-specific response.

### 7.5 Data provenance & limitations

- **All 65 countries are synthetic**, generated by `sr(seed) = frac(sin(seed+1)×10⁴)`. Country names
  are real (Bangladesh, Somalia, Kiribati…) but displacement, funding, remittance and risk figures
  are fabricated.
- **The guide's displacement-risk and remittance formulas are absent** — risk is a single seeded
  score, not `P(event)×PopExposed×MigrationPropensity×FinancialImpact`.
- The temperature multiplier is a **flat 15 %/°C** applied identically to all countries and drivers.
- Displacement driver and region are assigned by round-robin (`i % len`), not by actual exposure.

**Framework alignment:** The page *references* World Bank GROUNDSWELL (internal climate migration
projections), IPCC AR6 WGII, UNHCR climate-displacement reporting, and IOM migration data as
conceptual anchors, but implements none of their models — displacement is seeded, not projected from
hazard × exposure × mobility. §8 specifies the production model.

## 8 · Model Specification — Climate Displacement & Remittance-Disruption Model

**Status: specification — not yet implemented in code.** The guide's compound displacement/remittance
formulas have no implementation (risk is `sr()`-seeded); this specifies them.

### 8.1 Purpose & scope
Project climate-driven displacement by country/region under warming scenarios, and estimate the
financial-sector and remittance impacts, for sovereign-risk and DFI adaptation-finance decisions.

### 8.2 Conceptual approach
A **hazard × exposure × mobility gravity model** in the spirit of World Bank GROUNDSWELL internal-
migration projections and IOM/UNHCR displacement accounting, coupled to a remittance-disruption
overlay. Benchmarks: GROUNDSWELL 2021 scenario projections and IPCC AR6 WGII migration assessment.

### 8.3 Mathematical specification
```
Hazard_c,s    = Σ_h w_h · Intensity_h,c(scenario s)                 (composite climate hazard)
Exposure_c    = PopulationInHazardZone_c
Mobility_c    = f(adaptiveCapacity_c, incomeConstraint_c, borderPolicy_c)   (0–1 propensity)
Displaced_c,s = Exposure_c · P(event_c,s) · Mobility_c
FinancialImpact_c = AbandonedAssets_c + FiscalCost_c + RemittanceLoss_c
RemittanceLoss_c  = RemittanceFlow_c · DisplacementShare_c · IncomeShock_c
DisplacementRisk_c= normalise( Displaced_c,s · FinancialImpact_c )
```
| Parameter | Source |
|---|---|
| Hazard intensity | ND-GAIN / WRI Aqueduct / IPCC AR6 by scenario |
| Population exposure | WorldPop / gridded population in hazard zones |
| Adaptive capacity | ND-GAIN readiness index |
| Remittance flow | World Bank KNOMAD remittance data |
| Displacement elasticity | GROUNDSWELL calibration |

### 8.4 Data requirements
Per-country hazard intensity by scenario, gridded population exposure, adaptive-capacity index,
remittance flows and GDP share, and asset/fiscal exposure. Country list and remittance-GDP % exist
as fields; the missing inputs are real hazard/exposure layers and remittance data.

### 8.5 Validation & benchmarking plan
Reconcile projected displacement against GROUNDSWELL country trajectories; backtest against observed
EM-DAT/IDMC displacement events; sensitivity-test to mobility elasticity and hazard weights; validate
remittance loss against KNOMAD crisis case studies.

### 8.6 Limitations & model risk
Migration is highly non-linear and policy-dependent; gravity models under-capture conflict-climate
interactions; remittance elasticity is uncertain. Conservative fallback: report displacement as a
scenario range and flag conflict-driver countries as model-out-of-scope.

## 9 · Future Evolution

### 9.1 Evolution A — Anchor to IDMC/GROUNDSWELL observed and projected data (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's compound model
(`DisplacementRisk = P(event) × PopExposed × MigrationPropensity × FinancialImpact`)
is unimplemented — `displacementRiskScore` is a single seeded draw, and the 65 real
country names carry independent random displacement/remittance/funding fields. Two
levers are genuine: the temperature multiplier and the finance what-if. Evolution A
re-bases on the two datasets the §5 reference list already names: IDMC's Global
Internal Displacement Database (annual disaster-displacement counts per country,
public) for observed baselines, and World Bank GROUNDSWELL projections (published
2050 internal-migration ranges per region/scenario) for the forward view — so
`currentDisplacedM` and `projected2040M` become sourced numbers, with the existing
temperature multiplier interpolating between GROUNDSWELL's pessimistic/inclusive
scenarios instead of scaling noise.

**How.** (1) `ref_displacement(country, year, disaster_displaced, source)` from IDMC
exports; `ref_groundswell(region, scenario, projected_2050_range)` from the published
report tables. (2) Remittance exposure from World Bank remittance-inflow data (public
API the platform already uses for WB indicators) — making
`RemittanceDisruption = Flow × DisplacementShare × IncomeShock` computable with two
sourced terms and one explicit assumption. (3) The composite risk score rebuilt from
these components with documented weights, or dropped — no more standalone seeded
score.

**Prerequisites (hard).** PRNG purge on country attributes; GROUNDSWELL is
region-level, so country downscaling must be explicit (population-weighted) and
labelled. **Acceptance:** Bangladesh's observed displacement traces to IDMC rows; the
2040 projection interpolates GROUNDSWELL bounds reproducibly; zero seeded country
fields remain.

### 9.2 Evolution B — Sovereign-exposure copilot (LLM tier 1)

**What.** A copilot for sovereign analysts: "what's the observed vs projected
displacement picture for Vietnam and what drives it?" (IDMC history + GROUNDSWELL
scenario + the driver taxonomy), "which of our sovereigns have high remittance
sensitivity to displacement?", "what does the V20/UNHCR finance mechanism context
mean for this exposure?" — retrieval and comparison over the sourced tables plus the
§5 policy corpus. Tier 1: the module's rebuilt value is curated projection data, not
a live engine.

**How.** Atlas record and the three reference tables as corpus; every displacement
figure cited with source and scenario; the copilot must keep observed (IDMC) and
projected (GROUNDSWELL) clearly separated in prose — conflating them is the classic
misuse of this data.

**Prerequisites (hard).** Evolution A first: today the honest answer to any country
question is that the number is seeded. **Acceptance:** country answers carry
source+year per figure; asked to predict displacement-driven default risk, the
copilot presents the components and declines the causal leap.