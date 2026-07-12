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
