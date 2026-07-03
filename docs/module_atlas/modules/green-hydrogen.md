# Green Hydrogen Analytics
**Module ID:** `green-hydrogen` · **Route:** `/green-hydrogen` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Green hydrogen production economics, carbon footprint, supply chain assessment, and investment case analysis. Covers electrolyser technologies, renewable integration, and cost parity timeline.

> **Business value:** Green hydrogen is critical for decarbonising hard-to-abate sectors (steel, ammonia, aviation, shipping). EU, US, and Japan have multi-billion hydrogen strategies. Cost trajectories and policy support determine investment viability — this module provides the economic and carbon analysis needed for investment and offtake decisions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `COUNTRY_OPTIONS`, `ELECTROLYSER_OPTIONS`, `ELEC_SOURCE_OPTIONS`, `GRID_EF`, `KpiCard`, `Row`, `Section`, `Sel`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `sourceEf` | `{ grid: gridEf, ppa_wind: 12 + r(1) * 8, ppa_solar: 22 + r(2) * 10, dedicated_re: 15 + r(3) * 10, nuclear: 5 + r(4) * 5 };` |
| `kwhPerKgH2` | `33.3 / efficiency;` |
| `ghgIntensity` | `parseFloat((ef * kwhPerKgH2 / 1000 + r(5) * 0.3).toFixed(2));` |
| `sourceEf` | `{ grid: gridEf, ppa_wind: 12 + r(1) * 8, ppa_solar: 22 + r(2) * 10, dedicated_re: 15 + r(3) * 10, nuclear: 5 + r(4) * 5 };` |
| `kwhPerKgH2` | `33.3 / efficiency;` |
| `countryComparison` | `COUNTRY_OPTIONS.map((c, i) => ({` |
| `capex` | `Math.round(capexBase * (0.85 + r(20) * 0.3));` |
| `capacityFactor` | `parseFloat(({ ppa_wind: 0.38 + r(21) * 0.12, ppa_solar: 0.22 + r(22) * 0.10, dedicated_re: 0.30 + r(23) * 0.15, nuclear: 0.88 + r(24) * 0.05, grid: 0.` |
| `stackLifetime` | `Math.round({ pem: 80000, alk: 100000, soec: 50000, aem: 60000 }[electrolyser] * (0.9 + r(26) * 0.2));` |
| `lcoh` | `parseFloat(lcohComponents.reduce((s, c) => s + c.value, 0).toFixed(2));` |
| `countryData` | `COUNTRY_OPTIONS.map((c, i) => ({` |
| `eu2030Target` | `10000; // Mt` |
| `euCurrent` | `Math.round(eu2030Target * (0.03 + r(40) * 0.08));` |
| `domesticShare` | `Math.round(r(41) * 30 + 20);` |
| `strikePrice` | `parseFloat((2.5 + r(50) * 2).toFixed(2));` |
| `supportDuration` | `Math.round(r(51) * 5 + 10);` |
| `seed0` | `hashStr(electrolyser + country + elecSource);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/green-hydrogen/assess` | `assess_facility` | api/v1/routes/green_hydrogen.py |
| POST | `/api/v1/green-hydrogen/rfnbo-compliance` | `rfnbo_compliance` | api/v1/routes/green_hydrogen.py |
| POST | `/api/v1/green-hydrogen/lcoh` | `lcoh_calculation` | api/v1/routes/green_hydrogen.py |
| GET | `/api/v1/green-hydrogen/ref/rfnbo-criteria` | `ref_rfnbo_criteria` | api/v1/routes/green_hydrogen.py |
| GET | `/api/v1/green-hydrogen/ref/electrolyser-benchmarks` | `ref_electrolyser_benchmarks` | api/v1/routes/green_hydrogen.py |
| GET | `/api/v1/green-hydrogen/ref/country-grid-factors` | `ref_country_grid_factors` | api/v1/routes/green_hydrogen.py |
| GET | `/api/v1/green-hydrogen/ref/repowereu-targets` | `ref_repowereu_targets` | api/v1/routes/green_hydrogen.py |
| GET | `/api/v1/green-hydrogen/ref/h2cfd-framework` | `ref_h2cfd_framework` | api/v1/routes/green_hydrogen.py |
| POST | `/api/v1/green-hydrogen-engine/classify-pathway` | `classify_pathway` | api/v1/routes/green_hydrogen_engine.py |
| POST | `/api/v1/green-hydrogen-engine/eu-rfnbo-compliance` | `eu_rfnbo_compliance` | api/v1/routes/green_hydrogen_engine.py |
| POST | `/api/v1/green-hydrogen-engine/calculate-lcoh` | `calculate_lcoh` | api/v1/routes/green_hydrogen_engine.py |
| POST | `/api/v1/green-hydrogen-engine/apply-subsidy` | `apply_subsidy` | api/v1/routes/green_hydrogen_engine.py |
| POST | `/api/v1/green-hydrogen-engine/scenario-analysis` | `scenario_analysis` | api/v1/routes/green_hydrogen_engine.py |
| POST | `/api/v1/green-hydrogen-engine/full-assessment` | `full_assessment` | api/v1/routes/green_hydrogen_engine.py |
| GET | `/api/v1/green-hydrogen-engine/ref/pathways` | `ref_pathways` | api/v1/routes/green_hydrogen_engine.py |
| GET | `/api/v1/green-hydrogen-engine/ref/electrolyser-params` | `ref_electrolyser_params` | api/v1/routes/green_hydrogen_engine.py |
| GET | `/api/v1/green-hydrogen-engine/ref/rfnbo-criteria` | `ref_rfnbo_criteria` | api/v1/routes/green_hydrogen_engine.py |
| GET | `/api/v1/green-hydrogen-engine/ref/subsidy-schemes` | `ref_subsidy_schemes` | api/v1/routes/green_hydrogen_engine.py |
| GET | `/api/v1/green-hydrogen-engine/ref/cost-scenarios` | `ref_cost_scenarios` | api/v1/routes/green_hydrogen_engine.py |

### 2.3 Engine `green_hydrogen_engine` (services/green_hydrogen_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_get_electricity_ef` | electricity_source, country | Return (kgCO2eq/kWh, description) for the given electricity source. |
| `_calculate_ghg_intensity` | electrolyser_type, electricity_ef_kg_co2_kwh, include_compression, include_water_treatment | Well-to-gate GHG intensity per ISO 14040/14044 approach (kgCO2eq/kgH2). |
| `_assess_additionality` | electricity_source, country, commissioning_year, re_installation_year, has_ppa, ppa_dedicated_new_asset | Score RFNBO additionality criterion (2023/1185 Art 4). Returns score 0-1 + compliance flag. |
| `_assess_temporal_correlation` | accounting_year, matching_granularity | Score temporal correlation criterion (2023/1185 Art 5). |
| `_assess_geographical_correlation` | country, re_location_country, same_bidding_zone, adjacent_zone_congestion_free_pct | Score geographical correlation criterion (2023/1185 Art 6). |
| `calculate_rfnbo_compliance` | electricity_source, country, electrolyser_type, commissioning_year, re_installation_year, has_ppa | Assess RFNBO compliance against all 4 EU criteria (2023/1184 + 2023/1185). |
| `calculate_lcoh` | electrolyser_type, country, capacity_mw, capex_usd_kw, capacity_factor, discount_rate | Calculate Levelised Cost of Hydrogen (USD/kgH2) per IEA Global Hydrogen Review 2023. |
| `assess_green_hydrogen` | facility_name, country, production_capacity_mw, electrolyser_type, electricity_source, commissioning_year | Full facility-level green hydrogen assessment. |
| `get_h2_benchmarks` |  | Return consolidated benchmark and reference data for green hydrogen analysis. |
| `GreenHydrogenEngine.classify_pathway` | entity_id, production_pathway, renewable_electricity_pct, carbon_intensity_kgco2e_kgh2 |  |
| `GreenHydrogenEngine.check_eu_rfnbo_compliance` | entity_id, additionality_met, temporal_correlation_met, geographical_correlation_met, carbon_intensity |  |
| `GreenHydrogenEngine.calculate_lcoh` | entity_id, capacity_mw, capacity_factor_pct, electricity_cost_mwh, capex_per_kw, discount_rate_pct |  |
| `GreenHydrogenEngine.apply_subsidy` | entity_id, lcoh, h2_subsidy_scheme |  |
| `GreenHydrogenEngine.run_scenario_analysis` | entity_id, assessment_id, technology, capacity_mw, capacity_factor_pct, discount_rate_pct |  |
| `GreenHydrogenEngine.full_assessment` | entity_id, project_name, country_code, production_pathway, technology, capacity_mw |  |
| `GreenHydrogenEngine.get_h2_pathways` |  |  |
| `GreenHydrogenEngine.get_electrolyser_params` |  |  |
| `GreenHydrogenEngine.get_eu_rfnbo_criteria` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `exc` *(shared)*, `facility` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COUNTRY_OPTIONS`, `ELECTROLYSER_OPTIONS`, `ELEC_SOURCE_OPTIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LCOH (current) | — | IEA/IRENA | Current green hydrogen production cost range |
| LCOH (2030 target) | — | Hydrogen Council | Cost target for grid competitiveness |
| Electrolyser Efficiency | — | Technology | kWh electricity per kg H2 produced |
| EU Taxonomy Threshold | — | EU Delegated Act | Renewable fuels of non-biological origin threshold |
- **Electrolyser specs** → LCOH calculation → **Production cost per kg H2**
- **Grid electricity mix** → Carbon intensity calculation → **GHG footprint per kgH2**
- **Cost trajectories** → Parity analysis → **Green vs grey H2 crossover year**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/green-hydrogen/ref/country-grid-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'countries', 'high_re_threshold_pct', 'high_re_eligible_countries', 'methodology', 'note'], 'n_keys': 6}`

**GET /api/v1/green-hydrogen/ref/electrolyser-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'benchmarks', 'notes'], 'n_keys': 3}`

**GET /api/v1/green-hydrogen/ref/h2cfd-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'framework', 'key_parameters', 'eligibility_summary'], 'n_keys': 4}`

**GET /api/v1/green-hydrogen/ref/repowereu-targets** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'targets', 'repowereu_total_eu_target_mt_2030', 'eu_import_target_mt_2030', 'electrolysis_capacity_target_gw_2030', '2024_installed_gw_estimate', 'gap_commentary'], 'n_keys': 7}`

**GET /api/v1/green-hydrogen/ref/rfnbo-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'effective_date', 'criteria', 'rfnbo_definition', 'green_hydrogen_classification', 'ghg_threshold_kg_co2_kgh2', 'counterfactual_method'], 'n_keys': 7}`

## 5 · Intermediate Transformation Logic
**Methodology:** Green H2 levelised cost model
**Headline formula:** `LCOH = (CapEx + OpEx) / H2_produced; GHG = Electricity_GHG / Conversion_efficiency`
**Standards:** ['IEA Global Hydrogen Review', 'Hydrogen Council', 'IRENA Green Hydrogen']

**Engine `green_hydrogen_engine` — extracted transformation lines:**
```python
electrolysis_ghg = kwh_per_kgh2 * electricity_ef_kg_co2_kwh
total_ghg = electrolysis_ghg + water_ghg + compression_ghg
reduction_vs_fossil_pct = (1.0 - total_ghg / (94.0 * H2_LHV_MJ_PER_KG / 1000.0)) * 100.0
age_months = (commissioning_year - re_installation_year) * 12
penalty = min((age_months - ADDITIONALITY_MAX_AGE_MONTHS) / 120.0, 1.0)
score = round(max(0.0, 1.0 - penalty), 3)
partial_score = round(min(re_share / HIGH_RE_GRID_THRESHOLD_PCT, 1.0) * 0.5, 3)
score = round((congestion_free / threshold) * 0.8, 3)
c1_score = round(max(0.0, 1.0 - excess / RFNBO_GHG_THRESHOLD_KG_CO2_KGH2), 3)
LCOH = (CAPEX × CRF + OPEX_annual + stack_replacement_annual) / annual_H2_kg + electricity_cost/kgH2
CRF  = r / (1 − (1+r)^(−n))
frac = (projection_year - 2024) / 6.0
frac = min((projection_year - 2030) / 20.0, 1.0)
capex_total_usd = capex_usd_kw * capacity_mw * 1000.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **39** other module(s).
**Shared engines (edits propagate!):** `green_hydrogen_engine` (used by 4 modules)

| Connected module | Shared via |
|---|---|
| `green-hydrogen-economics` | engine:green_hydrogen_engine, table:exc, table:facility |
| `green-hydrogen-lcoh` | engine:green_hydrogen_engine, table:exc, table:facility |
| `green-hydrogen-ammonia-carbon` | engine:green_hydrogen_engine, table:exc, table:facility |
| `blended-finance` | table:exc |
| `biodiversity-credits` | table:exc |
| `transition-finance` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `just-transition-adaptation` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |