# Enhanced Weathering Finance Platform
**Module ID:** `enhanced-weathering-finance` · **Route:** `/enhanced-weathering-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EH2 · **Sprint:** EH

## 1 · Overview
Rock-to-soil CDR analytics for basalt, olivine, wollastonite, and steel slag deployment. 20 seeded projects across tropical and temperate agricultural regions with MRV partner intelligence, co-benefit quantification (8–15% crop yield uplift), scale economics calculator, and LCOC learning curves.

> **Business value:** Used by enhanced weathering project developers optimising deployment economics, agricultural companies evaluating soil amendment co-benefits, carbon buyers assessing permanence, and investors building CDR portfolios.

**How an analyst works this module:**
- Review project overview for 20 EW projects across minerals and geographies
- Examine mineral analysis for CDR potential and LCOC by rock type
- Use scale economics calculator for LCOC sensitivity to deployment volume and carbon price
- Analyse co-benefits radar for crop yield, soil health, and biodiversity scores

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CO_BENEFITS`, `KpiCard`, `LCOC_BREAKDOWN`, `LEARNING_CURVE`, `MINERAL_TYPES`, `PROJECTS`, `Pill`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MINERAL_TYPES` | 7 | `name`, `cdrPotential`, `costMin`, `costMax`, `mineAbundance`, `soilType`, `status` |
| `LCOC_BREAKDOWN` | 7 | `basalt`, `olivine`, `wollastonite`, `slag` |
| `CO_BENEFITS` | 7 | `score`, `description` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Overview', 'Mineral Analysis', 'Project Economics', 'Learning Curves', 'Co-Benefits', 'Market & MRV'];` |
| `scaleEconomics` | `useMemo(() => { const scaleFactor = Math.pow(scaleSlider / 1000, -0.15);` |
| `scaledLcoc` | `Math.round(baseLcoc * scaleFactor);` |
| `annualRevenue` | `annualCDR * carbonPrice * 1000;` |
| `annualCost` | `annualCDR * scaledLcoc * 1000;` |
| `last` | `LEARNING_CURVE[LEARNING_CURVE.length - 1][key === 'steelslag' ? 'slag' : key];` |
| `reduction` | `Math.round((1 - last / first) * 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CO_BENEFITS`, `LCOC_BREAKDOWN`, `MINERAL_TYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Basalt CDR potential (tCO2/t rock) | `Theoretical maximum; actual 0.15–0.25 with MRV` | UNDO Science + Nature 2023 study | Actual CDR credited = theoretical × verification_factor (0.5–0.7 for current MRV methods); permanence 10,000+ yr. |
| LCOC basalt ($/tCO₂) | `Mining + crushing + transport + application + MRV` | UNDO + Stripe Frontier advance purchase data | Transport is 30–40% of cost; optimal for tropical agricultural regions near basalt quarries. Learning curve: -12%/doubling. |
| Co-benefit: crop yield uplift (%) | `Tropical soils from silica + Ca + Mg + micro-nutrient release` | Multiple peer-reviewed agronomy studies | Yield uplift reduces fertiliser cost $30–80/ha/yr; co-benefit value can offset 20–40% of EW deployment cost. |
- **UNDO/Eion EW data + Nature study + Stripe Frontier advance purchase terms** → 20-project pipeline + mineral comparison + scale economics + co-benefit radar + MRV intelligence → **EW project developers, agricultural companies, carbon buyers, and investors assessing CDR portfolio**

## 5 · Intermediate Transformation Logic
**Methodology:** Enhanced Weathering CDR (tCO₂/ha)
**Headline formula:** `CDR = Mineral_application_rate × Rock_CDR_potential × Weathering_rate × MRV_verification_factor`

Basalt: 1–2 tCO2/ha/yr at 10 t/ha application; olivine theoretically 3–4 tCO2/ha/yr but slower weathering rate; uncertainty in MRV is principal risk.

**Standards:** ['UNDO EW Scientific Publications', 'Nature (2023) – Enhanced Weathering Potential', 'Eion Carbon MRV Methodology']
**Reference documents:** UNDO (2023) – Enhanced Weathering Science and MRV Methodology; Nature (2023) – Enhanced Weathering of Olivine and Basalt; Eion Carbon (2024) – Field Trial Results and MRV Framework

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide's CDR formula is `CDR = application_rate × rock_CDR_potential × weathering_rate ×
MRV_verification_factor`. The module carries **real per-mineral CDR potentials** and a genuine
scale-economics engine and Wright's-law LCOC learning curves — but the **per-project `annualCDR` is a
random draw**, not computed from that formula, and there is **no weathering-rate or MRV-verification-
factor term** in code. So the mineral science and cost-down economics are real; the project-level CDR
quantity is synthetic (§8 specifies the missing per-project CDR/MRV model).

### 7.1 What the module computes

**Mineral library** (real CDR potentials, tCO₂ per tonne rock):

```
Basalt 2.0 · Olivine 3.5 · Wollastonite 1.8 · Serpentine 2.8 · Steel-Slag 0.5 · Cement-Kiln 0.3
```

**Scale-economics calculator** (genuine Wright-scaling):
```js
scaleFactor = (scaleSlider / 1000)^(−0.15)             // −15% learning exponent
scaledLcoc  = 150 × scaleFactor                        // $/tCO₂
annualRevenue = annualCDR × carbonPrice × 1000
annualCost    = annualCDR × scaledLcoc × 1000
margin        = annualRevenue − annualCost
```

**LCOC learning curves** (per mineral, real exponential decline):
```js
basalt(year i) = round(180 × 0.88^i)   // 12%/yr cost decline
olivine        = round(150 × 0.87^i)
wollastonite   = round(220 × 0.86^i)
slag           = round(80  × 0.90^i)
```

**Project set (20)** — `annualCDR`, `lcoc`, `creditPrice`, `permanence`, `yieldBenefit` are all
independent `sr()` draws; only the `mineral`, `country`, and `mrv` partner are structured.

### 7.2 Parameterisation / scoring rubric

| Object | Content | Real? |
|---|---|---|
| `MINERAL_TYPES` cdrPotential | Basalt 2.0, Olivine 3.5, Slag 0.5 tCO₂/t | ✓ literature-consistent |
| `LCOC_BREAKDOWN` | mining/grinding/transport/application/MRV/registry $ | ✓ realistic cost stack |
| `LEARNING_CURVE` | 12–14%/yr decline | ✓ Wright-style |
| `CO_BENEFITS` | crop yield +8–15%, pH, erosion, nutrients | ✓ agronomic co-benefits |
| Scale exponent | −0.15 | scale-economies proxy |
| `annualCDR` per project | 500–10,000 tCO₂/yr | ✗ synthetic draw |
| MRV verification factor | — | ✗ absent (guide names it) |

MRV partners named are real EW players: **UNDO, Stripe Frontier, Eion, CarbonBuilders, Planetary**.

### 7.3 Calculation walkthrough

Mineral analysis ranks CDR potential and cost by rock type → the scale-economics tab takes a deployment
scale + carbon price and returns scaled LCOC, revenue, cost and margin → learning-curve tab projects
LCOC decline to 2033 → co-benefits radar scores agronomic uplift → market/MRV tab lists MRV partners
and credit prices. Portfolio KPIs average the (synthetic) project `annualCDR`, `lcoc`, `permanence`.

### 7.4 Worked example (scale-economics engine)

Deployment `scaleSlider = 50,000 tCO₂/yr`, `carbonPrice = $120/tCO₂`:
```
scaleFactor = (50000/1000)^−0.15 = 50^−0.15 = e^(−0.15·ln50) = e^(−0.587) = 0.556
scaledLcoc  = 150 × 0.556 = $83.4/tCO₂
annualRevenue = 50,000 × 120 × 1000 = $6.0B... (per calc: /1e6 → $6,000M)
annualCost    = 50,000 × 83.4 × 1000 = $4,170M
margin        = 6,000 − 4,170 = $1,830M
```
So at 50 kt/yr scale, LCOC falls from the $150 base to ≈$83/tCO₂ via scale economies, and at a $120
credit price the project turns a positive margin — the module's central economics message that
enhanced weathering needs both scale (to cut LCOC) and a >$80–90 carbon price to be viable. Basalt's
$180→$50/tCO₂ learning curve (180×0.88¹⁰) reaches the same viability point by ~2033.

### 7.5 Companion analytics

- **LCOC breakdown:** transport dominates for olivine (40) — reflecting the mine-to-field logistics
  that make EW cost-sensitive to haul distance.
- **Co-benefits:** crop-yield uplift (score 85, +8–15% in tropical soils) and reduced fertiliser cost
  ($30–80/ha/yr) — the agronomic value that offsets deployment cost.
- **Permanence:** 1,000–50,000 yr sequestration (carbonate mineralisation is highly durable) — EW's
  advantage over biological CDR.

### 7.6 Data provenance & limitations

- **Mineral CDR potentials, LCOC breakdown, learning curves and co-benefits are realistic and
  literature-grounded**; the scale-economics engine is genuine.
- **Per-project `annualCDR` and financials are synthetic** (`sr()` draws), not computed from the
  guide's `rate × potential × weathering × MRV` formula. No weathering-rate or MRV-verification term
  exists in code — the principal EW uncertainty (MRV) is not modelled.

**Framework alignment:** **UNDO / Eion MRV methodologies** — the intended per-project CDR quantification
and verification basis (named as MRV partners); **Nature (2023) Enhanced Weathering Potential** — the
tCO₂/ha basalt/olivine CDR magnitudes; **ICVCM/CDR credit standards** — the permanence and credit-price
context. Enhanced weathering removes CO₂ by accelerating silicate mineral dissolution (basalt/olivine
react with dissolved CO₂ to form bicarbonate), with the CDR rate set by mineral surface area,
temperature, moisture and soil chemistry — the "weathering rate" term the code omits.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute a defensible per-project net CDR (tCO₂/yr) and MRV-discounted creditable removals, replacing
the random `annualCDR`, for basalt/olivine/slag deployments on agricultural land.

### 8.2 Conceptual approach
Mass-balance weathering model (RCO₂ stoichiometry) with a soil-and-climate-dependent weathering rate
and an MRV verification discount, per **Eion / UNDO MRV methodologies** and the **Beerling et al.
(Nature 2020/2023)** enhanced-weathering framework.

### 8.3 Mathematical specification
```
GrossCDR = ApplicationRate(t/ha) × Area(ha) × RockCDRpotential(tCO₂/t) × WeatheringRate(f,T,soil)
NetCDR   = GrossCDR − ProcessEmissions(mining+grinding+transport+application)
CreditableCDR = NetCDR × MRV_verification_factor × (1 − reversal_buffer)
WeatheringRate = k · exp(−Ea/RT) · f(grain_size) · f(soil_moisture, pH)   // 0–1 fraction/yr
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Rock CDR potential | `RockCDRpotential` | mineral stoichiometry (basalt ~0.3, olivine ~0.8 tCO₂/t theoretical; field-adjusted) |
| Weathering rate | `k, Ea` | Arrhenius kinetics, ecoinvent / Nature (2023) field trials |
| Process emissions | — | LCA of mining/grinding/haul (grinding is energy-intensive) |
| MRV verification factor | `MRV_factor` | Eion/UNDO measured-vs-modelled reconciliation (0.5–0.9) |
| Reversal buffer | `reversal_buffer` | registry buffer pool (e.g. 10–20%) |

### 8.4 Data requirements
Per project: application rate, field area, mineral type & grain size, soil pH/moisture, mean soil
temperature, transport distance, and MRV field-measurement data (soil cation flux, TA). Sources: field
trial data, ecoinvent LCA, ERA5 climate, project MRV reports.

### 8.5 Validation & benchmarking plan
Reconcile modelled NetCDR against measured cation-export MRV for pilot fields; benchmark net-vs-gross
ratio against published EW field trials. Sensitivity: weathering rate ±50% (the dominant uncertainty)
and grinding-energy carbon intensity.

### 8.6 Limitations & model risk
Weathering rate is the deepest uncertainty (order-of-magnitude field variability); process emissions
from grinding can consume 20–40% of gross CDR. Conservative fallback: apply the lower-bound weathering
rate and full process-emission debit, and discount by the MRV factor — never credit theoretical gross
potential.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the per-project CDR/MRV model the guide specifies (analytics ladder: rung 1 → 2)

**What.** §7 splits the module cleanly: the mineral science is real (per-mineral CDR potentials — basalt 2.0, olivine 3.5 tCO₂/t rock), the scale-economics calculator is genuine Wright scaling (`(scale/1000)^−0.15`), and the LCOC learning curves are real exponential declines — but the guide's headline formula `CDR = application_rate × CDR_potential × weathering_rate × MRV_verification_factor` is **not implemented**: per-project `annualCDR` is a random draw, and no weathering-rate or verification-factor term exists in code. The §8 spec for the missing model is already written. Evolution A implements it.

**How.** (1) `services/ew_cdr_engine.py`: per-project CDR from hectares × application rate × mineral potential × a climate-dependent weathering-rate factor (tropical vs temperate — the two-regime distinction the page already narrates) × MRV verification factor (0.5–0.7 band per the §4 lineage note, sourced to the UNDO/Nature references). (2) Project registry table replacing the 20 seeded projects — the real EW deployment universe is small and public (UNDO, Eion, Lithos, InPlanet purchases via the Frontier offtake database) and each row can carry its actual contracted tonnage. (3) The economics calculator then chains honestly: computed CDR × carbon price vs computed LCOC — margin from modeled quantities, not seeded ones. (4) Rung 2: sensitivity sweeps over the verification factor and weathering rate — the module's own stated principal risk becomes its principal what-if.

**Prerequisites.** Weathering-rate parameterization decision (a coarse two-regime factor first, documented; soil-model sophistication later); Frontier offtake data curation. **Acceptance:** a fixture project (500 ha basalt at 10 t/ha, tropical, VF 0.6) reproduces the four-factor formula by hand; contracted-tonnage rows match Frontier records; zero seeded `annualCDR`.

### 9.2 Evolution B — CDR buyer's diligence copilot (LLM tier 2)

**What.** A tool-calling copilot for carbon buyers assessing EW purchases: "compare a basalt project in Brazil with an olivine project in Denmark at $250/t — delivered cost per verified tonne, MRV risk, and co-benefit case." It calls Evolution A's engine per project (CDR quantity with the verification-factor band, scaled LCOC, margin at the offered price), quotes the co-benefit values from the curated table with their agronomy-study provenance, and drafts the diligence note with the permanence/MRV caveats the module's own lineage rows emphasize.

**How.** Tools: `compute_project_cdr(project, vf)`, `compute_scale_economics(volume, mineral, price)`, `get_mineral_profile(mineral)`, `get_project(id)`. Grounding corpus = this Atlas record's §5/§7 (the four-factor formula, the mineral library, the transport-cost share note). MRV risk framing is structural: answers always quote CDR as a range across the verification-factor band, never a point estimate — the honest representation of the module's stated principal uncertainty. Validator on all $/t and tCO₂ figures.

**Prerequisites (hard).** Evolution A — a diligence note over randomly-drawn project CDR would advise real purchase decisions on fabricated tonnage. **Acceptance:** golden comparison reproduces from scripted calls; CDR always presented as a VF-band range; co-benefit claims carry their source labels; projects outside the registry refuse.