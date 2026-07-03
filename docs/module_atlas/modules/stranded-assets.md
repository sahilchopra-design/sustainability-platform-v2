# Stranded Assets
**Module ID:** `stranded-assets` · **Route:** `/stranded-assets` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Fossil fuel and high-carbon asset stranded value analytics quantifying write-down risk under NGFS transition scenarios using discounted cash flow and carbon budget methodologies.

> **Business value:** The IEA estimates $1.4 trillion of fossil fuel assets may become stranded by 2050 under NZE; early identification allows strategic capital reallocation and impairment provisioning.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `BADGE`, `BASE_PHASE_OUT`, `CURRENT_YEAR`, `DEMAND_DATA`, `IMPAIR_MULT`, `MANUAL_FIELDS`, `SCENARIO_TO_TOGGLE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `linkedExposure` | `linkedHoldings.reduce((s, h) =>` |
| `remainLife` | `Math.max(0, phaseOut - CURRENT_YEAR);` |
| `impairment` | `a.book_usd - pv;` |
| `impairPct` | `(impairment / a.book_usd) * 100;` |
| `totalImpairment` | `impairmentResults.reduce((s, a) => s + a.impairment, 0);` |
| `totalBook` | `impairmentResults.reduce((s, a) => s + a.book_usd, 0);` |
| `res` | `await axios.post(`${API}/api/v1/stranded-assets/calculate/reserve-impairment`, {` |
| `allTechs` | `[...new Set(assets.map(a => a.tech))];` |
| `csv` | `['Asset ID,Technology,Sector,Book Value USD,Phase-Out Year,Remaining Life (Y),PV USD,Impairment USD,Impairment %',` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/stranded-assets/dashboard` | `get_dashboard_kpis` | api/v1/routes/stranded_assets.py |
| GET | `/api/v1/stranded-assets/reserves` | `list_reserves` | api/v1/routes/stranded_assets.py |
| GET | `/api/v1/stranded-assets/reserves/{reserve_id}` | `get_reserve` | api/v1/routes/stranded_assets.py |
| POST | `/api/v1/stranded-assets/reserves` | `create_reserve` | api/v1/routes/stranded_assets.py |
| GET | `/api/v1/stranded-assets/power-plants` | `list_power_plants` | api/v1/routes/stranded_assets.py |
| GET | `/api/v1/stranded-assets/power-plants/{plant_id}` | `get_power_plant` | api/v1/routes/stranded_assets.py |
| POST | `/api/v1/stranded-assets/power-plants` | `create_power_plant` | api/v1/routes/stranded_assets.py |
| GET | `/api/v1/stranded-assets/infrastructure` | `list_infrastructure` | api/v1/routes/stranded_assets.py |
| GET | `/api/v1/stranded-assets/infrastructure/{asset_id}` | `get_infrastructure` | api/v1/routes/stranded_assets.py |
| POST | `/api/v1/stranded-assets/infrastructure` | `create_infrastructure` | api/v1/routes/stranded_assets.py |
| POST | `/api/v1/stranded-assets/calculate/reserve-impairment` | `calculate_reserve_impairment` | api/v1/routes/stranded_assets.py |
| POST | `/api/v1/stranded-assets/calculate/power-plant-valuation` | `calculate_power_plant_valuation` | api/v1/routes/stranded_assets.py |
| POST | `/api/v1/stranded-assets/calculate/infrastructure-valuation` | `calculate_infrastructure_valuation` | api/v1/routes/stranded_assets.py |
| GET | `/api/v1/stranded-assets/technology-disruption/{metric_type}` | `get_technology_disruption` | api/v1/routes/stranded_assets.py |
| GET | `/api/v1/stranded-assets/transition-pathways` | `list_transition_pathways` | api/v1/routes/stranded_assets.py |

### 2.3 Engine `stranded_asset_calculator` (services/stranded_asset_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `ReserveImpairmentCalculator.calculate_impairment` | reserve_id, reserve_data, scenario_data, target_years, discount_rate, commodity_price_forecast | Calculate reserve impairment under climate scenario. |
| `ReserveImpairmentCalculator._calculate_npv` | reserves, price, cost, years, discount_rate | Calculate NPV of remaining reserves. |
| `ReserveImpairmentCalculator._calculate_baseline_npv` | total_reserves, breakeven, lifting_cost, expected_depletion, current_year, discount_rate | Calculate baseline NPV without climate impact. |
| `ReserveImpairmentCalculator._get_demand_reduction` | pathway_data, base_year, year | Get demand reduction percentage for year from pathway. |
| `ReserveImpairmentCalculator._get_default_commodity_price` | reserve_type, year, scenario_data | Get default commodity price for year. |
| `ReserveImpairmentCalculator._get_default_carbon_price` | year, scenario_data | Get default carbon price for year. |
| `ReserveImpairmentCalculator._calculate_risk_score` | stranded_percent, npv_impact, breakeven, current_price | Calculate stranding risk score (0-1). |
| `ReserveImpairmentCalculator._get_risk_category` | risk_score | Convert risk score to category. |
| `ReserveImpairmentCalculator._identify_key_drivers` | reserve_data, scenario_data | Identify key risk drivers. |
| `ReserveImpairmentCalculator._generate_recommendations` | risk_score, reserve_data | Generate action recommendations. |
| `PowerPlantValuator.value_plant` | plant_id, plant_data, scenario_data, target_years, discount_rate, include_repurposing | Calculate power plant NPV under climate scenario. |
| `PowerPlantValuator._calculate_plant_npv` | plant_data, scenario_data, use_baseline, discount_rate, wholesale_price_forecast, carbon_price_forecast | Calculate plant NPV over remaining life. |
| `PowerPlantValuator._calculate_yearly_valuations` | plant_data, scenario_data, target_years, wholesale_price_forecast, carbon_price_forecast | Calculate yearly valuation breakdown. |
| `PowerPlantValuator._find_optimal_retirement` | plant_data, scenario_data, discount_rate, carbon_price_forecast | Find optimal retirement year. |
| `PowerPlantValuator._calculate_remaining_life` | retirement_year, commissioning_year, technical_lifetime, current_year | Calculate remaining operational years. |
| `PowerPlantValuator._calculate_fuel_cost` | generation_mwh, fuel_cost_mmbtu, heat_rate, technology_type | Calculate annual fuel cost. |
| `PowerPlantValuator._get_default_wholesale_price` | year, use_baseline | Get default wholesale electricity price. |
| `PowerPlantValuator._get_default_carbon_price` | year | Get default carbon price. |

### 2.3 Engine `stranded_asset_db_service` (services/stranded_asset_db_service.py)
| Function | Args | Purpose |
|---|---|---|
| `get_engine` |  | Get SQLAlchemy engine with connection pooling disabled for serverless. |
| `StrandedAssetDBService.get_all_reserves` | reserve_type, reserve_category, is_operating, user_id, page, page_size | Get all fossil fuel reserves with optional filtering. |
| `StrandedAssetDBService.get_reserve_by_id` | reserve_id | Get a single reserve by ID. |
| `StrandedAssetDBService.create_reserve` | data | Create a new fossil fuel reserve. |
| `StrandedAssetDBService._row_to_reserve_dict` | row | Convert database row to reserve dictionary. |
| `StrandedAssetDBService.get_all_plants` | technology_type, country_code, is_operating, user_id, page, page_size | Get all power plants with optional filtering. |
| `StrandedAssetDBService.get_plant_by_id` | plant_id | Get a single power plant by ID. |
| `StrandedAssetDBService.create_plant` | data | Create a new power plant. |
| `StrandedAssetDBService._row_to_plant_dict` | row | Convert database row to plant dictionary. |
| `StrandedAssetDBService.get_all_infrastructure` | asset_type, country_code, is_operating, user_id, page, page_size | Get all infrastructure assets with optional filtering. |
| `StrandedAssetDBService.get_infrastructure_by_id` | asset_id | Get a single infrastructure asset by ID. |
| `StrandedAssetDBService.create_infrastructure` | data | Create a new infrastructure asset. |
| `StrandedAssetDBService._row_to_infrastructure_dict` | row | Convert database row to infrastructure dictionary. |
| `StrandedAssetDBService.get_all_pathways` | sector, region | Get all energy transition pathways with optional filtering. |
| `StrandedAssetDBService.get_pathway_by_id` | pathway_id | Get a single pathway by ID. |
| `StrandedAssetDBService._row_to_pathway_dict` | row | Convert database row to pathway dictionary. |
| `StrandedAssetDBService.get_dashboard_metrics` |  | Get aggregated dashboard metrics from all asset tables. |
| `get_stranded_asset_db_service` |  | Get singleton instance of database service. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`, `mock-sample`, `real-db`

**Database tables:** `PostgreSQL` *(shared)*, `database` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `decimal` *(shared)*, `demand`, `fastapi` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `typing` *(shared)*, `utilization`, `uuid` *(shared)*
**Frontend seed datasets:** `BASE_PHASE_OUT`, `DEMAND_DATA`, `MANUAL_FIELDS`
**Shared context buses:** `TestDataContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Stranded Value | — | DCF Model | Total estimated write-down under IEA NZE 2050 scenario applied to fossil fuel holdings. |
| Stranding Ratio | — | Asset Registry | Proportion of fossil fuel book value at risk of impairment under 1.5°C scenario. |
| Carbon Budget Remaining | — | IPCC AR6 | Global carbon budget consistent with 50% probability of limiting warming to 1.5°C from 2020. |
- **Asset Registry, NGFS Scenario Pathways, Carbon Price Curves** → DCF engine + carbon budget allocation model → **Stranded value by asset, stranding probability distribution, scenario comparison**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/stranded-assets/critical-assets** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['alerts', 'total', 'critical_count', 'high_count'], 'n_keys': 4}`

**GET /api/v1/stranded-assets/dashboard** — status `passed`, provenance ['real-db'], source tables: `fossil_fuel_reserve`, `infrastructure_asset`, `power_plant`
Output: `{'type': 'object', 'keys': ['total_assets', 'total_reserves_count', 'total_plants_count', 'total_infrastructure_count', 'high_risk_assets', 'critical_risk_assets', 'total_exposure_usd', 'stranded_value_at_risk_usd', 'avg`

**GET /api/v1/stranded-assets/infrastructure** — status `passed`, provenance ['real-db'], source tables: `infrastructure_asset`
Output: `{'type': 'object', 'keys': ['items', 'total', 'page', 'page_size'], 'n_keys': 4}`

**GET /api/v1/stranded-assets/infrastructure/{asset_id}** — status `passed`, provenance ['real-db'], source tables: `infrastructure_asset`
Output: `{'type': 'object', 'keys': ['asset_name', 'asset_type', 'asset_location', 'latitude', 'longitude', 'country_code', 'design_capacity', 'design_capacity_unit', 'current_capacity_utilized', 'utilization_rate_percent', 'comm`

**GET /api/v1/stranded-assets/map-data** — status `passed`, provenance ['real-db'], source tables: `fossil_fuel_reserve`, `infrastructure_asset`, `power_plant`
Output: `{'type': 'object', 'keys': ['assets', 'total'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic
**Methodology:** Stranded Value
**Headline formula:** `SV = Book Value – NPV(CF | Transition Scenario)`
**Standards:** ['IEA NZE 2050', 'NGFS Phase IV Scenarios']

**Engine `stranded_asset_calculator` — extracted transformation lines:**
```python
Stranded_Volume = Recoverable_Reserves - Economic_Reserves_under_Scenario
Stranded_Value = NPV(Stranded_Volume × Commodity_Price - Production_Cost - Carbon_Cost)
total_reserves = proven + probable
total_cost = lifting_cost + carbon_cost_per_unit + capex_per_unit
stranded_volume = total_reserves - economic_reserves
years_to_horizon = max(year - current_year, 1)
demand_reduction_percent=round(demand_reduction * 100, 2),
final_year = yearly_impairments[-1] if yearly_impairments else None
annual_production = reserves / Decimal(str(years))
annual_cash_flow = annual_production * (price - cost)
remaining_years = max(expected_depletion - current_year, 10)
years_from_base = year - base_year
years_from_now = year - date.today().year
year = current_year + year_offset
```

**Engine `stranded_asset_db_service` — extracted transformation lines:**
```python
offset = (page - 1) * page_size
offset = (page - 1) * page_size
offset = (page - 1) * page_size
total_assets = reserves_count + plants_count + infra_count
total_exposure = float(reserves_exposure) + float(plants_exposure) + float(infra_exposure)
stranded_value = total_exposure * 0.15  # 15% at risk estimate
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **63** other module(s).

| Connected module | Shared via |
|---|---|
| `real-estate-valuation` | table:PostgreSQL, table:database, table:datetime, table:db, table:decimal, table:schemas |
| `portfolio-optimizer` | table:datetime, table:db, table:decimal, table:schemas, table:uuid |
| `portfolio-stress-test-drilldown` | table:datetime, table:db, table:decimal, table:schemas, table:uuid |
| `portfolio-transition-alignment` | table:datetime, table:db, table:decimal, table:schemas, table:uuid |
| `portfolio-dashboard` | table:datetime, table:db, table:decimal, table:schemas, table:uuid |
| `portfolio-climate-var` | table:datetime, table:db, table:decimal, table:schemas, table:uuid |
| `portfolio-suite` | table:datetime, table:db, table:decimal, table:schemas, table:uuid |
| `portfolio-temperature-score` | table:datetime, table:db, table:decimal, table:schemas, table:uuid |
| `portfolio-climate-pulse` | table:datetime, table:db, table:decimal, table:schemas, table:uuid |
| `portfolio-manager` | table:datetime, table:db, table:decimal, table:schemas, table:uuid |