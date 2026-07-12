# Smart City Climate Finance
**Module ID:** `smart-city-climate-finance` · **Route:** `/smart-city-climate-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DM2 · **Sprint:** DM

## 1 · Overview
Analyses investment in smart city technologies — IoT sensors, AI energy management, smart grids, intelligent transport, and digital water systems — for climate resilience and decarbonisation. Models smart city ROI, energy savings, and GHG reduction co-benefits.

> **Business value:** Directly applicable to smart city technology investors, city CFOs evaluating digital infrastructure, and project finance teams for smart energy or transport. Provides quantitative ROI and GHG co-benefit for smart city investments under EU Mission Cities and IEA Smart City frameworks.

**How an analyst works this module:**
- Select smart city technology category and city size
- Model energy and mobility savings from IoT/AI deployment
- Calculate GHG reduction co-benefit
- Assess financing structure (green bond, ESCO, PPP)
- Generate EU Smart City Mission eligibility assessment

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CITIES`, `CITY_NAMES`, `FeatureBadge`, `KpiCard`, `REGIONS`, `TABS`, `TIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'];` |
| `tier` | `TIERS[Math.floor(sr(i * 7) * 4)];` |
| `pop` | `+(0.5 + sr(i * 3) * 19.5).toFixed(1);` |
| `score` | `Math.round(40 + sr(i * 11) * 60);` |
| `iot` | `Math.round(10 + sr(i * 13) * 490);` |
| `techInv` | `+(0.2 + sr(i * 17) * 9.8).toFixed(1);` |
| `carbonRed` | `+(5 + sr(i * 19) * 45).toFixed(1);` |
| `energySav` | `Math.round(100 + sr(i * 23) * 4900);` |
| `ppv` | `+(0.1 + sr(i * 29) * 4.9).toFixed(1);` |
| `resil` | `Math.round(30 + sr(i * 31) * 70);` |
| `avgScore` | `filtered.length ? (filtered.reduce((s, c) => s + c.smartCityScore, 0) / filtered.length).toFixed(0) : '0';` |
| `totalTech` | `filtered.reduce((s, c) => s + c.techInvestment, 0).toFixed(1);` |
| `avgCarbon` | `filtered.length ? (filtered.reduce((s, c) => s + c.carbonReduction, 0) / filtered.length).toFixed(1) : '0';` |
| `totalEnergy` | `filtered.reduce((s, c) => s + c.energySavings, 0);` |
| `regionScores` | `REGIONS.map(r => {` |
| `scatterData` | `filtered.map(c => ({ x: c.techInvestment, y: c.carbonReduction, name: c.name }));` |
| `topEnergy` | `[...filtered].sort((a, b) => b.energySavings - a.energySavings).slice(0, 15)` |
| `gridPct` | `arr.length ? Math.round(arr.filter(c => c.energySmartGrid).length / arr.length * 100) : 0;` |
| `val` | `arr.reduce((s, c) => s + c.privatePartnershipValue, 0).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITY_NAMES`, `REGIONS`, `TABS`, `TIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Smart City Investment 2023 | — | IDC Smart Cities Spending Guide 2024 | Global smart city technology investment $120Bn in 2023 — growing 15% yr-on-yr driven by climate goals |
| Smart Building Energy Savings | — | IEA Smart City Buildings 2023 | Smart building management systems reduce energy consumption 15–30% vs conventional buildings |
| EU Smart City Mission | — | EU Mission Cities 2023 | EU Smart City Mission targets 100 climate-neutral, smart cities by 2030 — €360M innovation funding |
- **City energy consumption data by sector + IoT sensor feeds** → Smart energy savings modelling → **Energy reduction and GHG savings from smart systems**
- **Transport data (mode share, congestion, VMT)** → Mobility optimisation → **Smart transport GHG and cost savings**
- **EU Mission Cities funding database** → Grant eligibility analysis → **Available smart city climate funding by technology category**

## 5 · Intermediate Transformation Logic
**Methodology:** Smart City Climate ROI
**Headline formula:** `SmartROI = Σ [(EnergySavings_t + MobilitySavings_t + WaterSavings_t + DisasterAvoidance_t - TechInvestment_t) / (1+r)^t]; GHGReduction = EnergySavings × GridEmissionFactor + MobilityShift × TravelEmissionFactor`

Technology ROI aggregates avoided costs across energy, mobility, water, and disaster response; GHG reduction links efficiency savings to grid/transport decarbonisation

**Standards:** ['IEA Smart City Energy Systems 2023', 'C40 Digital Innovation for Climate 2023', 'World Bank Smart Cities for Climate Resilience 2022', 'EU Smart City Mission — 100 Climate Neutral Cities']
**Reference documents:** IEA Smart City Energy Systems — Digital Innovation for Clean Energy 2023; C40 Digital Innovation for Climate Action 2023; EU Mission on Climate-Neutral and Smart Cities; World Bank Smart Cities and Infrastructure for Resilience 2022

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine formula —
> `SmartROI = Σ[(EnergySavings+MobilitySavings+WaterSavings+DisasterAvoidance−TechInvestment)/(1+r)^t]` and
> `GHGReduction = EnergySavings×GridEmissionFactor + MobilityShift×TravelEmissionFactor` — **is not
> implemented anywhere in the code.** There is no discounted-cash-flow ROI calculation and no grid/travel
> emission-factor multiplication. Every quantity the page displays (`carbonReduction`, `energySavings`,
> `techInvestment`, `climateResilienceScore`, etc.) is an independently-seeded random draw per city. The
> sections below document the descriptive analytics the code actually renders.

### 7.1 What the module computes

`CITIES` seeds 55 named real cities (Singapore, Amsterdam, Zurich, Dubai, Shenzhen, etc.) across 5 regions
with a `smartCityTier` (Emerging/Developing/Advanced/Leading, index-selected via `sr(i*7)`), a composite
`smartCityScore` (40–100), IoT sensor count, five boolean feature flags (smart grid, smart transport, digital
twin, climate monitoring, smart waste — each an independent `sr()>threshold` draw), tech investment ($0.2–
10Bn), carbon reduction (5–50%), energy savings (100–5,000 GWh/yr), private-partnership value ($0.1–5Bn),
and a climate resilience score (30–100). Filters (region, tier, min tech investment, min carbon reduction)
drive 8 tabs of tables/charts.

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `smartCityScore` | `round(40 + sr(i*11)×60)` | synthetic composite, no sub-component weighting shown |
| `iotSensors` | `round(10 + sr(i*13)×490)`k | synthetic |
| `techInvestment` | `0.2 + sr(i*17)×9.8` $Bn | synthetic |
| `carbonReduction` | `5 + sr(i*19)×45` % | synthetic, unconnected to `techInvestment` (no causal model) |
| `energySavings` | `100 + sr(i*23)×4900` GWh/yr | synthetic |
| `climateResilienceScore` | `30 + sr(i*31)×70` | synthetic |
| 5 feature booleans | independent `sr(i*k) > threshold` draws (thresholds 0.3–0.6) | synthetic, features are not mutually informative (e.g. "Leading" tier city can have 0/5 features) |

### 7.3 Calculation walkthrough

- **Filtering**: `filtered` = `CITIES` matching region/tier/minTechInv/minCarbonRed simultaneously.
- **KPI strip**: `avgScore`/`avgCarbon` are simple means over `filtered`; `totalTech`/`totalEnergy` are sums.
- **Region scores**: per-region mean of `smartCityScore` over the filtered set.
- **Feature adoption %**: `count(flag=true)/filtered.length × 100` per of the 5 booleans — a straightforward
  penetration-rate calculation, the only genuinely "computed" statistic beyond means/sums.
- **Tech-Investment vs Carbon-Reduction scatter**: plots the two independently-seeded fields against each
  other; because both are generated from unrelated `sr()` calls, any visual correlation is spurious.

### 7.4 Worked example

City index `i=0` (Singapore), illustrative:

| Field | Formula | Result |
|---|---|---|
| `smartCityScore` | `round(40 + sr(0)×60)` | 40–100 depending on `sr(0)` |
| `techInvestment` | `0.2 + sr(0)×9.8` | $0.2–10.0Bn |
| `carbonReduction` | `5 + sr(0)×45` | 5–50% |
| Feature count | Σ 1{`sr(i*k)>threshold`} for k∈{37,41,43,47,53} | 0–5 |

Because each field uses a *different* seed multiplier (`i*11`, `i*17`, `i*19`…), the four values for the same
city are drawn from different points on the `sr()` sequence and are not internally consistent with each
other in any economically meaningful way.

### 7.5 Data provenance & limitations

- **All 55 cities' quantitative fields are synthetic**, generated by `sr(seed) = frac(sin(seed+1)×10⁴)`. City
  names are real; the metrics attached to them are not.
- The guide's discounted multi-stream ROI formula and grid/travel emission-factor GHG calculation have
  **zero implementation** — see the mismatch flag above.
- No causal linkage exists between `techInvestment` and any outcome metric (`carbonReduction`,
  `energySavings`) — a $10Bn investment city can show worse outcomes than a $0.2Bn one.
- `smartCityScore` is not a weighted composite of the underlying feature flags or metrics; it is drawn
  independently.

### 7.6 Framework alignment

- **IEA Smart City Energy Systems 2023 / C40 Digital Innovation for Climate** — cited as sources for the
  real-world data points quoted in the guide (e.g. "$120Bn global smart city investment 2023"); these
  figures do not feed into any per-city calculation in the code.
- **EU Smart City Mission (100 climate-neutral cities by 2030)** — referenced descriptively; no eligibility
  screening logic exists.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Support smart-city infrastructure investment decisions (ESCO/PPP structuring, green bond use-of-proceeds
justification) by replacing the disconnected random fields with a genuine avoided-cost ROI and GHG model, as
the guide already specifies in its (currently unimplemented) formula.

### 8.2 Conceptual approach

Implement the guide's own DCF structure properly: sum discounted avoided-cost streams (energy, mobility,
water, disaster) net of tech investment, benchmarked against **World Bank/C40 avoided-cost methodologies**
for municipal infrastructure investment appraisal, and **IEA's Smart City Energy Systems** savings-factor
tables for the energy stream specifically.

### 8.3 Mathematical specification

```
SmartROI = Σ_t [ (EnergySavings_t + MobilitySavings_t + WaterSavings_t + DisasterAvoidance_t − TechInvestment_t) / (1+r)^t ]

EnergySavings_t = BaselineEnergyUse × SavingsRate_tech × EnergyPrice_t
   SavingsRate_tech ∈ [0.15, 0.30]     // IEA smart-building range
GHGReduction = EnergySavings_MWh × GridEmissionFactor_country + ModalShift_pkm × (EF_car − EF_transit)
```
`GridEmissionFactor_country` should be pulled from the platform's existing OWID/IEA grid-intensity reference
tables (already ingested per the reference-data layer) rather than re-estimated.

| Parameter | Calibration source |
|---|---|
| `SavingsRate_tech` (15–30%) | IEA Smart City Buildings 2023 |
| `GridEmissionFactor` | IEA/OWID country grid intensity (already in `reference_data`) |
| Discount rate `r` | Municipal cost of capital (typically 3–6% real, per World Bank PPP appraisal guidance) |
| Modal-shift emission factors | IPCC/EPA transport emission factor tables |

### 8.4 Data requirements

Baseline city energy/water/transport consumption (utility disclosure or IEA city-level statistics), IoT
deployment cost and measured savings (ESCO M&V reports, IPMVP protocol), grid emission factor by country
(already in platform reference data), disaster-loss avoidance estimates (EM-DAT historical event costs by
city/region).

### 8.5 Validation & benchmarking plan

Backtest `EnergySavings` against IPMVP-certified ESCO project M&V reports where available. Cross-check
`GHGReduction` totals against city-level CDP Cities disclosure for the same jurisdictions.

### 8.6 Limitations & model risk

Multi-stream avoided-cost aggregation risks double-counting (e.g. mobility savings and disaster avoidance
can overlap in flood-resilient transit investments) — apply an explicit overlap discount or model streams
jointly. Discount-rate choice materially changes ROI ranking across cities with different investment
horizons; always disclose the rate used.

## 9 · Future Evolution

### 9.1 Evolution A — Build the DCF ROI and GHG model the guide already specifies (analytics ladder: rung 1 → 2)

**What.** The §7 mismatch flag is stark: the guide specifies a discounted avoided-cost ROI (`Σ[(EnergySavings+MobilitySavings+WaterSavings+DisasterAvoidance−TechInvestment)/(1+r)^t]`) and a factor-based GHG model (`EnergySavings×GridEF + MobilityShift×TravelEF`), but **neither is implemented** — every displayed quantity (`carbonReduction`, `energySavings`, `techInvestment`, `climateResilienceScore`) is an independent `sr()` draw per city, and the five feature booleans are uncorrelated with tier (a "Leading" city can have 0/5 features). The page even carries a §8 "specification — not yet implemented" block for exactly this work. Evolution A builds the module's first real computation from that spec.

**How.** (1) Implement the DCF: a small backend endpoint taking per-technology savings assumptions, tech CAPEX, discount rate, and horizon, returning NPV/IRR/payback across the four avoided-cost streams — the guide's formula, made real. (2) GHG co-benefit via grid emission factors (the platform's `referenceData.js` and NGFS/IEA grid intensities are available) times energy savings, plus modal-shift travel factors — so `carbonReduction` becomes a function of `energySavings` and geography, not an unconnected draw. (3) Savings-factor tables sourced from IEA Smart City Energy Systems 2023 and C40/World Bank avoided-cost methodologies (all cited in the guide but currently feeding nothing). (4) An EU Smart City Mission eligibility screen — a real rule set, replacing the descriptive-only reference.

**Prerequisites.** Per-technology savings-factor sourcing (one-time literature pass); grid EF reference rows. **Acceptance:** carbon reduction moves when energy savings or grid EF change; NPV is reproducible by hand from the stated cash-flow streams; no headline figure is a raw `sr()` draw.

### 9.2 Evolution B — Smart-city investment-appraisal copilot (LLM tier 1)

**What.** A copilot for the city-CFO / project-finance user the module targets: "what's the payback on citywide smart-grid IoT for a mid-size city?", "which financing structure — green bond, ESCO, or PPP — fits this profile?", "does this project qualify for the EU Smart City Mission?" — answered from the Evolution-A DCF outputs and the framework reference tables the page already cites.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/smart-city-climate-finance/ask`, corpus = this Atlas record plus the IEA/C40/World Bank/EU-Mission references. What-if requests re-run the DCF endpoint with the user's parameters and narrate NPV/GHG deltas; financing-structure guidance is drawn from the ESCO/PPP/green-bond characteristics the page catalogues, not invented terms. Eligibility answers cite the specific EU Mission criterion.

**Prerequisites (hard).** Evolution A — until the DCF exists, every number the copilot could cite is a random draw, so a shipped copilot would narrate fabricated ROI. Ship as explanation-only against the framework references until then, with an explicit "figures illustrative" banner. **Acceptance:** every ROI or GHG figure in an answer traces to a DCF endpoint response; an eligibility answer quotes the Mission criterion applied; questions about cities outside the 55-city set return a scoped, assumption-driven estimate clearly labelled as such.