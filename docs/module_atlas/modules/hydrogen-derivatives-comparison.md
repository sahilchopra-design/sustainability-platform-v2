# Hydrogen Carrier Comparison Analytics
**Module ID:** `hydrogen-derivatives-comparison` · **Route:** `/hydrogen-derivatives-comparison` · **Tier:** A (backend vertical) · **EP code:** EP-EE6 · **Sprint:** EE

## 1 · Overview
Comprehensive hydrogen carrier and derivatives comparison. Benchmarks GH2, LH2, LOHC, NH3, methanol, e-fuels, DRI-EAF, and e-methane across energy density, storage temperature, transport cost, conversion efficiency, and end-use suitability across five supply chain scenarios.

> **Business value:** Used by hydrogen project developers, shipping companies, infrastructure investors, and energy ministries to select optimal hydrogen carriers for different supply chain scenarios, distances, and end-use applications.

**How an analyst works this module:**
- Review carrier overview for energy density and storage temperature across 8 carriers
- Use transport economics for $/GJ/1000km cost by carrier and distance
- Run supply chain scenarios for optimal carrier by use case
- Examine end-use suitability radar for 5-dimension comparison

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CARRIERS`, `KpiCard`, `SCENARIOS`, `ScoreBar`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CARRIERS` | 9 | `short`, `energy_density_kwh_kg`, `volumetric_density_kwh_L`, `transport_cost_usd_gj_1000km`, `reconversion_efficiency_pct`, `infrastructure_maturity`, `safety_risk`, `best_application`, `color`, `capex_usd_gj_storage`, `notes` |
| `SCENARIOS` | 11 | `winner`, `rationale`, `scores` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Carrier Comparison Matrix', 'Energy Density', 'Transport Cost Model', 'Supply Chain Scenarios', 'End-Use Fit', 'Investment Thesis'];` |
| `transportCosts` | `useMemo(() => CARRIERS.map(c => ({ name: c.short, cost: Math.round(c.transport_cost_usd_gj_1000km * (distanceKm / 1000) * 1000) / 1000, color: c.color, })), [distanceKm]);` |
| `deliveredCostData` | `useMemo(() => CARRIERS.map(c => ({ name: c.short, production: Math.round(15 + sr(CARRIERS.indexOf(c) * 7) * 8), transport: Math.round(c.transport_cost_usd_gj_1000km * (distanceKm / 1000)), reconversionLoss: Math.round((100 - c.reconversion_efficiency_pct) * 0.3), color: c.color, })),` |

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
**Frontend seed datasets:** `CARRIERS`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NH3 Transport Cost ($/GJ/1000km) | `VLGC freight ÷ LHV × distance` | IEA H2 Supply Chain Benchmarking | NH3 LHV = 18.6 GJ/t; at $80/t for 10,000 km = $0.43/GJ per 1000km; cheapest long-haul carrier. |
| LH2 Liquefaction Cost ($/GJ) | `Electricity_for_liquefaction × LCOE + CAPEX_CRF` | CSIRO H2 Roadmap + Kawasaki LH2 Pilot | Liquefaction energy = 6-12 kWh/kg; Kawasaki world's first commercial LH2 supply chain operational 2023. |
| LOHC Dehydrogenation Cost ($/kg H2) | `Heat + catalyst cost for H2 release` | Hydrogenious LOHC Technologies | Requires heat ~290°C; suitable for industrial H2 users with heat integration. |
- **IEA carrier costs + VLGC freight + liquefaction studies + LOHC dehydrogenation data** → Multi-carrier transport cost model + supply chain scenario comparison + radar chart → **Hydrogen carrier selection for export developers, importers, and infrastructure investors**

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
**Methodology:** Carrier Transport Cost & Reconversion Model
**Headline formula:** `Total_cost = production_$/GJ + carrier_conversion + shipping_$/GJ/1000km + reconversion_$/GJ`

At 10,000 km: GH2 prohibitive (>$20/GJ); LH2 $2-4/GJ transport + $1-2/GJ liquefaction; LOHC $1.5-2.5/GJ transport + $1-2/GJ dehydrogenation; NH3 $0.8-1.5/GJ transport + $0.5-1.0/GJ cracking; NH3 cheapest long-distance after pipeline.

**Standards:** ['IRENA Green H2 Cost Reduction Report', 'BNEF Hydrogen Economy Outlook 2024', 'IEA H2 Supply Chain Cost Benchmarking']
**Reference documents:** IRENA (2022) – Global H2 Trade to Meet 1.5°C; BNEF Hydrogen Economy Outlook Q1 2024; IEA Global Hydrogen Review 2023

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
| `hydrogen-economy-modeler` | engine:hydrogen_economy_engine |

## 7 · Methodology Deep Dive

The module is a **carrier trade-off matrix**: it ranks 8 hydrogen carriers/derivatives (compressed
GH₂ at 700/350 bar, LH₂, LOHC, ammonia, methanol, e-fuels, e-methane) across physical properties,
transport cost, reconversion efficiency and use-case fit. Its analytics are mostly a lookup over the
hand-authored `CARRIERS` table plus one distance-scaled transport-cost model; only the delivered-cost
production term is synthetic. The guide (EP-EE6) and code agree — no material mismatch.

### 7.1 What the module computes

**Transport cost vs distance** — the one genuine model:

```js
cost = round(c.transport_cost_usd_gj_1000km × (distanceKm/1000) × 1000) / 1000   // $/GJ, linear in distance
```

**Carrier radar** (6 dimensions, all min/max-clipped to a 0–10 scale):

```js
Energy Density  = min(10, energy_density_kwh_kg / 3.33)     // 33.3 kWh/kg H₂ → 10
Vol. Density    = min(10, volumetric_density_kwh_L × 2)
Transport       = max(0, 10 − transport_cost_usd_gj_1000km × 1.5)   // cheaper = higher
Efficiency      = reconversion_efficiency_pct / 10
Infra Maturity  = infrastructure_maturity × 2                // 1–5 → 2–10
Safety          = (6 − safety_risk) × 2                      // lower risk = higher
```

**Delivered cost stack** (production + transport + reconversion loss):

```js
production      = round(15 + sr(idx*7)*8)                    // $15–23/GJ  ← SYNTHETIC
transport       = round(transport_cost_usd_gj_1000km × distanceKm/1000)
reconversionLoss= round((100 − reconversion_efficiency_pct) × 0.3)
```

### 7.2 Parameterisation — the CARRIERS table (provenance)

| Carrier | E-density kWh/kg | Vol kWh/L | Transport $/GJ/1000km | Reconv. η % | Source note in code |
|---|---|---|---|---|---|
| CGH2-700 | 33.3 | 1.3 | 4.5 | 98 | Mature mobility; tube-trailer/pipeline |
| CGH2-350 | 33.3 | 0.78 | 5.2 | 98 | Most deployed; trucks at 350 bar |
| LH2 | 33.3 | 2.36 | 2.8 | 87 | −253 °C; 30–35% liquefaction energy; boil-off 0.3–3%/day |
| LOHC (DBT) | 1.9 | 1.65 | 1.2 | 60 | Ambient liquid; oil-tanker compatible; high dehydrogenation heat |
| NH3 | 5.2 | 4.32 | 0.8 | 73 | 185 Mt/yr existing trade; toxic/corrosive |
| e-MeOH | 5.5 | 4.35 | 0.7 | 68 | 100 Mt/yr chemical; needs CO₂ source |
| e-Fuels | 11.9 | 9.35 | 0.4 | 95 | Drop-in; CO₂ mandatory; FT/MtJ; $5–8/L now |
| e-CH4 | 13.9 | 0.011* | 0.3 | 77 | Grid-compatible; methanation |

Values are consistent with IRENA PtX Innovation Outlook, IEA H₂ Roadmap, Hydrogen Council and DNV
(cited in the page subtitle). H₂ LHV = 33.3 kWh/kg and NH₃ ≈ 5.2 kWh/kg are correct physical
constants. (*e-CH4 volumetric figure is for the gaseous state — an order-of-magnitude artifact of the
table, not a transport-relevant number.)

The `SCENARIOS` table hand-scores each carrier 0–9 across 5 supply-chain use-cases (short-haul,
long-haul shipping, industrial heat, shipping fuel, back-to-power) — expert judgement, not computed.

### 7.3 Calculation walkthrough

Inputs: `distanceKm` (slider 200–15 000), `selectedCarrier`, `selectedScenario`.
- `transportCosts` re-scales every carrier's per-1000km cost to the chosen distance.
- `radarCarrier` maps the selected carrier's six raw properties to the 0–10 radar.
- `scenarioData` reads the fixed use-case scores for the selected scenario.
- `deliveredCostData` sums a synthetic production term (~$15–23/GJ), the distance-scaled transport
  cost, and a reconversion-loss proxy (`(100−η)×0.3`).

### 7.4 Worked example (NH₃ at 10 000 km)

| Step | Computation | Result |
|---|---|---|
| Transport | `0.8 × (10000/1000)` | **$8.0/GJ** |
| Reconversion loss proxy | `(100−73) × 0.3` | **8.1** ($/GJ proxy) |
| Production (synthetic) | `15 + sr(4*7)*8` | ≈ **$18/GJ** |
| Delivered (stack) | 18 + 8 + 8.1 | ≈ **$34/GJ** |
| Radar Transport score | `10 − 0.8×1.5` | **8.8/10** (best-in-class) |

Contrast CGH2-700 at the same distance: transport `4.5×10 = $45/GJ` — the module's core teaching
point that compressed gas is prohibitive for long-haul while NH₃/e-fuels dominate, matching the guide.

### 7.5 Data provenance & limitations

- The `CARRIERS` physical/cost table is **externally grounded** (IRENA/IEA/DNV/Hydrogen Council) and
  is the module's strength.
- The **production cost term is synthetic** (`sr(idx*7)`) — a $15–23/GJ placeholder that does not
  reflect the real production-cost spread between pathways; only transport is genuinely modelled.
- Reconversion cost is a crude linear proxy (`(100−η)×0.3`), not an energy-balance or capex model;
  it under-represents the LOHC dehydrogenation heat (~290 °C) and NH₃ cracking penalty the guide
  itself flags.
- Transport cost is linear in distance with a per-carrier constant — no economies of scale, no
  vessel-size or boil-off-over-voyage-duration effects.

**Framework alignment:** IRENA *Global Hydrogen Trade to Meet 1.5 °C* / PtX Innovation Outlook —
carrier property table and $/GJ transport benchmarks · IEA *Global Hydrogen Review* / H₂ Supply-Chain
Cost Benchmarking — carrier cost ordering · DNV *Hydrogen Forecast to 2050* — shipping economics.
The module operationalises these as a static comparison matrix rather than a full delivered-LCOH model.

## 9 · Future Evolution

### 9.1 Evolution A — Full delivered-LCOH chain replacing the synthetic production term (analytics ladder: rung 2 → 3)

**What.** The module's strength is its externally-grounded `CARRIERS` table (IRENA/IEA/DNV physical constants); its documented weaknesses are that the delivered-cost stack's production term is a `sr(idx*7)` placeholder ($15–23/GJ, unrelated to pathway economics), reconversion is a crude `(100−η)×0.3` linear proxy, and transport is linear in distance with no boil-off or vessel-scale effects. Evolution A wires the production term to the platform's own `hydrogen_economy_engine.calculate_lcoh` (already live behind `POST /api/v1/hydrogen/lcoh` and country-cost refdata) and builds a proper chain model: LCOH → carrier conversion energy → voyage (boil-off per day for LH₂, 0.3–3%/day per the table's own note) → reconversion energy balance for NH₃ cracking and LOHC dehydrogenation heat.

**How.** (1) New endpoint `POST /hydrogen/delivered-cost` in `api/v1/routes/hydrogen.py` composing `calculate_lcoh` (per production country from `ref/country-costs`) with a per-carrier conversion/reconversion energy model — the §5 quoted ranges (NH₃ cracking $0.5–1.0/GJ, LOHC dehydrogenation $1–2/GJ) become the calibration checks. (2) Voyage-duration-dependent boil-off for LH₂ makes cost genuinely nonlinear in distance. (3) The frontend's `deliveredCostData` swaps its synthetic term for the engine call. Mind the blast radius: `hydrogen_economy_engine` is shared by 5 modules, so LCOH changes must be additive.

**Prerequisites.** The `sr()` production placeholder removed; carrier conversion-energy constants sourced and documented. **Acceptance:** NH₃-at-10,000km delivered cost decomposes into cited components within IEA benchmarking ranges; the same carrier from two production countries differs by their `ref/country-costs` electricity spread.

### 9.2 Evolution B — Carrier-selection analyst over the hydrogen route family (LLM tier 2)

**What.** A tool-calling analyst for export developers: "cheapest carrier for Australia→Japan at 8,000 km for ammonia end-use?", "at what distance does LH₂ lose to NH₃?", "does this chain clear the EU H₂ Bank ceiling?" The module already sits on 7 live routes (`/lcoh`, `/cost-trajectory`, `/demand-sector`, `/eu-h2-bank`, three `ref/` GETs) that the comparison page barely exercises — the lineage harness shows the POSTs skipped — so tier 2 unlocks existing backend capability rather than requiring new engines.

**How.** Tool schemas filtered to the hydrogen route family via the Atlas endpoint map; system prompt grounded in this page's §7.2 carrier table and §5 cost ranges so qualitative trade-offs (NH₃ toxicity, LOHC heat integration, e-fuel CO₂ dependency) come from the curated `notes`/`SCENARIOS` rationale text, not model priors. Distance sweeps ("find the LH₂/NH₃ crossover") execute as repeated tool calls with the crossover computed from returned points. The no-fabrication validator checks each $/GJ figure; scenario-winner questions must cite the hand-scored `SCENARIOS` rationale as expert judgement, not computation.

**Prerequisites.** Copilot/tool-calling infrastructure (Phase 2); Evolution A for delivered-cost questions (until then the analyst must caveat that production cost is a placeholder). **Acceptance:** every numeric traces to a tool call or the `CARRIERS` table; crossover answers reproducible from the logged sweep points.