# Api::Real_Asset_Decarb
**Module ID:** `api::real_asset_decarb` · **Route:** `/api/v1/real-asset-decarb` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/real-asset-decarb/lock-in-risk` | `post_lock_in_risk` | api/v1/routes/real_asset_decarb.py |
| POST | `/api/v1/real-asset-decarb/capex-transition` | `post_capex_transition` | api/v1/routes/real_asset_decarb.py |
| POST | `/api/v1/real-asset-decarb/retrofit-npv` | `post_retrofit_npv` | api/v1/routes/real_asset_decarb.py |
| POST | `/api/v1/real-asset-decarb/brown-to-green` | `post_brown_to_green` | api/v1/routes/real_asset_decarb.py |
| POST | `/api/v1/real-asset-decarb/decarb-roadmap` | `post_decarb_roadmap` | api/v1/routes/real_asset_decarb.py |
| GET | `/api/v1/real-asset-decarb/ref/asset-types` | `get_asset_types` | api/v1/routes/real_asset_decarb.py |
| GET | `/api/v1/real-asset-decarb/ref/retrofit-measures` | `get_retrofit_measures` | api/v1/routes/real_asset_decarb.py |
| GET | `/api/v1/real-asset-decarb/ref/crrem-pathways` | `get_crrem_pathways` | api/v1/routes/real_asset_decarb.py |
| GET | `/api/v1/real-asset-decarb/ref/sbti-sectors` | `get_sbti_sectors` | api/v1/routes/real_asset_decarb.py |
| GET | `/api/v1/real-asset-decarb/ref/abatement-costs` | `get_abatement_costs` | api/v1/routes/real_asset_decarb.py |

### 2.3 Engine `real_asset_decarb_engine` (services/real_asset_decarb_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | v, lo, hi |  |
| `_mid` | rng | Deterministic midpoint of a documented reference range (MODEL parameter, not an entity metric). Used when no entity-specific value is supplied. |
| `_npv` | cash_flows, discount_rate |  |
| `assess_lock_in_risk` | entity_id, asset_type, age_years, capex_cycle_years, current_intensity, asset_value_usd, floor_area_m2 | Assess stranded asset lock-in risk. Returns lock-in horizon, stranded cost, CRREM pathway divergence, SBTi sector decarbonisation rate, and carbon price risk. ``asset_value_usd`` (entity book/market value) and ``floor_area_m2`` (gross floor area) are optional. When supplied, stranded cost and emissions-at-risk are computed deterministically from them; when absent they are returned as honest nulls  |
| `plan_capex_transition` | entity_id, asset_type, current_emissions, target_year, budget_usd, floor_area_m2, brown_asset_disposal_value_usd | Build capex transition plan with abatement cost curve. Returns capex stack by technology, year-by-year trajectory, and capital recycling from brown-to-green conversion. Abatement costs and green-exit premium use the documented midpoint of the IPCC AR6 / JLL reference ranges as MODEL parameters (flagged via ``*_basis`` fields), not random draws. ``floor_area_m2`` and ``brown_asset_disposal_value_us |
| `calculate_retrofit_npv` | entity_id, building_type, retrofit_measures, floor_area_m2, energy_intensity_kwh_m2, energy_cost_per_kwh | Calculate NPV of building retrofit measures. Returns energy savings %, CAPEX/OPEX, payback period, NPV at 5/7/10% discount rates, and CRREM alignment post-retrofit. Per-measure energy-saving % and capex/m² use the documented midpoint of the measure's reference range as MODEL parameters (flagged ``*_basis``). The absolute economics (capex, annual saving, NPV, payback) require the entity's ``floor_a |
| `model_brown_to_green` | entity_id, portfolio, transition_scenarios | Model brown-to-green portfolio transformation 2025-2050. Returns per-asset capex, stranded risk reduction, green value uplift, portfolio emissions trajectory across CRREM 1.5C/2C scenarios. Each portfolio asset dict may supply ``book_value_usd``, ``capex_required_usd``, ``stranded_risk_pre_usd`` and ``stranded_risk_post_usd``. Per-asset capex and stranded-risk figures are read from these inputs; w |
| `generate_decarb_roadmap` | entity_id, assets, budget_constraint | Generate prioritised decarbonisation roadmap. Ranks by cost-effectiveness, identifies quick wins vs long-horizon, sets interim targets 2025/2030/2035/2040/2050, aligns with TCFD/IFRS S2. ``assets`` must carry real per-asset figures (current_emissions_tco2e, abatement_potential_pct, capex_required_usd). An empty list returns an honest ``insufficient_data`` result rather than a fabricated demo set. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `brown`, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/real-asset-decarb/ref/abatement-costs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['abatement_technologies', 'carbon_price_scenarios'], 'n_keys': 2}`

**GET /api/v1/real-asset-decarb/ref/asset-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['asset_types'], 'n_keys': 1}`

**GET /api/v1/real-asset-decarb/ref/crrem-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['crrem_pathways'], 'n_keys': 1}`

**GET /api/v1/real-asset-decarb/ref/retrofit-measures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['retrofit_measures'], 'n_keys': 1}`

**GET /api/v1/real-asset-decarb/ref/sbti-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sbti_sector_rates', 'sbti_nz_standard'], 'n_keys': 2}`

**POST /api/v1/real-asset-decarb/brown-to-green** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/real-asset-decarb/capex-transition** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/real-asset-decarb/decarb-roadmap** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `real_asset_decarb_engine` — extracted transformation lines:**
```python
years_to_next_capex = max(0.0, capex_cycle_years - (age_years % max(capex_cycle_years, 1)))
intensity_divergence = current_intensity - crrem_2030
divergence_pct = (intensity_divergence / crrem_2030 * 100) if crrem_2030 > 0 else 0.0
t = year - 2024
pathway_t = max(0.0, base_intensity * (1 - sbti_rate) ** t)
emissions_at_risk = current_intensity * floor_area_m2 / 1000.0
carbon_price_risk_usd = round(emissions_at_risk * carbon_price_2030, 0)
horizon = max(5, min(25, target_year - base_year))
invest_req = max_red * abatement_cost
max_red = remaining_budget / abatement_cost
remaining_emissions = max(0.0, remaining_emissions - max_red)
remaining_budget = max(0.0, remaining_budget - invest_req)
annual_capex = round(budget_usd / max(horizon, 1), 0)
years = list(range(base_year, base_year + horizon + 1))
annual_red = running * sbti_rate
running = max(0.0, running - annual_red)
capex_total = floor_area_m2 * capex_per_m2
cash_flows = [-capex_total] + [effective_saving] * project_life
cumulative_saving_pct = min(100.0, cumulative_saving_pct + energy_saving * 0.7)
post_retrofit_intensity = current_intensity * (1 - min(cumulative_saving_pct, 90.0) / 100.0)
tco2e_red = emissions * abatement_pct / 100
cost_eff = tco2e_red / max(capex, 1) * 1_000_000
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/real_asset_decarb_engine.py` (engine E74) is a five-function real-asset
decarbonisation toolkit exposed via `api/v1/routes/real_asset_decarb.py`:

| Function | Route | Core output |
|---|---|---|
| `assess_lock_in_risk` | (part of roadmap/brown-to-green flows) | lock-in score 0–100, stranding year, stranded cost |
| `plan_capex_transition` | `POST /capex-transition` | greedy abatement-technology capex stack + SBTi trajectory |
| `calculate_retrofit_npv` | (retrofit-measures ref + NPV) | per-measure NPV @5/7/10%, payback, CRREM alignment |
| `model_brown_to_green` | `POST /brown-to-green` | portfolio capex, stranded-risk reduction, green uplift |
| `generate_decarb_roadmap` | `POST /decarb-roadmap` | budget-constrained, cost-effectiveness-ranked action plan |

Key formulas quoted from code:

```
lock_in_score = clamp( (max(gap,0)/base_int)×50 + (remaining_life/typical_life)×30
                       + (years_to_next_capex/capex_cycle)×20 , 0, 100)
stranding year = first y in 2025–2050 with base_int×(1−sbti_rate)^(y−2024) ≤ current_intensity
stranded_cost = asset_value × (remaining_life/typical_life) × max(gap,0)/base_int
cost_effectiveness = tCO2e_reduction / capex × 1,000,000     # tCO2e per $M, greedy-ranked
retrofit NPV = −capex + Σ_life effective_saving/(1+r)^t ,  r ∈ {5%, 7%, 10%}
effective_saving = annual_energy_cost × saving% × (1 − cumulative_saving%/100)
```

### 7.2 Parameterisation

**Asset-type registry** (`ASSET_TYPES`, 8 types) — each carries sector, typical life, capex
cycle, CRREM 2030 intensity target, SBTi sector decarbonisation rate, stranding threshold and a
green-premium range. Extract:

| Type | Life (y) | CRREM 2030 kgCO₂/m² | SBTi rate %/pa | Stranded ≥ kgCO₂/m² | Green premium |
|---|---|---|---|---|---|
| office | 40 | 15 | 7.0 | 70 | 5–15% |
| retail | 35 | 18 | 7.0 | 80 | 3–10% |
| steel_plant | 25 | 800 | 4.2 | 2,200 | 1–5% |
| cement_plant | 30 | 550 | 4.2 | 1,100 | 0.5–3% |
| data_centre | 20 | 100 | 7.0 | 450 | 2–8% |
| logistics | 30 | 30 | 3.8 | 100 | 2–7% |

SBTi rates 7.0 / 4.2 / 3.8 %pa (buildings / industry / transport) are cited to SBTi sector
guidance in the module docstring. **Retrofit measures** (9, from insulation to CCS and
electrification) carry saving-% ranges, capex/m² ranges and lifespans. **Abatement
technologies** (5) carry IPCC-AR6-cited cost ranges ($5–40/t efficiency … $60–200/t CCS) and
max-reduction caps (30–90%). **Carbon-price scenarios**: conservative/baseline/accelerated,
2025→2050 ($30→$130 / $40→$175 / $55→$220). **CRREM pathways** as %-of-2019 milestones
(1.5C: 85/60/40/20/0; 2C: 90/72/52/32/0).

Crucially, the engine's header documents the platform's **random-as-data remediation**: every
returned metric is either a deterministic computation from caller inputs or an *honest null*
(`insufficient_data`); where literature ranges have no entity value, the `_mid()` **midpoint**
is used as a model parameter and flagged via `*_basis` fields
(`ipcc_ar6_range_midpoint`, `jll_cbre_range_midpoint`, `reference_range_midpoint`).

### 7.3 Calculation walkthrough

`plan_capex_transition` walks the five technologies in registry order (a fixed merit order, not
re-sorted by cost), abating `min(remaining × max_red%, remaining)` tCO₂e at the midpoint cost
until budget or emissions are exhausted; each layer reports
`npv_at_carbon_price = reduction × $75(baseline-2030) × 5 − investment`. The trajectory applies
the SBTi rate as a constant geometric decay with straight-line capex. `calculate_retrofit_npv`
stacks measures with a 0.7 interaction factor on cumulative savings (each new measure saves
against the already-reduced baseline) and caps combined savings at 90%; post-retrofit CRREM
alignment tests `current_avg_intensity × (1 − cum_saving%) ≤ crrem_2030`.
`generate_decarb_roadmap` sorts assets by tCO₂e/$M descending, funds greedily within budget,
tags quick wins (capex < $2M and >5 tCO₂e/$M) vs long-horizon (capex > $10M), and emits interim
targets 2025/2030/2035/2040/2050 at 10/42/55/70/100% reduction (42% by 2030 is the SBTi 1.5°C
cross-sector minimum).

### 7.4 Worked example — lock-in risk (office)

Inputs: age 20y, capex cycle 15y, current intensity 60 kgCO₂e/m², value $80M, 12,000 m².

| Step | Computation | Result |
|---|---|---|
| Remaining life | 40 − 20 | 20 y |
| Years to next capex | 15 − (20 mod 15) | 10 y |
| Divergence vs CRREM 2030 | 60 − 15 | +45 kgCO₂e/m² (+300%) |
| Stranding year | 55×0.93^t ≤ 60 already at t=1 | **2025** |
| Lock-in score | (45/55)×50 + (20/40)×30 + (10/15)×20 = 40.9 + 15 + 13.3 | **69.2 → "high"** |
| Stranded cost | 80M × (20/40) × 45/55 | **$32.7M** |
| Emissions at risk | 60 × 12,000 / 1000 | 720 tCO₂e/pa |
| Carbon price risk | 720 × $75 (baseline 2030) | **$54,000/yr** |

Note the stranding-year loop compares the *sector-average* SBTi decay path (starting at
`current_avg_intensity` 55, not the asset's own 60) against the asset's flat intensity — an
asset above the sector average strands immediately (2025), by construction.

### 7.5 Companion reference endpoints

`GET /ref/asset-types`, `/ref/retrofit-measures`, `/ref/abatement-costs`, `/ref/crrem-pathways`,
`/ref/sbti-sectors` serve the registries above verbatim so frontend modules can render the same
constants the calculators use.

### 7.6 Data provenance & limitations

- **No PRNG anywhere** — this engine is a flagship example of the fabrication remediation:
  midpoint model parameters are labelled, absent inputs produce `insufficient_data` statuses
  rather than invented numbers (e.g. empty portfolio/assets lists return null analyses).
- CRREM 2030 intensity targets and stranding thresholds are single global numbers per asset
  type (real CRREM is country × type × year); the %-of-2019 pathway is a 5-node stylisation.
- The capex stack is greedy in **registry order**, not sorted by marginal abatement cost, so it
  is not a true MACC optimisation; `npv_at_carbon_price` assumes a flat 5-year credit at the
  2030 baseline price.
- Retrofit economics use range midpoints; the 0.7 stacking factor is a modelling assumption.
- `generate_decarb_roadmap` falls back to per-asset defaults (1,000 tCO₂e, 30%, $1M) when a
  field is missing — the only place defaults substitute for entity data.

### 7.7 Framework alignment

- **CRREM v2.0 (2022)** — real CRREM defines country/type-specific carbon- and energy-intensity
  pathways to 2050; the module approximates with type-level 2030/2050 anchors and %-of-2019
  milestones, and tests post-retrofit alignment against the 2030 anchor.
- **SBTi sector guidance** — sector decarbonisation rates (buildings 7%/pa per the SBTi
  buildings guidance draft, industry 4.2%, transport 3.8%) drive trajectories; the 42%-by-2030
  interim target matches the SBTi Corporate Net-Zero Standard's 1.5°C near-term ambition
  (≈4.2%/yr linear reduction).
- **IPCC AR6 WGIII** — abatement-cost ranges per technology; midpoints flagged as model params.
- **TCFD / IFRS S2** — the roadmap response carries explicit `framework_alignment` flags; IFRS
  S2 requires disclosure of transition plans and capex alignment, which the funded/unfunded
  action split supports.
- **JLL/CBRE green-premium research** — source of the green-value-uplift ranges.

## 9 · Future Evolution

### 9.1 Evolution A — Budget-optimal decarbonisation sequencing (analytics ladder: rung 2 → 5)

**What.** The E74 engine is a five-function real-asset decarbonisation toolkit: lock-in risk
scoring, capex-transition planning (a *greedy* abatement-technology stack), retrofit NPV
(@5/7/10% with payback and CRREM alignment), brown-to-green portfolio modelling, and a
budget-constrained decarb roadmap ranked by cost-effectiveness. The core loop is already
scenario-aware (SBTi trajectory `base×(1−sbti_rate)^t`, carbon-price risk), but the roadmap uses
greedy cost-effectiveness ordering (`cost_eff = tCO2e_red / capex`) rather than true optimisation,
and CRREM pathways/abatement costs are static reference tables. Evolution A makes sequencing
optimal and grounds the costs.

**How.** (1) Replace the greedy abatement stack and roadmap ordering with a proper
budget-constrained optimiser (rung 5 prescriptive): maximise cumulative tCO2e abated (or
stranding-risk reduction) subject to the annual capex budget and CRREM-alignment constraints —
scipy optimisation, the roadmap's named pattern for MACC-style engines. (2) Calibrate abatement
costs and CRREM pathways from the platform's real data (shared with `re_clvar`/`glidepath`) rather
than static tables. (3) Add uncertainty on retrofit savings (the `energy_saving × 0.7` realisation
factor is a fixed haircut — make it a range). (4) Bench-pin lock-in score, retrofit NPV, and the
optimised roadmap.

**Prerequisites.** CRREM/abatement-cost data sources; a savings-realisation distribution.
**Acceptance:** the decarb roadmap returns a budget-optimal (not merely greedy) action sequence
with a documented objective; abatement costs carry provenance; retrofit NPV includes a savings
range; bench pins pass.

### 9.2 Evolution B — Decarbonisation-planning copilot for asset owners (LLM tier 2)

**What.** A copilot that runs the suite for an asset or portfolio — "this building is at high
lock-in risk with stranding in 2031; here's the cheapest retrofit path to CRREM alignment within
a €2M budget, NPV-positive at 7%" — each figure from a tool call, with brown-to-green portfolio
planning.

**How.** Five POST endpoints plus rich reference GETs (asset-types, retrofit-measures,
crrem-pathways, sbti-sectors, abatement-costs, carbon-price-scenarios) that ground every constant.
The roadmap endpoint is the natural tier-2 action; the retrofit-NPV and cost-effectiveness outputs
let the copilot rank measures transparently. What-ifs ("raise the budget", "assume a higher carbon
price") re-run statelessly. Core node for a real-estate/infrastructure decarbonisation desk,
cross-linking to `re_clvar` and `real_estate` valuation.

**Prerequisites.** None hard — engine is honest; a fully budget-optimal narrative needs Evolution
A's optimiser (until then the copilot presents the greedy ranking as such). **Acceptance:** every
lock-in score, NPV, and abatement figure traces to a tool response; the copilot labels the roadmap
as greedy-ranked until Evolution A ships optimisation; it cites carbon-price scenario and abatement
source from the reference endpoints and refuses to guarantee stranding avoidance.