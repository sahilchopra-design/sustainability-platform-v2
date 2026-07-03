# Green Hydrogen LCOH Engine
**Module ID:** `green-hydrogen-lcoh` · **Route:** `/green-hydrogen-lcoh` · **Tier:** A (backend vertical) · **EP code:** EP-DS1 · **Sprint:** DS

## 1 · Overview
Levelised Cost of Hydrogen engine modelling electrolyser CAPEX, electricity cost, capacity factor, efficiency and stack replacement to target IEA <$2/kgH2 by 2030.

> **Business value:** Green hydrogen LCOH is dominated by electricity cost (60-70%); achieving <$2/kgH2 requires <$30/MWh renewable electricity and electrolyser CAPEX below $300/kW, consistent with IEA Net Zero by 2050 milestones.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ELECTROLYZER_TYPES`, `HHV_H2`, `KpiCard`, `LHV_H2`, `REGIONS`, `RENEWABLE_SOURCES`, `Slider`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `HHV_H2` | `39.4;  // kWh/kg (higher heating value)` |
| `LHV_H2` | `33.3;  // kWh/kg (lower heating value)` |
| `annualKgPerMW` | `(capacityFactor / 100) * 8760 * 1000 / (efficiency / 100 * HHV_H2);` |
| `capexAnnual` | `capex * 1000 * (wacc / 100) / (1 - Math.pow(1 + wacc / 100, -lifetime));` |
| `electricityCost` | `elecCost * (efficiency / 100 * HHV_H2);` |
| `stackCostAnnual` | `(capex * 1000 * stackReplace / 100) / (lifetime / 2);` |
| `totalAnnualPerKg` | `(capexAnnual + opex * capex * 1000 / 100 + stackCostAnnual) / Math.max(1, annualKgPerMW) + electricityCost;` |
| `YEARS` | `Array.from({ length: 16 }, (_, i) => 2025 + i);` |
| `kgPerMWh` | `1000 / (efficiency / 100 * HHV_H2);` |
| `learningData` | `useMemo(() => YEARS.map((y, i) => {` |
| `cumGWPEM` | `2 + i * 8;` |
| `cumGWAEL` | `8 + i * 5;` |
| `cumGWSOEC` | `0.5 + i * 2;` |
| `cumGWAEM` | `0.2 + i * 3;` |
| `kgPerMWh` | `1000 / (efficiency / 100 * HHV_H2);` |
| `annualKg` | `(capacityFactor / 100) * 8760 * 1000 * kgPerMWh;` |
| `capexAnn` | `capex * 1000 * (wacc / 100) / (1 - Math.pow(1 + wacc / 100, -lifetime));` |
| `opexAnn` | `capex * 1000 * opexPct / 100;` |

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
**Frontend seed datasets:** `ELECTROLYZER_TYPES`, `REGIONS`, `RENEWABLE_SOURCES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Electrolyser CAPEX | `CAPEX×CRF/Annual_H2` | IEA 2023 | Lower CAPEX directly reduces LCOH; target <$300/kW by 2030 for cost parity. |
| Electricity Cost Share | `P_elec(kWh/kgH2)/LCOH` | IRENA 2023 | Dominant cost driver; green H2 viability requires renewable electricity <$30/MWh. |
| System Efficiency | `η = H2_HHV/E_input` | Hydrogen Council 2021 | PEM efficiency 50–60 kWh/kgH2; alkaline 50–55 kWh/kgH2 at stack level. |
- **Electricity price feed** → → LCOH sensitivity model → **$/kgH2 by scenario**
- **CAPEX trajectory** → → learning rate curve → **Cost reduction vs cumulative GW deployed**

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
**Methodology:** LCOH Methodology
**Headline formula:** `LCOH = (CAPEX×CRF + OPEX) / Annual_H2_Production`
**Standards:** ['IEA Hydrogen', 'IRENA Green Hydrogen Cost', 'Hydrogen Council Pathway']

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
| `green-hydrogen-ammonia-carbon` | engine:green_hydrogen_engine, table:exc, table:facility |
| `green-hydrogen` | engine:green_hydrogen_engine, table:exc, table:facility |
| `blended-finance` | table:exc |
| `biodiversity-credits` | table:exc |
| `transition-finance` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `just-transition-adaptation` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |
**Shared UI wrappers:** `EnergyAdvancedAnalytics`