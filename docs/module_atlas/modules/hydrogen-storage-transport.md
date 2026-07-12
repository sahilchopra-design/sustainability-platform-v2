# Hydrogen Storage and Transport Economics
**Module ID:** `hydrogen-storage-transport` · **Route:** `/hydrogen-storage-transport` · **Tier:** A (backend vertical) · **EP code:** EP-DS4 · **Sprint:** DS

## 1 · Overview
Comparative economics of hydrogen storage and transport pathways: compressed gas, liquid H2, liquid organic hydrogen carriers and ammonia, covering cost, energy penalty and pipeline repurposing.

> **Business value:** Ammonia dominates for intercontinental hydrogen trade (>3,000 km) at $1.5-2.5/kgH2 delivered; pipeline repurposing cuts intra-continental transport cost by 50-70% versus new build, per DNV and IEA analysis.

**How an analyst works this module:**
- Compare four storage/transport pathways: compressed gas, liquid H2, LOHC, ammonia
- Calculate storage cost ($/kgH2) and transport cost ($/kgH2/1000km) for each pathway
- Apply energy penalty and infrastructure CAPEX to derive total delivered cost
- Assess pipeline repurposing potential: cost reduction 50-70% vs new hydrogen pipelines

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CORRIDORS`, `DENSITY_350BAR`, `DENSITY_700BAR`, `DENSITY_LIQUID_H2`, `HHV_H2`, `KpiCard`, `LHV_H2`, `NH3_H2_RATIO`, `STORAGE_MODES`, `Slider`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `STORAGE_MODES` | 7 | `label`, `energyDensityKg`, `opexPct`, `compressionKwh`, `boilOff`, `roundTrip`, `trl`, `color`, `useCase`, `pros`, `cons` |
| `CORRIDORS` | 9 | `from`, `to`, `distKm`, `mode`, `lcohTransport`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `LHV_H2` | `33.3;   // kWh/kg` |
| `HHV_H2` | `39.4;   // kWh/kg` |
| `DENSITY_LIQUID_H2` | `70.8;   // kg/m³ at -253°C` |
| `DENSITY_700BAR` | `39.0;   // kg/m³ at 700 bar` |
| `DENSITY_350BAR` | `23.5;   // kg/m³ at 350 bar` |
| `NH3_H2_RATIO` | `0.178;  // kg H2 / kg NH3` |
| `capexPerKm` | `3.2 + 0.8 * diaDm; // M€/km` |
| `totalCapex` | `capexPerKm * distKm;` |
| `annualFlow` | `flowMtpa * 1e9 / 8760; // kg/hr` |
| `annualTonne` | `flowMtpa * 1000; // t/yr` |
| `annuity` | `totalCapex * 1e6 * 0.08 / (1 - Math.pow(1.08, -30));` |
| `transportComparison` | `useMemo(() => { return STORAGE_MODES.slice(0, 5).map(m => ({ name: m.id.replace('CGH2_', 'CGH₂ ').replace('_', ' '), capex: m.capexPerKg, opex20yr: (m.opexPct / 100 * m.capexPerKg * 20).toFixed(0), compressionCost: +(m.compressionKwh * 0.06).toFixed(2), // €60/MWh electricity boilOffCost: +(m.boilOff * 4.0 * 30).toFixed(2), // 30 day jour` |
| `pipelineSensData` | `useMemo(() => Array.from({ length: 10 }, (_, i) => ({ dist: (i + 1) * 1000, pipeline_05: +pipelineCost((i + 1) * 1000, 0.5, 3).toFixed(3), pipeline_2:  +pipelineCost((i + 1) * 1000, 2.0, 5).toFixed(3), pipeline_5:  +pipelineCost((i + 1) * 1000, 5.0, 8).toFixed(3), })), []);` |
| `terminalData` | `useMemo(() => { const capexTerminal = termCapacity * 0.5; // €0.5M per tonne capacity = M€ const annuity = capexTerminal * 1e6 * 0.08 / (1 - Math.pow(1.08, -30));` |
| `annualThroughput` | `termCapacity * (loaFactor / 100) * 12; // tonnes/yr` |
| `costPerKg` | `annuity / Math.max(1, annualThroughput * 1000);` |
| `stackData` | `useMemo(() => CORRIDORS.map((c, i) => {` |
| `prodCost` | `2.5 + sr(i * 17) * 2.0;` |
| `storeCost` | `0.3 + sr(i * 11) * 0.4;` |
| `total` | `prodCost + storeCost + transpCost + regas;` |
| `lohcCycleData` | `useMemo(() => Array.from({ length: 8 }, (_, i) => ({ step: ['Hydrogenation', 'Cooling', 'Storage', 'Loading', 'Shipping', 'Unloading', 'Dehydrogenation', 'DBT Recovery'][i], energy: [58, 5, 2, 3, 120, 3, 180, 15][i], // kWh/tH2 temp: [200, 50, 25, 25, 25, 25, 320, 200][i], loss: [2, 0.5, 0.2, 0.3, 0.1, 0.3, 8, 1][i], })), []);` |
| `infraRadar` | `STORAGE_MODES.slice(0, 5).map(m => ({` |
| `panelStyle` | `{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text };` |
| `gridStyle` | `{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 };` |

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
**Frontend seed datasets:** `CORRIDORS`, `STORAGE_MODES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Compressed Gas Storage Cost | `P×V×Z/nRT adjusted CAPEX` | IEA 2023 | 700 bar tanks used for transport; 350 bar for stationary; cost scales with pressure rating and tank volume. |
| Liquid H2 Transport Cost | `CAPEX+boil-off+energy/throughput` | DNV 2023 | Liquefaction energy penalty 25-35% of H2 HHV; boil-off 0.2-0.3%/day adds cost for long voyages. |
| Ammonia Reconversion Efficiency | `η_NH3 = H2_out/H2_in` | Hydrogen Council 2022 | NH3 cracking to H2 adds $0.5-1.5/kgH2; often used directly as fuel/feedstock to avoid reconversion loss. |
- **Transport distance matrix** → → pathway cost model → **$/kgH2 by distance and mode**
- **Pipeline repurposing assessment** → → infrastructure cost → **Existing vs new pipeline $/km**

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
**Methodology:** Storage & Transport Cost Model
**Headline formula:** `Total_cost = Storage_cost($/kgH2) + Transport_cost($/kgH2/1000km) × distance`

Ammonia is lowest cost for long-distance shipping (>3,000 km); compressed gas optimal for short-haul (<500 km); pipeline repurposing reduces cost 50-70%.

**Standards:** ['DNV Hydrogen Forecast 2023', 'IEA The Future of Hydrogen', 'Hydrogen Council Hydrogen Decarbonization Pathways']
**Reference documents:** DNV Hydrogen Forecast to 2050 2023; IEA The Future of Hydrogen 2019; Hydrogen Council Hydrogen Decarbonization Pathways 2022

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
| `hydrogen-economy-modeler` | engine:hydrogen_economy_engine |
| `hydrogen-derivatives-comparison` | engine:hydrogen_economy_engine |
**Shared UI wrappers:** `EnergyAdvancedAnalytics`

## 7 · Methodology Deep Dive

A **storage-and-transport economics** page comparing 6 storage modalities (compressed 350/700 bar,
LH₂, LOHC, NH₃ cracking, salt cavern) and 8 real export corridors, with pipeline/shipping/terminal
cost models grounded in H₂ physical constants. Most maths is genuine engineering economics; only the
per-corridor cost stack uses a small synthetic term. Code and guide (EP-DS4) agree.

### 7.1 What the module computes

**Physical constants** (correct, hard-coded):
`LHV_H2 = 33.3`, `HHV_H2 = 39.4` kWh/kg; `DENSITY_LIQUID_H2 = 70.8`, `DENSITY_700BAR = 39.0`,
`DENSITY_350BAR = 23.5` kg/m³; `NH3_H2_RATIO = 0.178` kg H₂/kg NH₃.

**Pipeline cost** — diameter-scaled capex annuitised over 30 years:

```js
capexPerKm = 3.2 + 0.8·diaDm          // M€/km, larger diameter costs more
totalCapex = capexPerKm · distKm
annuity    = totalCapex·1e6 · 0.08 / (1 − 1.08^−30)   // 8% discount, 30-yr life
cost €/kg  = annuity / max(1, annualTonne·1e3)
```

**Shipping cost** — mode base rate + distance term:

```js
shippingCost = { LH₂:0.08, NH₃:0.04, LOHC:0.06 }[mode] + distKm·0.00005    // €/kg
```

**Storage cost** (20-yr NPV of opex on capex):

```js
totalStorageCostPerKg = capexPerKg + (opexPct/100 · capexPerKg · 20)
```

**Terminal cost** — capacity-scaled capex annuitised, divided by throughput:

```js
capexTerminal = termCapacity · 0.5        // €0.5M per tonne capacity
annuity       = capexTerminal·1e6·0.08 / (1 − 1.08^−30)
costPerKg     = annuity / max(1, annualThroughput·1000)
```

### 7.2 Parameterisation — STORAGE_MODES table

| Mode | Density kg/m³ | capex €/kg | opex % | Compression kWh/kg | Boil-off %/day | Round-trip η | TRL |
|---|---|---|---|---|---|---|---|
| CGH2 350 bar | 23.5 | 700 | 2 | 2.2 | 0 | 0.92 | 9 |
| CGH2 700 bar | 39.0 | 1100 | 2.5 | 3.2 | 0 | 0.88 | 9 |
| LH2 | 70.8 | 1800 | 3 | 11.5 | 0.3 | 0.78 | 8 |
| LOHC (DBT) | 6.2 wt% | 900 | 3.5 | 8.0 | 0 | 0.70 | 7 |
| NH3 cracking | 120 (→21.4 H₂) | 600 | 2.8 | 6.5 | 0.05 | 0.65 | 8 |
| Salt cavern | 25 @200 bar | 0.5 | 1 | 2.0 | 0.01 | 0.96 | 8 |

These match IEA/DNV/Hydrogen Council ranges: LH₂ liquefaction ~11.5 kWh/kg (≈35% of HHV), salt-cavern
lowest €/kg, NH₃ lowest round-trip due to cracking penalty. Corridors are 8 real routes with published
distances and LCOH-transport figures (Chile-EU 12 800 km $1.20/kg; Norway-EU 800 km $0.18/kg).

### 7.3 Calculation walkthrough

`pipelineSensData` sweeps 10 distances (1 000–10 000 km) at three flow rates. `terminalData` responds
to `termCapacity`/`loaFactor` sliders. `stackData` builds a per-corridor delivered-cost stack:
`prodCost (2.5 + sr(i·17)·2.0)` + `storeCost (0.3 + sr(i·11)·0.4)` + `transpCost` + `regas`. `lohcCycleData`
traces the 8-step LOHC round-trip with per-step energy (kWh/tH₂), temperature and loss — hard-coded
process data (hydrogenation 58, dehydrogenation 180 kWh/tH₂ at 320 °C).

### 7.4 Worked example (Norway-EU pipeline, 2 Mtpa, 1.0 m diameter, 800 km)

```
capexPerKm = 3.2 + 0.8·1.0 = 4.0 M€/km
totalCapex = 4.0 · 800 = 3200 M€
annuity    = 3200·1e6 · 0.08/(1 − 1.08^−30) = 2.56e8/0.90066 = €2.84e8/yr
annualTonne= 2 Mtpa · 1000 = 2e6 t/yr → 2e9 kg/yr
cost/kg    = 2.84e8 / 2e9 = €0.14/kg
```

≈€0.14/kg — consistent with the corridor's hand-tagged $0.18/kg and the guide's claim that short-haul
pipeline is the cheapest transport mode, and that pipeline repurposing cuts cost 50–70% vs new build.

### 7.5 Data provenance & limitations

- **Physical constants and the cost engines are genuine** — capex annuitisation, compression energy,
  round-trip efficiency and boil-off are real engineering-economics; this page is largely trustworthy.
- The **per-corridor delivered-cost stack uses seeded PRNG** for production and storage terms
  (`sr(i·17)`, `sr(i·11)`) — the *transport* term is real, but the total stack embeds ~$2.5–4.5/kg of
  synthetic production cost.
- Boil-off is a static %/day, not integrated over voyage duration; shipping cost is a linear distance
  term without vessel-size economies.
- LOHC dehydrogenation heat (320 °C, 180 kWh/tH₂) is captured descriptively but not costed into a
  temperature-dependent penalty.

**Framework alignment:** DNV *Hydrogen Forecast to 2050* (transport-mode cost ordering: NH₃ cheapest
>3 000 km) · IEA *The Future of Hydrogen* (storage cost, liquefaction energy penalty) · Hydrogen
Council *Decarbonization Pathways* (reconversion efficiency). The module implements the DNV/IEA
transport-mode comparison faithfully; the delivered-LCOH totals are indicative because the production
term is synthetic.

## 9 · Future Evolution

### 9.1 Evolution A — Corridor delivered-LCOH with voyage-integrated losses (analytics ladder: rung 2 → 3)

**What.** §7 rates the engineering core genuine — correct H₂ physical constants, real capex annuitisation for pipelines/terminals, a defensible `STORAGE_MODES` table matching IEA/DNV ranges. The gaps it lists: the per-corridor delivered-cost stack embeds ~$2.5–4.5/kg of `sr()`-seeded production cost plus a seeded storage term; boil-off is a static %/day never integrated over voyage duration; shipping is linear in distance with no vessel-size economies; and the LOHC dehydrogenation heat (320°C, 180 kWh/tH₂) is described but not costed. Evolution A completes the chain: production cost per corridor origin from the shared engine's `calculate_lcoh` with `ref/country-costs` electricity (Chile and Norway then differ for a computed reason), boil-off compounded over `distKm / vessel_speed` days, and LOHC/NH₃ reconversion costed from the page's own `lohcCycleData` energy steps × heat price.

**How.** (1) New endpoint `POST /hydrogen/corridor-cost` in `api/v1/routes/hydrogen.py` returning the full stack {production, conversion, storage, shipping (with voyage losses), reconversion, regas} per corridor and mode. (2) The 8 real corridors' hand-tagged LCOH-transport figures (Chile–EU $1.20/kg, Norway–EU $0.18/kg) become calibration targets — computed values must land within tolerance of the DNV-sourced tags. (3) The `sr()` terms in `stackData` deleted. Engine changes are additive (5-module blast radius per §6).

**Prerequisites.** Heat-price and vessel-parameter assumptions documented; sibling-module regression before the shared-engine merge. **Acceptance:** the §7.4 Norway pipeline example (€0.14/kg) still reproduces; the corridor stack contains zero seeded terms and its transport components reconcile to the corridor tags.

### 9.2 Evolution B — Export-corridor analyst over the storage/transport engines (LLM tier 2)

**What.** A tool-calling analyst for infrastructure investors and exporters: "cheapest way to move 2 Mtpa from Australia to Korea — NH₃ ship or nothing?", "at what distance does pipeline lose to shipping for a 1 m line?", "what does salt-cavern storage do to my delivered cost vs LH₂ tanks?" The module's sliders (diameter, flow, terminal capacity, load factor) already parameterise these questions; tier 2 turns them into conversational sweeps.

**How.** Tool schemas over the Evolution A `/corridor-cost` route plus the existing hydrogen route family; system prompt grounded in this page's §7.2 mode table (round-trip efficiencies, TRLs, boil-off rates) and the §5 rule-of-thumb (NH₃ wins >3,000 km, pipeline repurposing cuts 50–70%) so qualitative guidance cites curated data. Crossover questions ("pipeline vs ship break-even distance") run as bisection over tool calls with the bracket shown. The analyst must distinguish engineering-grade outputs (pipeline/terminal annuities) from screening-grade ones (until Evolution A lands, the delivered totals carry the synthetic-production caveat from §7.5).

**Prerequisites.** Phase 2 tool-calling; Evolution A for delivered-cost questions without caveats. **Acceptance:** every €/kg figure traces to a tool call; mode recommendations cite the specific constraint (TRL, boil-off, round-trip η) from the `STORAGE_MODES` row rather than generic reasoning.