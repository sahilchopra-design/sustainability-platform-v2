# Global Hydrogen Market Intelligence
**Module ID:** `hydrogen-market-intelligence` · **Route:** `/hydrogen-market-intelligence` · **Tier:** A (backend vertical) · **EP code:** EP-DS3 · **Sprint:** DS

## 1 · Overview
Global hydrogen market dashboard tracking production by pathway, demand by sector, country project pipelines and cost trajectory from 2020 to 2050.

> **Business value:** Green hydrogen represents <1% of global production in 2023 but >1,000 GW is in the announced pipeline; market intelligence confirms cost parity with grey H2 is achievable before 2030 in solar-rich regions per IEA and IRENA projections.

**How an analyst works this module:**
- Map current H2 production by pathway: grey (SMR), blue (SMR+CCS), green (electrolysis), pink (nuclear)
- Analyse demand sectors: industry 54%, transport 17%, power 10%, other 19%
- Track country project pipelines by stage (announced/FID/construction/operational)
- Model cost trajectory 2020-2050 using learning rates and renewable electricity price curves

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `EXPORTERS`, `IMPORTERS`, `KpiCard`, `SECTORS`, `TABS`, `VALLEYS`, `YEARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SECTORS` | 9 | `demand2023`, `demand2030`, `demand2040`, `share`, `color`, `type` |
| `EXPORTERS` | 9 | `potential2030`, `potential2040`, `lcoh`, `distance`, `color`, `status` |
| `IMPORTERS` | 7 | `demand2030`, `demand2040`, `sources`, `priority`, `color` |
| `VALLEYS` | 9 | `country`, `focus`, `investment`, `jobs`, `status` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `YEARS` | `Array.from({ length: 16 }, (_, i) => 2025 + i);` |
| `demandData` | `useMemo(() => YEARS.map((y, i) => {` |
| `supplyData` | `useMemo(() => YEARS.map((y, i) => ({` |
| `priceData` | `useMemo(() => YEARS.map((y, i) => ({` |
| `geoRisks` | `useMemo(() => EXPORTERS.map((e, i) => ({` |
| `techMixData` | `YEARS.map((y, i) => ({` |
| `totalGreenPipeline` | `EXPORTERS.reduce((a, e) => a + e.potential2030, 0);` |
| `totalDemand2030` | `SECTORS.reduce((a, s) => a + s.demand2030, 0);` |
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
**Frontend seed datasets:** `EXPORTERS`, `IMPORTERS`, `SECTORS`, `TABS`, `VALLEYS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global H2 Demand | `Sum across industry+transport+power+other` | IEA 2023 | Industrial feedstock (ammonia, refining) dominates at 54%; new demand in transport and power is nascent. |
| Green H2 Project Pipeline | `Capacity_announced by country/stage` | IEA Projects Database | Only ~5% of announced projects reach FID; policy certainty and offtake contracts are key gating factors. |
| Cost Trajectory | `Learning rate ~18% per doubling` | IRENA 2023 | Green H2 cost declines track electrolyser and renewable electricity cost curves; IEA targets <$2/kg by 2030 in high-resource regions. |
- **IEA Hydrogen Projects Database** → → pipeline tracker → **Projects by country, technology, status**
- **IRENA cost data** → → trajectory model → **LCOH by region and year**

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
**Methodology:** Market Intelligence Framework
**Headline formula:** `Green share = Green_capacity / Total_H2_capacity × 100`

Industry accounts for 54% of H2 demand, transport 17%, power 10%; green H2 share below 1% in 2023 but scaling rapidly.

**Standards:** ['IEA Global Hydrogen Review 2023', 'IRENA World Energy Transitions Outlook', 'Hydrogen Council Market Development']
**Reference documents:** IEA Global Hydrogen Review 2023; IRENA Green Hydrogen: A Guide to Policy Making 2020; Hydrogen Council Hydrogen Insights 2023

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
| `hydrogen-storage-transport` | engine:hydrogen_economy_engine |
| `hydrogen-economy-modeler` | engine:hydrogen_economy_engine |
| `hydrogen-derivatives-comparison` | engine:hydrogen_economy_engine |
**Shared UI wrappers:** `EnergyAdvancedAnalytics`

## 7 · Methodology Deep Dive

A global hydrogen **market-intelligence dashboard**: demand by sector, supply by pathway, exporter/
importer flows, price forecasts, geopolitical risk and a technology mix, 2025–2040. It is
projection-by-interpolation over hand-authored market tables, with one synthetic term (grey-H₂ price
noise) and one hard-coded geopolitical scorecard. Code and guide (EP-DS3) broadly agree.

### 7.1 What the module computes

**Sector demand projection** — piecewise-linear between 2023/2030/2040 anchors, then scaled by scenario:

```js
demand[year] = ( demand2023
               + (demand2030 − demand2023)/7 · min(i,7)          // 2023→2030 slope
               + (demand2040 − demand2030)/10 · max(0,i−7) )     // 2030→2040 slope
               × scenarioMultiplier
scenarioMultiplier = { Conservative:0.65, Base:1.0, Optimistic:1.45 }
```

**Supply build-up by pathway** — linear ramps:

```js
grey  = 83 − i·2 ; blue = i·3 ; green = 0.5 + i·4 ; other = 0.5 + i·0.5   // Mt, i = year index
```

**Price trajectory** — declining green, rising blue, noisy grey:

```js
greenWind = max(1.5, 6.0 − i·0.28)      // $/kg
greenSolar= max(1.2, 5.5 − i·0.25)
blue      = max(1.3, 2.2 + i·0.05)
grey      = 1.4 + sr(i·11)·0.8           // ← SYNTHETIC noise
target2030= 2.0
```

### 7.2 Parameterisation (market tables, provenance)

| Table | Rows | Key fields | Basis |
|---|---|---|---|
| `SECTORS` | 8 | demand 2023/30/40 (Mt) | IEA *Global Hydrogen Review* — existing (ammonia 31, refining 42 Mt) vs new (steel/transport/power) |
| `EXPORTERS` | 8 | potential, LCOH, distance | IEA/IRENA export-hub studies (Chile, Australia, Saudi, USA-Gulf) |
| `IMPORTERS` | 6 | demand, source list | EU/JP/KR hydrogen import strategies |
| `VALLEYS` | 8 | investment $B, jobs | Announced hydrogen-valley projects (NEOM, HyDeal, Humber) |
| `geoRisks` | 8×5 | political/regulatory/infra/contract scores | **Hard-coded scorecard** (e.g. Norway 8.8, Kazakhstan 4.5) — expert judgement |

Existing-demand anchors (ammonia ~31 Mt, refining ~42 Mt, ~94 Mt total in 2023) match IEA figures.

### 7.3 Calculation walkthrough

`demandData` builds a 16-year × 8-sector matrix from the two-segment interpolation, uniformly scaled
by the scenario multiplier. `supplyData` and `priceData` are independent linear ramps. `geoRisks` is a
static read of the hard-coded scorecard. Totals: `totalGreenPipeline` sums exporter `potential2030`;
`totalDemand2030` sums sector `demand2030`.

### 7.4 Worked example (Steel DRI demand at 2035, Base)

```
i = 2035 − 2025 = 10  (>7, so both segments active)
= 0.1 + (8 − 0.1)/7·min(10,7) + (55 − 8)/10·max(0,10−7)
= 0.1 + 1.1286·7 + 4.7·3
= 0.1 + 7.9 + 14.1 = 22.1 Mt
× 1.0 (Base) = 22.1 Mt/yr
```

Under Optimistic (×1.45) the same cell reads ≈32 Mt/yr — the scenario multiplier is a flat scalar on
every sector-year, so relative sector shares never change across scenarios.

### 7.5 Data provenance & limitations

- Market tables are **externally grounded** (IEA/IRENA); the module's value is curation + interpolation.
- **Grey-H₂ price** uses seeded PRNG noise (`sr(i·11)`) — cosmetic jitter, not a gas-price model.
- The **geopolitical scorecard is a static hand-authored matrix**, not derived from any governance index
  (World Bank WGI, Fund for Peace FSI) — a candidate for §8-style formalisation but low decision-stakes.
- Scenario handling is a single flat multiplier; it cannot represent sector-specific policy divergence.

**Framework alignment:** IEA *Global Hydrogen Review 2023* (demand by sector, project pipeline) ·
IRENA *World Energy Transitions Outlook* (LCOH cost-down, export potential) · Hydrogen Council
*Hydrogen Insights* (market narrative). The module reproduces their published trajectories as
interpolated anchors rather than modelling deployment or trade endogenously.

## 9 · Future Evolution

### 9.1 Evolution A — Live project-pipeline ingestion and gas-linked grey pricing (analytics ladder: rung 2 → 3)

**What.** The module is honest curation-plus-interpolation: sector demand is a two-segment linear blend of IEA anchors scaled by a flat scenario multiplier (0.65/1.0/1.45), supply pathways are linear ramps (`green = 0.5 + i×4`), grey price carries cosmetic `sr(i·11)` noise, and the 8×5 geopolitical scorecard is hand-authored. §7.5 notes the flat multiplier means sector shares never change across scenarios. Evolution A grounds all four: ingest the IEA Hydrogen Projects Database (the §4.1 lineage already names it as the pipeline source without actually ingesting it) so the pipeline tracker and supply build-up derive from real announced/FID/construction capacity; replace the grey-price jitter with a gas-price-linked SMR cost model using the platform's existing EIA ingestion; source geo-risk from World Bank WGI percentiles as §7.5 itself suggests; and make scenario multipliers sector-specific (steel and transport diverge under policy scenarios, ammonia doesn't).

**How.** (1) A `h2_projects` reference table (country, technology, stage, MW, year) refreshed by a new ingester on the existing 19-ingester scaffold. (2) `supplyData` recomputed as stage-weighted pipeline conversion (the page's own §4.1 note — only ~5% of announced reaches FID — becomes an explicit conversion-rate parameter). (3) Grey $/kg = f(gas price, SMR efficiency, carbon price). (4) Calibration: 2023 demand anchors (ammonia 31 Mt, refining 42 Mt) pinned as regression checks.

**Prerequisites.** IEA database access (public download exists); the `sr()` grey-noise term removed. **Acceptance:** the pipeline tab shows real project counts by stage with vintage stamp; changing the FID-conversion assumption visibly moves 2030 green supply.

### 9.2 Evolution B — Market-intelligence copilot with sourced-claim discipline (LLM tier 1 → 2)

**What.** A copilot for energy ministries and investors: "why does industry dominate 2023 demand?", "which exporters can serve Japan below $3/kg landed?", "what's Chile's geopolitical score based on?" Market-intelligence Q&A is the natural LLM fit here because the module's value is curated narrative — the `EXPORTERS` advantages, `VALLEYS` investments, importer strategies — which is text an LLM can ground on directly.

**How.** Tier 1: this Atlas page plus the seed tables embedded in `llm_corpus_chunks`; the scenario toggle and selected year pass as context so "demand in 2035" reads the interpolated matrix actually rendered. Two discipline rules from §7.5: geo-risk answers must state the scorecard is expert judgement, not a derived index (until Evolution A rebases it on WGI); scenario answers must note the flat-multiplier limitation when asked about sector divergence. Tier 2 adds tool calls to the live-but-unused route family (`/demand-sector`, `/cost-trajectory` — both `skipped` in the lineage sweep) for quantitative what-ifs like "abatement economics of switching Japanese refining demand to green H₂ at $2.80/kg."

**Prerequisites.** Copilot infrastructure (Phase 1); tier 2 needs only the existing hydrogen routes. **Acceptance:** every Mt/$-figure cites either a seed-table cell or a logged tool call; geo-score answers carry the provenance disclaimer verbatim.