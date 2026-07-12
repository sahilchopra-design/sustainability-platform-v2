## 7 · Methodology Deep Dive

The guide matches the code closely: this module implements genuine **CRREM stranding analysis** —
`StrandingYear = min{t : EUI(t) > CRREM_pathway(t, type, scenario)}` — with real crossover logic,
linear pathway interpolation, retrofit NPV/abatement-cost economics, and portfolio roll-ups over a
30-property default portfolio (persisted to `localStorage`). No PRNG drives any headline figure. The
one simplification to flag is that the embedded `CRREM_PATHWAYS` table is a **curated approximation**
of CRREM v2 pathways (per-type carbon-intensity trajectories), not the licensed CRREM dataset, and it
is expressed in carbon intensity (kgCO₂/m²) rather than EUI.

### 7.1 What the module computes

For each property, the module compares its `carbon_intensity_kgco2` against a type- and
scenario-specific decarbonisation pathway and finds the first year it exceeds the pathway:

```js
interpolatePathway(pathwayObj):                       // 5-yearly points → annual, linear
  frac = (y − lower.year) / (upper.year − lower.year)
  val  = lower.val + (upper.val − lower.val)·frac
computeStrandYear(carbonIntensity, typeKey, scenario):
  for p in path (2020..2050): if carbonIntensity > p.val return p.year
  return '>2050'                                       // never stranded within horizon
```

Retrofit economics (real DCF):
```js
annualSavingsKwh = EUI · GFA · savings_kwh_pct/100
annualSavingsUSD = annualSavingsKwh · $0.12/kWh / 1e6           // energy tariff
npv = Σ_{i=1..20} annualSavingsUSD/(1+r)^i − cost_usd_mn         // 20-yr NPV
abatementCost = annualCarbonReduction>0 ? cost·1e6/(reduction·20) : 0   // $/tCO2e over 20yr
```

### 7.2 Parameterisation / scoring rubric

| Parameter | Value | Provenance |
|---|---|---|
| Pathway table | 9 types × 3 scenarios × 7 anchor years (kgCO₂/m²/yr) | curated approximation of CRREM v2 pathways |
| Scenarios | `1.5`, `WB2` (well-below-2°C), `2.0` | CRREM scenario set |
| e.g. Office 1.5°C 2030 target | (see `CRREM_PATHWAYS.Office`) declining to 0 by 2050 | curated |
| DataCentre 1.5°C | 250→0 kgCO₂/m² (highest-intensity type) | curated, reflects DC energy load |
| Energy tariff | `$0.12/kWh` | hard-coded assumption |
| Retrofit discount rate | `discountRate` (default set in state) | user-set |
| NPV horizon | 20 years | modelling choice |
| Carbon-decline preview | `carbon·0.985^(y−2026)` (≈1.5%/yr) | illustrative asset trajectory |
| Retrofit stacking caps | `min(80%, Σ savings)`, `min(80%, Σ carbon)` | prevents >100% reduction |

The pathways are internally consistent (all converge toward 0 at 2050 for 1.5°C; higher terminal
values for 2.0°C) and ordered by property-type energy intensity — a faithful reproduction of CRREM's
*shape*, if not its exact licensed values.

### 7.3 Calculation walkthrough

Portfolio loaded → filtered → per-property stranding computed via `computeStrandYear`. Portfolio KPIs
aggregate real fields (avg EUI, avg carbon intensity, total GFA/GAV/Scope1/Scope2, avg renewable
share, avg stranding year, count stranded before 2030, EU-taxonomy-aligned %). Retrofit Planner
toggles measures (`renovToggles`), stacks their savings/carbon-reduction percentages (capped 80%),
recomputes adjusted EUI/carbon and re-runs the stranding crossover to show a *delayed* stranding year.

### 7.4 Worked example (Office asset, 1.5°C)

Take an Office with `carbon_intensity_kgco2 = 45`. The Office 1.5°C pathway interpolates between
anchor points; suppose the annual pathway value drops below 45 in year **2028** (between the 2025 and
2030 anchors). Then:

```
computeStrandYear(45, 'Office', '1.5') = 2028   (first year 45 > pathway(y))
```
Apply a retrofit stack (LED 10% + HVAC 16% carbon → say 22% carbon reduction, capped):
```
adjustedCarbon = 45·(1 − 0.22) = 35.1 kgCO₂/m²
```
Re-running the crossover pushes the stranding year later (e.g. 2033) — the delay is the retrofit's
value. Retrofit NPV: a $2.0M HVAC upgrade saving 16% of (EUI·GFA)·$0.12/kWh, discounted 20 years, net
of $2.0M, yields the displayed NPV; abatement cost = `$2.0M / (annual tCO₂ saved × 20)`.

### 7.5 Companion analytics

Energy-source-mix stacked bars (grid/gas/solar/wind/district per property), Scope 1/2 pie, GRESB
alignment, physical-risk overlays (flood/cyclone/wildfire/heatwave/drought/sea-level per property),
and a sortable property table. EU-taxonomy alignment flag per property feeds `euTaxAlignedPct`.

### 7.6 Data provenance & limitations

- **Property data is a curated 30-asset demo portfolio** (named funds, plausible EUI/carbon/GAV
  fields), persisted to `localStorage`; not seeded via PRNG but not real assets either.
- **Pathways are a simplified reproduction** of CRREM v2, in carbon intensity not EUI; the licensed
  CRREM dataset has country×type granularity this table lacks (it is type×scenario only).
- Stranding is a hard crossover (no partial/probabilistic stranding); retrofit stacking is additive
  with an 80% cap rather than an engineering interaction model; single $0.12/kWh tariff worldwide.

**Framework alignment:** CRREM v2 (Carbon Risk Real Estate Monitor — 1.5°C/WB2°C/2°C decarbonisation
pathways derived from IPCC sectoral carbon budgets allocated to buildings via convergence); GRESB Real
Estate Assessment (companion tab); EU EPBD / EPC minimum standards; GHG Protocol RE operational
carbon. The stranding-crossover and retrofit-NPV logic faithfully implement CRREM's decision framework;
only the pathway values are approximated rather than licensed.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** (The stranding and NPV logic *are*
implemented; what is missing is the **licensed CRREM pathway dataset with country×type granularity**
and an EUI-based rather than carbon-intensity-based comparison.)

**8.1 Purpose & scope.** Asset- and portfolio-level stranding risk for real estate against
science-based decarbonisation pathways, with retrofit capex optimisation, for TCFD/SFDR real-estate
climate disclosure.

**8.2 Conceptual approach.** The canonical **CRREM v2** method — dual EUI (kWh/m²) *and* GHG-intensity
(kgCO₂/m²) crossover against country- and type-specific 1.5°C pathways — benchmarked against **GRESB**
transition indicators and **PCAF** real-estate financed-emissions accounting.

**8.3 Mathematical specification.**
```
Pathway_{c,type,scen}(t)  = licensed CRREM v2 annual grid-decarbonised trajectory
GHGintensity(t) = (Scope1 + Scope2_location·GridEF_c(t)) / GFA        # grid greening over time
StrandYear = min{t : GHGintensity(t) > Pathway_{c,type,scen}(t)}
ExcessCarbon = Σ_{t≥StrandYear} (GHGintensity(t) − Pathway(t))·GFA    # cumulative overshoot
RetrofitNPV = Σ_t [ΔEnergy·Tariff_c(t) + ΔCarbon·CarbonPrice(t)]·DF(t) − Capex
```

| Parameter | Source |
|---|---|
| `Pathway_{c,type,scen}` | CRREM v2 licensed dataset (country×type×scenario) |
| `GridEF_c(t)` | IEA / national grid decarbonisation projections |
| `Tariff_c(t)` | national energy price forecasts (IEA WEO) |
| `CarbonPrice(t)` | EU ETS forward curve / internal price |

**8.4 Data requirements.** Per-asset EUI + GHG intensity, country, type, GFA; grid EF trajectory by
country; retrofit cost/savings library; carbon-price curve. The platform already holds asset fields
and retrofit measures; the licensed CRREM pathway grid and grid-EF time series are the additions.

**8.5 Validation & benchmarking.** Reconcile stranding years to CRREM's own tool for sample assets;
verify grid-greening improves stranding correctly; benchmark portfolio %-stranded against GRESB peer
percentiles; retrofit NPV cross-checked with quantity-surveyor cost models.

**8.6 Limitations & model risk.** Pathway licensing and country granularity are the main gaps; grid-EF
forecasts dominate long-horizon stranding; retrofit interactions are non-additive in reality.
Fallback: report stranding under all three scenarios and flag assets sensitive to grid assumptions.
