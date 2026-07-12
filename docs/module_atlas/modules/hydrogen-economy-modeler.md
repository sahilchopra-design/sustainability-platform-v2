# Hydrogen Economy Modeler
**Module ID:** `hydrogen-economy-modeler` · **Route:** `/hydrogen-economy-modeler` · **Tier:** A (backend vertical) · **EP code:** EP-CL3 · **Sprint:** CL

## 1 · Overview
Green/blue/gray H₂ cost parity timelines, electrolyzer learning curves, infrastructure buildout, and export hub viability.

**How an analyst works this module:**
- H₂ Cost Parity Timeline shows green/blue/gray crossover
- Electrolyzer Learning Curves compare AEL/PEM/SOEC
- Export Hub Viability assesses 6 potential H₂ export hubs

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DEMAND_SECTORS`, `ELECTROLYZERS`, `EXPORT_HUBS`, `H2_TYPES`, `INFRA`, `KPI`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `H2_TYPES` | 4 | `desc`, `color`, `cost2024`, `cost2030`, `cost2040`, `cost2050` |
| `ELECTROLYZERS` | 4 | `cost2024`, `cost2030`, `cost2040`, `efficiency`, `lifetime`, `trl`, `maturity` |
| `INFRA` | 5 | `needed2030`, `needed2040`, `needed2050`, `costPerUnit`, `unit` |
| `DEMAND_SECTORS` | 7 | `demand2030`, `demand2040`, `demand2050`, `color` |
| `EXPORT_HUBS` | 7 | `advantage`, `greenCost`, `exportCapacity`, `readiness` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `costTimeline` | `[2024,2026,2028,2030,2035,2040,2045,2050].map(yr=>({` |
| `cost` | `h.cost2024 + (h.cost2050-h.cost2024)*t + (h.cost2030-h.cost2024-(h.cost2050-h.cost2024)*((2030-2024)/(2050-2024)))*Math.sin(Math.PI*t);` |
| `learningCurve` | `[2024,2026,2028,2030,2033,2036,2040,2045,2050].map(yr=>({` |
| `totalDemand2030` | `DEMAND_SECTORS.reduce((s,d)=>s+d.demand2030,0);` |
| `totalDemand2050` | `DEMAND_SECTORS.reduce((s,d)=>s+d.demand2050,0);` |
| `totalInfraInvest` | `INFRA.reduce((s,inf)=>s+inf.needed2040*inf.costPerUnit,0);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/hydrogen/demand-sector` | `demand_sector` | api/v1/routes/hydrogen.py |
| POST | `/api/v1/hydrogen/eu-h2-bank` | `eu_h2_bank` | api/v1/routes/hydrogen.py |
| POST | `/api/v1/hydrogen/cost-trajectory` | `cost_trajectory` | api/v1/routes/hydrogen.py |
| POST | `/api/v1/hydrogen/portfolio` | `portfolio` | api/v1/routes/hydrogen.py |
| GET | `/api/v1/hydrogen/ref/h2-colours` | `ref_h2_colours` | api/v1/routes/hydrogen.py |
| GET | `/api/v1/hydrogen/ref/production-pathways` | `ref_production_pathways` | api/v1/routes/hydrogen.py |
| GET | `/api/v1/hydrogen/ref/country-costs` | `ref_country_costs` | api/v1/routes/hydrogen.py |

### 2.3 Engine `hydrogen_economy_engine` (services/hydrogen_economy_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | lo, hi, val |  |
| `_annuity_factor` | rate, years | Annuity factor for CAPEX annualisation. |
| `HydrogenEconomyEngine.calculate_lcoh` | entity_id, production_pathway, capacity_mw_el, country_code, capacity_factor_pct, financing_cost_pct, year |  |
| `HydrogenEconomyEngine.assess_rfnbo_compliance` | entity_id, production_pathway, country_code, re_source, hourly_matching, temporal_correlation, year, measured_ghg_intensity_kgco2e_kgh2 |  |
| `HydrogenEconomyEngine.assess_demand_sector` | entity_id, demand_sector, annual_h2_demand_t, country_code, current_fuel_type, green_lcoh_usd_kg |  |
| `HydrogenEconomyEngine.assess_eu_h2_bank` | entity_id, production_pathway, capacity_mw_el, country_code, lcoh_usd_kg, competitive_bid_price_eur_kg |  |
| `HydrogenEconomyEngine.project_cost_trajectory` | entity_id, production_pathway, country_code, base_lcoh_2024_usd_kg |  |
| `HydrogenEconomyEngine.assess_portfolio` | entity_id, projects |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `DEMAND_SECTORS`, `ELECTROLYZERS`, `EXPORT_HUBS`, `H2_TYPES`, `INFRA`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green H₂ Parity | — | Hydrogen Council | When green H₂ cost = gray H₂ cost |
| Demand Sectors | — | IEA | Steel (DRI), ammonia, transport, power |

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/hydrogen/ref/country-costs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['country_electricity_costs', 'eu_h2_bank_eligibility', 'source'], 'n_keys': 3}`

**GET /api/v1/hydrogen/ref/h2-colours** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['h2_colours', 'rfnbo_ghg_threshold_kgco2e_kgh2', 'source'], 'n_keys': 3}`

**GET /api/v1/hydrogen/ref/production-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['production_pathways', 'rfnbo_criteria', 'source'], 'n_keys': 3}`

**POST /api/v1/hydrogen/cost-trajectory** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/hydrogen/demand-sector** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/hydrogen/eu-h2-bank** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/hydrogen/lcoh** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/hydrogen/portfolio** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Electrolyzer learning curve
**Headline formula:** `Cost(t) = Cost₂₀₂₄ × (CumulativeCapacity(t)/CumulativeCapacity₂₀₂₄)^(-LearningRate)`

Green H₂ reaches parity with gray at ~$2/kg (projected 2028-2032). Three electrolyzer types: Alkaline (cheapest, 70% efficiency), PEM (flexible, 75%), SOEC (most efficient, 85%, earliest stage).

**Standards:** ['Hydrogen Council', 'IRENA', 'IEA']
**Reference documents:** Hydrogen Council; IRENA Green Hydrogen; IEA Hydrogen Report

**Engine `hydrogen_economy_engine` — extracted transformation lines:**
```python
r = rate / 100.0
H2_LHV_KWH_PER_KG = 33.33  # kWh/kg LHV
capacity_kw = capacity_mw_el * 1000.0
cf = _clamp(5.0, 95.0, capacity_factor_pct) / 100.0
annual_hours = 8760.0 * cf
annual_h2_kwh = capacity_kw * annual_hours * efficiency
annual_h2_kg = annual_h2_kwh / self.H2_LHV_KWH_PER_KG
annual_h2_t = annual_h2_kg / 1000.0
annual_capex = capex_total_usd * annuity
capex_component = round(annual_capex / max(annual_h2_kg, 1.0), 4)
opex_component = round(annual_opex / max(annual_h2_kg, 1.0), 4)
annual_elec_kwh = capacity_kw * annual_hours
annual_elec_cost = annual_elec_kwh * elec_cost
electricity_component = round(annual_elec_cost / max(annual_h2_kg, 1.0), 4)
lcoh = round(capex_component + opex_component + electricity_component, 4)
doublings_to_year = max(0.0, (year - 2024) / 3.0)
learning_factor = (1.0 - 0.18) ** doublings_to_year
lcoh_adjusted = round(lcoh * learning_factor, 4)
abatement_tco2_pa = round(annual_h2_demand_t * abatement_factor * 10, 2)
green_premium_usd_kg = round(green_premium_base - incumbent_cost, 2)
co2_per_kg_h2_abated = abatement_factor * 10
breakeven_carbon = round(green_premium_usd_kg / max(co2_per_kg_h2_abated, 0.001), 2)
lcoh_eur_kg = round(lcoh_usd_kg * eur_usd, 3)
subsidy_eur_kg = round(_clamp(0.0, max_subsidy, lcoh_eur_kg - target_price), 3)
annual_h2_kg = capacity_mw_el * 1000 * 8760 * 0.30 * 0.70 / self.H2_LHV_KWH_PER_KG
total_subsidy_eur = round(subsidy_eur_kg * annual_h2_kg * 10 / 1e6, 2)  # 10-year contract
gap_to_grid_parity = round(lcoh_eur_kg - target_price, 3)
base_lcoh = 4.0  # reference green-electrolysis LCOH, 2024
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **4** other module(s).
**Shared engines (edits propagate!):** `hydrogen_economy_engine` (used by 5 modules)

| Connected module | Shared via |
|---|---|
| `hydrogen-project-finance` | engine:hydrogen_economy_engine |
| `hydrogen-market-intelligence` | engine:hydrogen_economy_engine |
| `hydrogen-storage-transport` | engine:hydrogen_economy_engine |
| `hydrogen-derivatives-comparison` | engine:hydrogen_economy_engine |

## 7 · Methodology Deep Dive

This module projects H₂ **cost-parity timelines**, electrolyser **cost-down curves**, infrastructure
buildout capex, sector demand and export-hub viability. Despite the guide (EP-CL3) naming an
experience-curve law `Cost(t)=Cost₂₀₂₄×(CumCap(t)/CumCap₂₀₂₄)^(−LR)`, the code does **not** implement
a learning curve on cumulative capacity — it interpolates cost between anchor years. The mismatch is
methodological (interpolation vs Wright's-law), so it is flagged below.

> ⚠️ **Guide↔code note.** The guide's headline formula is the classic Wright/experience-curve
> `Cost(t) = Cost₀ × (CumCap(t)/CumCap₀)^(−LearningRate)`. The code instead uses a **time-based
> interpolation** between hard-coded cost anchors (2024/2030/2040/2050). No cumulative-capacity series
> or learning-rate exponent appears anywhere in the file. Costs are therefore scenario assumptions,
> not endogenous outputs of a deployment model.

### 7.1 What the module computes

**H₂ cost parity** — sinusoidally-adjusted linear interpolation between anchor costs:

```js
t    = (yr − 2024) / (2050 − 2024)
cost = cost2024 + (cost2050 − cost2024)·t
       + (cost2030 − cost2024 − (cost2050 − cost2024)·((2030−2024)/(2050−2024)))·sin(π·t)
cost = max(0.5, cost)
```

The `sin(π·t)` term is a bump that forces the interpolated curve through the 2030 anchor while
returning to the linear endpoints at t=0 and t=1 (sin 0 = sin π = 0). It is a **curve-fitting
device**, not a decarbonisation dynamic.

**Electrolyser learning curve** — a piecewise linear blend of 2024→2040 anchors (also not Wright's law).

**Infrastructure investment**:

```js
totalInfraInvest = Σ_item  needed2040 × costPerUnit
```

### 7.2 Parameterisation (anchor tables)

| H₂ type | 2024 | 2030 | 2040 | 2050 ($/kg) | Basis |
|---|---|---|---|---|---|
| Green (electrolysis+RE) | 4.5 | 2.8 | 1.5 | 1.0 | Hydrogen Council / IRENA cost-down |
| Blue (SMR+CCS) | 2.0 | 1.8 | 1.6 | 1.5 | Gas-price + CCS capex |
| Gray (SMR) | 1.2 | 1.5 | 2.0 | 2.8 | Rises with carbon price |

| Electrolyser | 2024 $/kW | 2030 | 2040 | η % | Life (h) | TRL |
|---|---|---|---|---|---|---|
| Alkaline (AEL) | 700 | 400 | 250 | 65 | 80 000 | 9 |
| PEM | 1200 | 600 | 350 | 60 | 60 000 | 8 |
| SOEC | 2500 | 1000 | 500 | 80 | 40 000 | 6 |

| Infra item | needed 2040 | $/unit | 2040 capex |
|---|---|---|---|
| Pipeline (km) | 75 000 | 1.5 $M/km | $112.5B |
| Storage (TWh) | 3.0 | 500 $M/TWh | $1.5B |
| Terminals | 25 | 800 $M/unit | $20B |
| Electrolyzers (GW) | 550 | 600 $M/GW | $330B |

All anchor values are consistent with published Hydrogen Council / IRENA / IEA ranges; they are
**assumptions**, not model outputs.

### 7.3 Calculation walkthrough

`costTimeline` and `learningCurve` are computed once at module load over fixed year vectors.
`totalDemand2030/2050` sum the `DEMAND_SECTORS` table; `totalInfraInvest` sums `needed2040×costPerUnit`
(≈$464B, displayed as "~$464B needed by 2040"). The parity KPI is a static "~2032" string, not
derived from the crossover of the green and gray curves.

### 7.4 Worked example (Green H₂ at 2035)

```
t     = (2035−2024)/26 = 0.423
linear= 4.5 + (1.0−4.5)·0.423 = 4.5 − 1.48 = 3.02
bump  = (2.8 − 4.5 − (1.0−4.5)·(6/26))·sin(π·0.423)
      = (2.8 − 4.5 + 0.808)·sin(1.329)
      = (−0.892)·0.971 = −0.866
cost  = max(0.5, 3.02 − 0.866) = $2.15/kg
```

So green H₂ interpolates to ≈$2.15/kg in 2035 — between the 2030 anchor ($2.8) and 2040 anchor
($1.5), with the sine bump honouring the 2030 waypoint.

### 7.5 Data provenance & limitations

- All cost/demand/infra figures are **hand-authored anchors** from Hydrogen Council / IRENA / IEA;
  no PRNG randomness is used here (the seeded `sr` from sibling modules is absent).
- The **learning curve is not a learning curve** — no cumulative capacity, no experience-rate
  exponent. Parity is therefore not endogenous to deployment; a policy shock cannot move the curve.
- Blue/gray cost paths embed an implicit carbon-price rise (gray climbs 1.2→2.8) but no explicit
  carbon-price input is exposed.

## 8 · Model Specification — Endogenous H₂ Cost-Down (Wright experience curve)

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Turn the displayed cost paths into *outputs* of a deployment model so parity year responds to policy,
capacity additions and electricity price — the decision the guide's formula promises.

### 8.2 Conceptual approach
Wright's law (one-factor experience curve) on cumulative electrolyser capacity, mirroring IEA ETP and
BNEF electrolyser cost-down modelling, coupled to an LCOH stack (electricity + capex CRF + O&M).

### 8.3 Mathematical specification
```
CAPEX(t)   = CAPEX₀ · (CumCap(t)/CumCap₀)^(−b),  b = −log₂(1−LR)   (LR = learning rate)
CRF        = r(1+r)^N / ((1+r)^N − 1)
LCOH(t)    = [CAPEX(t)·CRF + O&M] / (8760·CF·η_kg) + P_elec(t)/(η_kWh)  + waterOPEX
Parity year= min{ t : LCOH_green(t) ≤ LCOH_gray(t) + CarbonPrice(t)·EF_gray }
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `LR` | Learning rate per doubling | IRENA 13–18% (PEM); IEA ETP |
| `CumCap(t)` | Installed GW trajectory | IEA H₂ project database; BNEF pipeline |
| `P_elec(t)` | Electricity price path | NGSF/IEA WEO regional LCOE |
| `EF_gray` | Gray H₂ emissions factor | ~9–10 kgCO₂/kgH₂ (IEA) |
| `CarbonPrice(t)` | Policy path | EU ETS forward; NGFS carbon-price scenarios |
| `r, N` | WACC, plant life | Project-finance defaults (7–9%, 20–25 y) |

### 8.4 Data requirements
Electrolyser capex anchors (have), installed-capacity trajectory (needs IEA/BNEF pipeline ingest),
regional electricity price paths, carbon-price scenarios (partially in platform NGFS/ETS contexts),
capacity factor by resource region (export-hub table gives a proxy).

### 8.5 Validation & benchmarking plan
Backtest capex against realised 2015–2024 electrolyser prices (BNEF series); reconcile parity year
against IEA/BNEF published parity ranges; sensitivity of parity to LR (±5pp) and electricity price
(±$20/MWh); stability under alternative capacity trajectories.

### 8.6 Limitations & model risk
One-factor Wright's law ignores input-cost shocks (iridium/platinum for PEM) and floors capex too
aggressively at extreme cumulative capacity — cap CAPEX at a technology floor. Parity is sensitive to
the assumed electricity price and carbon path; present a parity *range*, not a point year.

**Framework alignment:** IRENA *Green Hydrogen Cost Reduction* (learning rates) · IEA *Global Hydrogen
Review* / ETP (cost-down + demand) · Hydrogen Council *Hydrogen Insights* (parity narrative). The
current module reproduces their published *ranges* as fixed anchors rather than deriving them.

## 9 · Future Evolution

### 9.1 Evolution A — Endogenous Wright's-law parity engine (analytics ladder: rung 2 → 3)

**What.** The §7 flag is methodological: the guide promises `Cost(t) = Cost₀ × (CumCap/CumCap₀)^(−LR)` but the page interpolates between hard-coded 2024/2030/2040/2050 anchors with a `sin(π·t)` curve-fitting bump, and even the shared engine's `project_cost_trajectory` uses time-based doublings (`(year−2024)/3`), not cumulative capacity. Parity is a static "~2032" string, not the crossover of computed curves. Evolution A implements the §8 spec in `hydrogen_economy_engine`: CAPEX declining with cumulative installed capacity (`b = −log₂(1−LR)`, LR 13–18% per IRENA), LCOH stack from the engine's existing CRF/electricity components, and parity year solved as `min{t: LCOH_green ≤ LCOH_gray + CarbonPrice(t)·EF_gray}` — so a policy shock finally moves the curve.

**How.** (1) Ingest an installed-capacity trajectory (IEA Hydrogen Projects Database, public) as the `CumCap(t)` series; expose LR and carbon-price path (NGFS scenarios already in-platform) as request parameters on an upgraded `/cost-trajectory`. (2) Backtest per §8.5: reproduce realised 2015–2024 electrolyser price declines within tolerance — that pin goes into bench_quant. (3) The frontend's `costTimeline` and parity KPI switch from anchors to engine output, with the anchor table retained as a labeled comparison overlay. Engine changes are additive — 4 sibling modules share `hydrogen_economy_engine` (§6 blast radius).

**Prerequisites.** Cumulative-capacity data ingestion; regression tests on the 5 dependent modules before the shared-engine change merges. **Acceptance:** parity year shifts when LR or carbon path shifts; backtest error against the BNEF/IRENA realised series reported in the response, not hidden.

### 9.2 Evolution B — H₂ strategy analyst running the deployed route family (LLM tier 2)

**What.** The page displays static anchors while five real POST endpoints sit underneath it largely uncalled (`/lcoh`, `/cost-trajectory`, `/demand-sector`, `/eu-h2-bank`, `/portfolio` — all `skipped` in the lineage sweep). Evolution B is a tool-calling analyst that puts them to work: "LCOH for a 500 MW PEM plant in Spain at 45% capacity factor?", "which demand sector abates carbon cheapest at $2.50/kg green H₂?", "what EU H₂ Bank subsidy would this project need, and does it fit under the ceiling?"

**How.** Tier 2 per the roadmap: tool schemas auto-generated from the hydrogen route family (all read-only, Pydantic-typed); per-module system prompt from this Atlas page — §7.2's anchor tables and the §7.5 caveat that displayed curves are assumptions, which the analyst must repeat when asked "is parity endogenous?". Multi-step questions ("compare AEL vs PEM vs SOEC for my project") decompose into repeated `/lcoh` calls varying `production_pathway`, with the comparison table assembled from tool outputs only. Breakeven-carbon and subsidy figures quote the engine's own response fields (`breakeven_carbon`, `subsidy_eur_kg`, `total_subsidy_eur`).

**Prerequisites.** Tool-calling infrastructure (Phase 2); no backend work needed — this is the rare module where tier 2 is deployable before Evolution A. **Acceptance:** every $/kg and subsidy figure matches a logged endpoint response; asked for parity-year sensitivity before Evolution A ships, the analyst explains the anchor-based limitation rather than inventing a sensitivity.