# Municipal Climate Resilience Investment Hub
**Module ID:** `municipal-climate-resilience-hub` · **Route:** `/municipal-climate-resilience-hub` · **Tier:** B (frontend-computed) · **EP code:** EP-DY4 · **Sprint:** DY

## 1 · Overview
Municipal climate resilience investment planning analytics. Assesses physical risk to municipal assets (roads, buildings, utilities), prioritises adaptation capex, models resilience ROI, and values green infrastructure benefit-cost ratios.

> **Business value:** Provides rigorous municipal climate resilience investment analytics integrating multi-hazard risk scoring, FEMA-methodology BCR calculation, and green infrastructure co-benefit valuation.

**How an analyst works this module:**
- Inventory municipal assets by category and map to multi-hazard physical risk exposure using RCP 4.5 and 8.5 scenarios
- Prioritise adaptation investments using risk score, asset criticality, and benefit-cost ratio
- Model resilience ROI for top-priority interventions using FEMA BCA methodology
- Identify green infrastructure opportunities and co-benefit valuation for grant applications (FEMA BRIC, CDBG-DR)

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOND_STRUCTURES`, `CITIES`, `FUNDING_PROGRAMS`, `Kpi`, `RESILIENCE_MEASURES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CITIES` | 9 | `name`, `country`, `pop`, `hazards`, `resilienceScore`, `investment`, `avoided`, `bcr`, `adaptScore`, `fundingStack`, `bonds`, `federal`, `grants`, `private` |
| `FUNDING_PROGRAMS` | 9 | `amount`, `type`, `match`, `eligible`, `deadline`, `focus` |
| `RESILIENCE_MEASURES` | 9 | `capex`, `annBenefit`, `lifetime`, `co2`, `bcr`, `hazard`, `examples` |
| `BOND_STRUCTURES` | 6 | `security`, `tenor`, `rate`, `pros`, `cons` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pvBenefits` | `dr > 0 ? annBenefit * (1 - Math.pow(1 + dr, -lifetime)) / dr : annBenefit * lifetime;` |
| `roi` | `calcResilienceRoi({ investment, avoidedLoss: investment * (city.bcr - 1) });` |
| `totalFunding` | `FUNDING_PROGRAMS.reduce((s, p) => s + p.amount, 0);` |
| `cityRankData` | `[...CITIES].sort((a, b) => b.resilienceScore - a.resilienceScore).map(c => ({` |
| `measureBcrData` | `[...RESILIENCE_MEASURES].sort((a, b) => b.bcr - a.bcr).map(m => ({` |
| `fundingTrend` | `useMemo(() => [2020, 2021, 2022, 2023, 2024, 2025].map((yr, i) => ({` |
| `status` | `['Planning', 'Design', 'Procurement', 'Construction', 'Operational'][Math.floor(sr(i * 17) * 5)];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOND_STRUCTURES`, `CITIES`, `FUNDING_PROGRAMS`, `RESILIENCE_MEASURES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Average Asset Physical Risk Score | `Composite score across flood, heat, drought, and sea-level rise hazards` | RMS / AIR municipal risk model | Scores above 70 require near-term adaptation investment; 50-70 monitor and plan; roadways and utilities typically highest risk |
| Adaptation Investment BCR | `Total adaptation benefits PV / adaptation capex PV` | FEMA BCA methodology | FEMA minimum BCR threshold for grant eligibility is 1.0; resilient infrastructure typically 3-6x; nature-based solutions often higher |
| Green Infrastructure Cost Savings | `Green infrastructure cost vs grey infrastructure equivalent at same performance standard` | American Society of Civil Engineers | Green stormwater infrastructure 20-40% cheaper than grey; additional co-benefits in heat reduction, air quality, habitat |
- **Municipal GIS asset database** → Asset locations, conditions, replacement values → physical risk exposure mapping → **Asset-level risk scores**
- **RMS / AIR municipal physical risk models** → Hazard intensity by location and RCP scenario → damage functions and loss estimates → **Avoided damage benefit calculation**
- **FEMA BCA Toolkit / natural hazard loss data** → Damage functions, unit costs, co-benefit valuation → BCR calculation → **Grant application support and investment prioritisation**

## 5 · Intermediate Transformation Logic
**Methodology:** Resilience ROI and Benefit-Cost Analysis
**Headline formula:** `Resilience ROI = (Avoided Damage PV + Co-benefits PV - Adaptation CAPEX PV) / Adaptation CAPEX PV; BCR = Total Benefits / Total Costs`

Multi-hazard benefit-cost analysis for municipal adaptation investments, combining avoided physical damage, insurance savings, and ecosystem co-benefits

**Standards:** ['FEMA Benefit-Cost Analysis Reference Guide 2023', 'World Bank CURB Tool for Urban Resilience', 'IPCC AR6 WG2 Chapter 17 — Adaptation Options']
**Reference documents:** FEMA (2023) Benefit-Cost Analysis Reference Guide v6.0; World Bank (2023) CURB Tool for Urban Climate Resilience; IPCC AR6 WG2 (2022) Chapter 17 — Decision-Making Options for Managing Risk; C40 Cities (2023) Climate Action Planning — Adaptation Investment Framework

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module matches its MODULE_GUIDES entry closely: a **municipal climate-resilience investment hub**
running FEMA-style benefit-cost analysis over adaptation measures, a grant-programme catalogue, resilience
bond structures, and an 8-city dashboard. The BCA math is **genuine present-value finance**; the city
resilience/adaptation scores and hazard lists are hand-authored, not modelled.

### 7.1 What the module computes

The core engine is a discounted benefit-cost analysis (`calcBcr` / `calcNpv`) using the standard
present-value-of-an-annuity formula — the same mechanic FEMA's BCA Toolkit uses:

```js
dr         = discountRate / 100
pvBenefits = dr > 0 ? annBenefit · (1 − (1+dr)^(−lifetime)) / dr : annBenefit · lifetime
BCR        = pvBenefits / capex
NPV        = pvBenefits − capex
```

A separate city-level ROI proxy: `roi = avoidedLoss / investment` where
`avoidedLoss = investment · (city.bcr − 1)` — i.e. ROI is algebraically pinned to the city's stored BCR
(`roi = bcr − 1`), so it is a re-expression, not an independent estimate.

### 7.2 Parameterisation / scoring rubric

| Dataset | Fields | Provenance |
|---|---|---|
| `RESILIENCE_MEASURES` (8) | capex, annBenefit, lifetime, co2, **bcr**, hazard | Hand-authored, realistic (e.g. Early Warning Systems BCR 8.1, NbS 5.8, Green Stormwater 3.8) |
| `CITIES` (8) | pop, hazards, resilienceScore, investment, avoided, bcr, adaptScore, fundingStack | Hand-authored (NYC 74/BCR 4.2, Rotterdam 92/6.8, Lagos 32/2.1) |
| `FUNDING_PROGRAMS` (8) | amount ($M), type, match, focus | **Real US/EU programmes** — FEMA BRIC, HUD CDBG-DR, Army Corps CSRM, EPA WIFIA, DOT RAISE, EU Cohesion Fund, Green Climate Fund |
| `BOND_STRUCTURES` (5) | security, tenor, rate, pros/cons | Real muni-finance instruments (GO, revenue, green, SIB/PAYGO, CAT bond) |
| `fundingTrend` | year, total, federal | Synthetic (`sr()` seeded around a 28+8.5·i trend) |

The stored per-measure `bcr` values are **inputs**, hand-set; the live `calcBcr` calculator recomputes a
BCR from the user's discount rate and the measure's capex/annBenefit/lifetime, so the two can differ (the
calculator is the honest engine; the stored `bcr` is a headline figure).

### 7.3 Calculation walkthrough

1. User picks a city → `roi = bcr − 1`; picks a measure + discount rate → live `bcr`/`npv` from the PV
   annuity formula.
2. `cityRankData` sorts cities by `resilienceScore`; `measureBcrData` sorts measures by stored `bcr`.
3. `totalFunding = Σ FUNDING_PROGRAMS.amount` drives the "total program funding" KPI.
4. Radar normalises five city metrics onto 0–100 (`min(100, bcr·15)`, `min(100, avoided·1.2)` …) for
   visual comparison.

### 7.4 Worked example (Green Stormwater Infrastructure, 4 % discount)

`measure = {capex 45, annBenefit 12, lifetime 30}`, `dr = 0.04`:

| Step | Computation | Result |
|---|---|---|
| Annuity factor | `(1 − 1.04^(−30)) / 0.04` = `(1 − 0.3083)/0.04` | 17.29 |
| PV benefits | `12 · 17.29` | **$207.5M** |
| BCR | `207.5 / 45` | **4.61** |
| NPV | `207.5 − 45` | **$162.5M** |

At `dr = 0` the annuity collapses to `annBenefit · lifetime = 12·30 = 360`, BCR 8.0 — correctly showing
how a higher discount rate suppresses long-lived benefits (the whole point of FEMA's discount-rate
sensitivity, run at 3 % and 7 %). The stored headline `bcr = 3.8` reflects a higher assumed discount.

### 7.5 Data provenance & limitations

- **Funding programmes and bond structures are real** and accurately described; **city and measure
  datasets are hand-authored** plausible values, not sourced from a municipal GIS asset inventory or a
  cat model. `fundingTrend` is the only PRNG-seeded (`sr(s)=frac(sin(s+1)·10⁴)`) series.
- The BCA engine is sound but **single-measure**: no portfolio optimisation across measures under a
  budget, no probabilistic avoided-loss (it uses point annual benefits, not an EP-curve-integrated AAL),
  and no explicit RCP/SSP hazard scenario driving the benefit stream.
- `resilienceScore`/`adaptScore` are opaque 0–100 composites with no documented sub-factors.

**Framework alignment:** **FEMA BCA Reference Guide v6** — the PV-annuity BCR and the ≥1.0 grant-
eligibility threshold are faithfully reproduced. **World Bank CURB** and **IPCC AR6 WG2 Ch.17** framing
(adaptation option appraisal) is referenced. Grant catalogue maps to real **FEMA BRIC / HUD CDBG-DR /
EPA WIFIA / GCF** windows. The gap vs production practice is the missing probabilistic avoided-loss
model (see §8).

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The BCR engine uses point annual benefits and
hand-set avoided-loss. A production hub should derive avoided loss from a probabilistic hazard-loss model
and optimise measure selection under budget.

### 8.1 Purpose & scope
Prioritise a municipality's adaptation capex across candidate measures and hazards, producing scenario-
conditioned BCR/NPV and a budget-constrained optimal portfolio, for FEMA/GCF grant applications and bond
sizing.

### 8.2 Conceptual approach
Couple a **probabilistic avoided-loss model** (EP-curve-integrated AAL, per RMS/AIR cat-modelling and the
platform's own `natcat-loss-engine`) with a **capital-budgeting optimiser** (knapsack over measures under
budget, maximising portfolio NPV). Benchmarks: **FEMA BCA Toolkit** (discounting, standard values) and
**World Bank CURB / OECD infrastructure appraisal** (co-benefit monetisation).

### 8.3 Mathematical specification
Per measure m and hazard h: avoided annual loss `ΔAAL_m,h = AAL_baseline_h − AAL_with_m,h`, where
`AAL = ∫ L(p) dp` over the exceedance-probability curve, and the with-measure curve reflects the measure's
loss-reduction fraction `η_m,h`. Benefit stream also includes co-benefits `CB_m` (heat, air quality,
habitat, GHG at a carbon price). `PV(m) = Σ_{t=1}^{life} (ΔAAL_m·(1+g)^t + CB_m) / (1+dr)^t`.
`NPV(m) = PV(m) − capex_m`. Portfolio: `max Σ_m x_m·NPV(m)` s.t. `Σ_m x_m·capex_m ≤ Budget`,
`x_m ∈ {0,1}` (0/1 knapsack), plus hazard-coverage constraints.

| Parameter | Source |
|---|---|
| Baseline AAL_h | NatCat EP curves (RMS/AIR-style) under RCP 4.5/8.5 |
| Loss-reduction η_m,h | FEMA/USACE effectiveness studies |
| Discount rate dr | FEMA 7 % + 3 % sensitivity |
| Co-benefit values CB_m | EPA social cost of carbon, ASCE heat/stormwater studies |
| Benefit growth g | RCP hazard-intensification trend |

### 8.4 Data requirements
Municipal asset inventory + replacement values (GIS), hazard EP curves per site (from `natcat-loss-engine`
/ WRI Aqueduct), measure effectiveness library, discount rate, budget. Platform already provides the cat-
loss engine and funding catalogue.

### 8.5 Validation & benchmarking plan
Reconcile computed BCRs against published FEMA BRIC award BCAs for comparable projects; sensitivity on
discount rate (3/7 %) and η; verify knapsack optimality against exhaustive search on small measure sets.

### 8.6 Limitations & model risk
Avoided-loss estimates inherit deep cat-model uncertainty; co-benefit monetisation is contested; 0/1
knapsack ignores partial/phased implementation. Conservative fallback: report BCR ranges (not points),
apply FEMA's 7 % discount as the primary case, and exclude speculative co-benefits from the eligibility BCR.

## 9 · Future Evolution

### 9.1 Evolution A — Hazard-grounded avoided-loss estimation (analytics ladder: rung 2 → 3)

**What.** The module's BCA core is genuine (§7: real present-value-of-annuity math in `calcBcr`/`calcNpv`, matching FEMA's toolkit mechanic), but its inputs are hand-authored: the 8 cities' hazard lists, resilience scores, and BCRs are typed constants, and the city ROI is algebraically pinned to the stored BCR (`roi = bcr − 1` — a re-expression, not an estimate, as §7.1 documents). Evolution A grounds avoided-damage estimates in the platform's own hazard data so the BCR numerator is derived, not asserted.

**How.** (1) Wire city coordinates to the Physical Risk Digital Twin's populated `ref_*_zones` grids (earthquake/cyclone/wildfire/flood/sea-level, real USGS/IBTrACS/GWIS/OpenFEMA sources) to derive per-city hazard exposure instead of the hand-typed hazard arrays. (2) Estimate annual expected damage per asset category from OpenFEMA NFIP claims history (already ingested) scaled by exposure, making `annBenefit` = avoided fraction × expected damage with the avoided fraction sourced from the FEMA BCA Reference Guide effectiveness tables per measure type. (3) Replace the synthetic `fundingTrend` series (§7.2 flags it as `sr()`-seeded) with actual FEMA BRIC/CDBG-DR appropriation history — the `FUNDING_PROGRAMS` catalogue is already real; its trend line should be too.

**Prerequisites.** Flood/sea-level grids are currently thin (48/152 rows, named-city samples) — acceptable for the 8-city set but must be checked per city; claims-to-damage scaling documented per Atlas §8 model-card convention. **Acceptance:** changing a city's coordinates changes its derived hazard exposure and BCR; no `sr()` remains in rendered series.

### 9.2 Evolution B — Grant-application copilot for municipal staff (LLM tier 2)

**What.** The natural user is a city sustainability officer writing FEMA BRIC or CDBG-DR applications. A tool-calling copilot that assembles the quantitative core of an application: runs the module's BCA for a chosen measure ("green stormwater, $12M capex, 25-year life, 4% discount"), compares against the programme's BCR threshold from the real `FUNDING_PROGRAMS` catalogue (match requirements, focus areas), and drafts the benefit-cost narrative with every number sourced from the calculation.

**How.** Expose the BCA as a small backend endpoint (`POST /api/v1/muni-resilience/bca` — the `calcBcr`/`calcNpv` logic ports directly to Python) so the copilot tool-calls it rather than re-deriving PV math; system prompt from this page's §5 formulas and the FEMA BCA Reference Guide v6.0 named in §5. Drafted narrative sections are templated to FEMA BCA submission structure; the no-fabrication validator matches every BCR/NPV/co-benefit figure to a tool response. Programme-fit checks quote the catalogue row (match %, focus) verbatim.

**Prerequisites.** The BCA endpoint (trivial); Evolution A strongly preferred before the copilot quotes avoided-loss magnitudes, since today's per-city `avoided` figures are hand-authored. **Acceptance:** a generated draft's every numeric traces to a BCA tool call or catalogue row; asking "will FEMA approve this?" yields a scoped refusal.