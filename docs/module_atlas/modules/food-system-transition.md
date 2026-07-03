# Food System Transition Analytics
**Module ID:** `food-system-transition` · **Route:** `/food-system-transition` · **Tier:** A (backend vertical) · **EP code:** EP-DG2 · **Sprint:** DG

## 1 · Overview
Analyses the investment implications of transitioning global food systems to sustainable diets, reduced meat consumption, and regenerative agriculture. Models protein transition market dynamics, food company stranded asset risk, and alternative protein investment economics.

> **Business value:** Directly applicable to food sector equity analysts, ESG-focused active managers with consumer staples exposure, and impact investors in alternative proteins. FAIRR alignment enables engagement with the 60 largest protein producers on transition risk management.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMPANIES`, `FINANCE_INSTRUMENTS`, `FOOD_CATEGORIES`, `KpiCard`, `SUPPLY_CHAIN_STAGES`, `TABS`, `TRANSITION_SCENARIOS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `badge` | `(ok) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,` |
| `ghgData` | `useMemo(() => FOOD_CATEGORIES.map(c => ({ name: c.name.split(' ')[0], ghg: c.ghg })), []);` |
| `stageData` | `useMemo(() => SUPPLY_CHAIN_STAGES.map(s => ({` |
| `scope3Data` | `useMemo(() => COMPANIES.slice(0, 12).map(c => ({ name: c.name.slice(0, 8), scope3: c.scope3, regenAg: c.regenAgPct })), []);` |
| `frac` | `(yr - 2024) / 26;` |
| `financeData` | `useMemo(() => FINANCE_INSTRUMENTS.map(f => ({ name: f.name.split(' ').slice(0, 2).join(' '), aum: f.aum, growth: f.growth })), []);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/food-system/sbti-flag` | `sbti_flag` | api/v1/routes/food_system.py |
| POST | `/api/v1/food-system/fao-crop-yield` | `fao_crop_yield` | api/v1/routes/food_system.py |
| POST | `/api/v1/food-system/tnfd-food-leap` | `tnfd_food_leap` | api/v1/routes/food_system.py |
| POST | `/api/v1/food-system/eudr-food` | `eudr_food` | api/v1/routes/food_system.py |
| POST | `/api/v1/food-system/agricultural-emissions` | `agricultural_emissions` | api/v1/routes/food_system.py |
| POST | `/api/v1/food-system/flag-targets` | `flag_targets` | api/v1/routes/food_system.py |
| POST | `/api/v1/food-system/land-degradation` | `land_degradation` | api/v1/routes/food_system.py |
| GET | `/api/v1/food-system/ref/flag-sectors` | `ref_flag_sectors` | api/v1/routes/food_system.py |
| GET | `/api/v1/food-system/ref/crop-regions` | `ref_crop_regions` | api/v1/routes/food_system.py |
| GET | `/api/v1/food-system/ref/eudr-commodities` | `ref_eudr_commodities` | api/v1/routes/food_system.py |

### 2.3 Engine `food_system_engine` (services/food_system_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `FoodSystemEngine.assess_sbti_flag` | entity_id, sector, base_year, target_year, current_emissions_tco2e, achieved_reduction_pct | SBTi FLAG sector-specific science-based target assessment. |
| `FoodSystemEngine.model_fao_crop_yield` | entity_id, crop, region, baseline_yield_t_ha, adaptation_gain_pct | FAO GAEZ-based yield projections under RCP 2.6, 4.5, and 8.5. |
| `FoodSystemEngine.assess_tnfd_food_leap` | entity_id, entity_name, commodities, leap_scores, nature_scores, relied_nature_services | TNFD LEAP (Locate, Evaluate, Assess, Prepare) for food companies. |
| `FoodSystemEngine.assess_eudr_food` | entity_id, commodities, country_codes, cutoff_compliant, geolocation_coverage_pct | EUDR Art 29 compliance screening for food commodities. |
| `FoodSystemEngine.compute_agricultural_emissions` | entity_id, farm_area_ha, livestock_count, crop_type, pcaf_dqs | Farm-level GHG accounting: Scope 1 (enteric + manure + N2O + residue), |
| `FoodSystemEngine.set_flag_targets` | entity_id, assessment_id, sector, base_emissions, target_year, intervention_plan | SBTi FLAG target settings with intervention roadmap. |
| `FoodSystemEngine.assess_land_degradation` | entity_id, land_area_ha, land_use, country_code, ldn_status, degraded_area_ha | LDN (Land Degradation Neutrality) assessment per UN SDG 15.3. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `FINANCE_INSTRUMENTS`, `FOOD_CATEGORIES`, `SUPPLY_CHAIN_STAGES`, `TABS`, `TRANSITION_SCENARIOS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Food System GHG Share | — | IPCC AR6 WGIII Chapter 7 | Food systems account for 31% of global GHG emissions including land use change |
| Alt Protein Market 2023 | — | BloombergNEF Alt Protein 2024 | Alternative protein market size — projected to reach $290Bn by 2035 under IPCC 2°C pathway |
| Diet Shift Potential | — | EAT-Lancet Commission 2023 | Shifting to planetary health diets could reduce food system emissions by 8 GtCO2e/yr |
- **FAIRR protein producer database + financial data** → Stranded asset risk modelling → **Earnings sensitivity of meat processors to plant-based substitution**
- **Protein consumption data by country and segment** → Transition adoption curve modelling → **Market share evolution of alt protein by 2030/2040/2050**
- **IPCC livestock emission factors (CH4/N2O)** → GHG reduction calculation → **Scope 3 food system emissions reduction from diet transition**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/food-system/ref/crop-regions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['crops', 'regions', 'combinations', 'source', 'rcp_scenarios', 'projection_year'], 'n_keys': 6}`

**GET /api/v1/food-system/ref/eudr-commodities** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['eudr_food_commodities', 'commodity_details', 'regulation', 'enforcement_date_large_operators', 'enforcement_date_sme'], 'n_keys': 5}`

**GET /api/v1/food-system/ref/flag-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sectors', 'standard', 'scope', 'sbti_website'], 'n_keys': 4}`

**POST /api/v1/food-system/agricultural-emissions** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/food-system/eudr-food** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Protein Transition Market Model
**Headline formula:** `AltProteinShare_t = AltProteinShare_0 × (1 + AdoptionRate)^t; FoodEmissionsReduction = (ConvMeat_kg - AltProtein_kg) × EmissionFactor × ProductionVolume`
**Standards:** ['EAT-Lancet Planetary Health Diet', 'IPCC AR6 WGIII Chapter 7 — Agriculture', 'BloombergNEF Food and Agriculture Outlook 2024', 'FAIRR Protein Producer Index']

**Engine `food_system_engine` — extracted transformation lines:**
```python
land_mitigation_tco2_pa = round(current_emissions_tco2e * required_reduction_pct / 100.0, 2)
removal_tco2_pa = round(current_emissions_tco2e * removal_pct / 100.0, 2)
achieved_tco2 = round(current_emissions_tco2e * achieved_pct / 100.0, 2)
gap_tco2_pa = round(max(0.0, land_mitigation_tco2_pa - achieved_tco2), 2)
scope1_tco2e = round(livestock_count * 2.5 + farm_area_ha * 0.8, 2)
scope2_tco2e = round(farm_area_ha * 0.12, 2)
scope3_cat1_tco2e = round(farm_area_ha * 1.5, 2)
total_tco2e = round(scope1_tco2e + scope2_tco2e + scope3_cat1_tco2e, 2)
emission_intensity = round(total_tco2e / farm_area_ha, 3) if farm_area_ha > 0 else 0.0
total_required = required_reduction + required_removal
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).