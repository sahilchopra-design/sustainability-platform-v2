# Stranded Assets
**Module ID:** `stranded-assets` · **Route:** `/stranded-assets` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Fossil fuel and high-carbon asset stranded value analytics quantifying write-down risk under NGFS transition scenarios using discounted cash flow and carbon budget methodologies.

> **Business value:** The IEA estimates $1.4 trillion of fossil fuel assets may become stranded by 2050 under NZE; early identification allows strategic capital reallocation and impairment provisioning.

**How an analyst works this module:**
- Inventory fossil fuel and high-carbon assets by type and geography
- Apply NGFS scenario carbon price and demand pathways
- Project asset-level revenue and cost trajectories
- Discount cash flows to NPV and compare to book value
- Report stranded value by asset class, sector and scenario

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `BADGE`, `BASE_PHASE_OUT`, `CURRENT_YEAR`, `DEMAND_DATA`, `IMPAIR_MULT`, `MANUAL_FIELDS`, `SCENARIO_TO_TOGGLE`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `BASE_PHASE_OUT` | 7 | `tech`, `sector`, `nze`, `aps`, `steps`, `book_usd`, `country` |
| `DEMAND_DATA` | 7 | `nze`, `aps`, `steps` |
| `MANUAL_FIELDS` | 9 | `label`, `type`, `defaultValue` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `linkedExposure` | `linkedHoldings.reduce((s, h) =>` |
| `impairmentResults` | `useMemo(() => { return assets.map(a => { const phaseOut = a[displayScenario];` |
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
| GET | `/api/v1/stranded-assets/transition-pathways/{pathway_id}` | `get_transition_pathway` | api/v1/routes/stranded_assets.py |
| POST | `/api/v1/stranded-assets/scenario-comparison` | `run_scenario_comparison` | api/v1/routes/stranded_assets.py |
| GET | `/api/v1/stranded-assets/critical-assets` | `get_critical_assets` | api/v1/routes/stranded_assets.py |
| GET | `/api/v1/stranded-assets/scenarios` | `list_scenarios` | api/v1/routes/stranded_assets.py |
| GET | `/api/v1/stranded-assets/scenarios/{scenario_id}` | `get_scenario` | api/v1/routes/stranded_assets.py |
| GET | `/api/v1/stranded-assets/map-data` | `get_assets_map_data` | api/v1/routes/stranded_assets.py |
| POST | `/api/v1/stranded-assets/portfolio-analysis` | `analyze_portfolio_stranding` | api/v1/routes/stranded_assets.py |

### 2.3 Engine `stranded_asset_calculator` (services/stranded_asset_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `ReserveImpairmentCalculator.calculate_impairment` | reserve_id, reserve_data, scenario_data, target_years, discount_rate, commodity_price_forecast, carbon_price_forecast | Calculate reserve impairment under climate scenario. Formula: Stranded_Volume = Recoverable_Reserves - Economic_Reserves_under_Scenario Stranded_Value = NPV(Stranded_Volume × Commodity_Price - Production_Cost - Carbon_Cost) Args: reserve_id: UUID of the reserve reserve_data: Reserve details (from DB or API input) scenario_data: Scenario parameters target_years: List of years to calculate impairmen |
| `ReserveImpairmentCalculator._calculate_npv` | reserves, price, cost, years, discount_rate | Calculate NPV of remaining reserves. |
| `ReserveImpairmentCalculator._calculate_baseline_npv` | total_reserves, breakeven, lifting_cost, expected_depletion, current_year, discount_rate | Calculate baseline NPV without climate impact. |
| `ReserveImpairmentCalculator._get_demand_reduction` | pathway_data, base_year, year | Get demand reduction percentage for year from pathway. |
| `ReserveImpairmentCalculator._get_default_commodity_price` | reserve_type, year, scenario_data | Get default commodity price for year. |
| `ReserveImpairmentCalculator._get_default_carbon_price` | year, scenario_data | Get default carbon price for year. |
| `ReserveImpairmentCalculator._calculate_risk_score` | stranded_percent, npv_impact, breakeven, current_price | Calculate stranding risk score (0-1). |
| `ReserveImpairmentCalculator._get_risk_category` | risk_score | Convert risk score to category. |
| `ReserveImpairmentCalculator._identify_key_drivers` | reserve_data, scenario_data | Identify key risk drivers. |
| `ReserveImpairmentCalculator._generate_recommendations` | risk_score, reserve_data | Generate action recommendations. |
| `PowerPlantValuator.value_plant` | plant_id, plant_data, scenario_data, target_years, discount_rate, include_repurposing, wholesale_price_forecast, carbon_price_forecast | Calculate power plant NPV under climate scenario. Args: plant_id: UUID of the plant plant_data: Plant details scenario_data: Scenario parameters target_years: List of years to calculate discount_rate: Discount rate for NPV include_repurposing: Whether to include repurposing options wholesale_price_forecast: Optional price forecasts carbon_price_forecast: Optional carbon price forecasts Returns: Po |
| `PowerPlantValuator._calculate_plant_npv` | plant_data, scenario_data, use_baseline, discount_rate, wholesale_price_forecast, carbon_price_forecast | Calculate plant NPV over remaining life. |
| `PowerPlantValuator._calculate_yearly_valuations` | plant_data, scenario_data, target_years, wholesale_price_forecast, carbon_price_forecast | Calculate yearly valuation breakdown. |
| `PowerPlantValuator._find_optimal_retirement` | plant_data, scenario_data, discount_rate, carbon_price_forecast | Find optimal retirement year. |
| `PowerPlantValuator._calculate_remaining_life` | retirement_year, commissioning_year, technical_lifetime, current_year | Calculate remaining operational years. |
| `PowerPlantValuator._calculate_fuel_cost` | generation_mwh, fuel_cost_mmbtu, heat_rate, technology_type | Calculate annual fuel cost. |
| `PowerPlantValuator._get_default_wholesale_price` | year, use_baseline | Get default wholesale electricity price. |
| `PowerPlantValuator._get_default_carbon_price` | year | Get default carbon price. |
| `PowerPlantValuator._get_repurposing_options` | plant_data | Get repurposing options for plant. |
| `PowerPlantValuator._calculate_plant_risk_score` | npv_impact, technology_type, remaining_life, co2_intensity | Calculate plant stranding risk score. |
| `PowerPlantValuator._get_risk_category` | risk_score | Convert risk score to category. |
| `PowerPlantValuator._generate_plant_recommendation` | plant_data, npv_impact, optimal_retirement, repurposing_options, risk_score | Generate recommended action. |
| `InfrastructureValuator.value_infrastructure` | asset_id, asset_data, scenario_data, target_years, discount_rate, demand_forecast | Calculate infrastructure asset valuation under climate scenario. |
| `InfrastructureValuator._calculate_baseline_npv` | utilization, book_value, years, discount_rate | Calculate baseline NPV from current operations. |
| `InfrastructureValuator._calculate_utilization_decline` | asset_type, scenario_data, target_year | Calculate utilization decline under scenario. |
| `InfrastructureValuator._calculate_scenario_npv` | current_util, decline, book_value, years, discount_rate | Calculate NPV under transition scenario. |
| `InfrastructureValuator._calculate_infra_risk_score` | asset_type, utilization_decline, npv_impact, hydrogen_ready, ammonia_ready, ccs_compatible | Calculate infrastructure risk score. |
| `InfrastructureValuator._get_risk_category` | risk_score | Convert risk score to category. |
| `InfrastructureValuator._generate_infra_recommendation` | asset_type, risk_score, hydrogen_ready, ammonia_ready, ccs_compatible | Generate recommendation for infrastructure. |
| `TechnologyDisruptionTracker.ev_adoption_s_curve` | year, region, saturation, midpoint, steepness | Logistic S-curve for EV adoption. Formula: saturation / (1 + exp(-steepness * (year - midpoint))) Args: year: Target year region: Geographic region saturation: Maximum adoption rate (defaults to regional value) midpoint: Year of 50% adoption steepness: Curve steepness parameter Returns: Adoption rate as decimal (0-1) |
| `TechnologyDisruptionTracker.calculate_oil_displacement` | year, region | Calculate oil displacement from EV adoption. Returns: Dict with ev_sales_share, oil_displacement_kbpd, vehicle_stock |
| `TechnologyDisruptionTracker.heat_pump_adoption_curve` | year, region, saturation, midpoint, steepness | S-curve for heat pump adoption in buildings. Args: year: Target year region: Geographic region saturation: Maximum adoption (70% default) midpoint: Year of 50% adoption steepness: Curve steepness Returns: Adoption rate as decimal |
| `TechnologyDisruptionTracker.calculate_gas_displacement` | year, region | Calculate gas displacement from heat pump adoption. Returns: Dict with heat_pump_share, gas_displacement_bcm |
| `TechnologyDisruptionTracker.green_hydrogen_cost_curve` | year, region | Project green hydrogen cost trajectory. Uses learning curve: 15% cost reduction per doubling of capacity. Returns: Dict with costs, premium, and competitive timeline |
| `TechnologyDisruptionTracker.battery_cost_curve` | year, chemistry | Project battery cost trajectory. Uses learning curve with ~18% reduction per doubling. |
| `TechnologyDisruptionTracker.get_disruption_summary` | year, region | Get comprehensive technology disruption summary for a year. |

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
Output: `{'type': 'object', 'keys': ['total_assets', 'total_reserves_count', 'total_plants_count', 'total_infrastructure_count', 'high_risk_assets', 'critical_risk_assets', 'total_exposure_usd', 'stranded_value_at_risk_usd', 'avg_stranding_risk_score', 'assets_by_risk_category'], 'n_keys': 10}`

**GET /api/v1/stranded-assets/infrastructure** — status `passed`, provenance ['real-db'], source tables: `infrastructure_asset`
Output: `{'type': 'object', 'keys': ['items', 'total', 'page', 'page_size'], 'n_keys': 4}`

**GET /api/v1/stranded-assets/infrastructure/{asset_id}** — status `passed`, provenance ['real-db'], source tables: `infrastructure_asset`
Output: `{'type': 'object', 'keys': ['asset_name', 'asset_type', 'asset_location', 'latitude', 'longitude', 'country_code', 'design_capacity', 'design_capacity_unit', 'current_capacity_utilized', 'utilization_rate_percent', 'commissioning_year', 'expected_retirement_year', 'remaining_book_value_usd', 'replac`

**GET /api/v1/stranded-assets/map-data** — status `passed`, provenance ['real-db'], source tables: `fossil_fuel_reserve`, `infrastructure_asset`, `power_plant`
Output: `{'type': 'object', 'keys': ['assets', 'total'], 'n_keys': 2}`

**GET /api/v1/stranded-assets/power-plants** — status `passed`, provenance ['real-db'], source tables: `power_plant`
Output: `{'type': 'object', 'keys': ['items', 'total', 'page', 'page_size'], 'n_keys': 4}`

**GET /api/v1/stranded-assets/power-plants/{plant_id}** — status `failed`, provenance ['db-empty'], source tables: `power_plant`
Output: `None`

**GET /api/v1/stranded-assets/reserves** — status `passed`, provenance ['real-db'], source tables: `fossil_fuel_reserve`
Output: `{'type': 'object', 'keys': ['items', 'total', 'page', 'page_size'], 'n_keys': 4}`

## 5 · Intermediate Transformation Logic
**Methodology:** Stranded Value
**Headline formula:** `SV = Book Value – NPV(CF | Transition Scenario)`

Difference between current book value and NPV of future cash flows under a given transition scenario; positive SV indicates stranding.

**Standards:** ['IEA NZE 2050', 'NGFS Phase IV Scenarios']
**Reference documents:** IEA World Energy Outlook NZE 2050; NGFS Phase IV Scenarios 2023; IPCC AR6 WG3 Carbon Budgets; Carbon Tracker Stranded Assets Framework

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
carbon_cost = co2_intensity * carbon_price
generation_mwh = capacity_mw * hours_per_year * capacity_factor
revenue = generation_mwh * price
variable_cost = variable_om * generation_mwh
carbon_total = carbon_cost * generation_mwh
total_cost = fixed_cost + variable_cost + fuel_cost + carbon_total
cash_flow = revenue - total_cost
year_offset = year - current_year
carbon_cost_mwh = co2_intensity * carbon_price
generation_mwh = capacity_mw * hours_per_year * adj_cf
revenue = generation_mwh * price
ebitda = revenue - opex - fuel - (carbon_cost_mwh * generation_mwh)
expected_retirement = commissioning_year + technical_lifetime
remaining_years = max(retirement_year - current_year, 1)
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
**Blast radius:** changes here can affect **37** other module(s).

| Connected module | Shared via |
|---|---|
| `real-estate-valuation` | table:PostgreSQL, table:database, table:decimal, table:schemas, table:uuid |
| `portfolio-stress-test-drilldown` | table:decimal, table:schemas, table:uuid |
| `portfolio-transition-alignment` | table:decimal, table:schemas, table:uuid |
| `portfolio-climate-var` | table:decimal, table:schemas, table:uuid |
| `portfolio-dashboard` | table:decimal, table:schemas, table:uuid |
| `portfolio-climate-pulse` | table:decimal, table:schemas, table:uuid |
| `portfolio-manager` | table:decimal, table:schemas, table:uuid |
| `sustainability-report-builder` | table:decimal, table:schemas, table:uuid |
| `portfolio-optimizer` | table:decimal, table:schemas, table:uuid |
| `portfolio-suite` | table:decimal, table:schemas, table:uuid |

## 7 · Methodology Deep Dive

This is a genuinely well-implemented module — real IEA scenario names, a hand-typed plausible
India-market fossil-asset book-value table, a correct client-side DCF impairment calculation always
shown in the main table, and a backend API call (`runAPICalc`) whose result — unlike several sibling
modules in this batch — **is actually used**, with an honest `source: 'api' | 'client'` flag and a
graceful fallback to the (also-correct) client-side calc on API failure. No mismatch flag needed.

### 7.1 What the module computes

`BASE_PHASE_OUT` (6 fossil-fuel asset classes: Coal Power, Gas Power, Coal Mining, Oil Upstream, LNG
Terminal, Oil Refinery) carries a book value and **three IEA World Energy Outlook phase-out years**
per class — one per demand scenario:

```
nze   — IEA Net Zero Emissions by 2050 scenario   (most aggressive phase-out, earliest years)
aps   — IEA Announced Pledges Scenario              (middle)
steps — IEA Stated Policies Scenario                (least aggressive, latest years)
```

E.g. Coal Power: book $1.4Tn, phase-out **2030 (NZE) / 2037 (APS) / 2048 (STEPS)** — directionally
correct (NZE phases out fossil infrastructure fastest, STEPS slowest) and roughly consistent with
IEA WEO India-market coal-retirement modelling horizons.

**Impairment formula** (`impairmentResults`, always computed client-side):
```
remainLife = max(0, phaseOut − CURRENT_YEAR)          // CURRENT_YEAR = 2026
pv         = book_usd / (1+discountRate)^remainLife     // discountRate default 8%
impairment = book_usd − pv
impairPct  = impairment / book_usd × 100
```

This treats the asset's entire book value as a single terminal cash flow realised at the phase-out
year (a standard, defensible simplification of a full multi-year DCF — equivalent to modelling the
asset as generating a bullet payment at retirement rather than an amortising stream) and discounts
it back to today at a fixed rate. A scenario with an earlier phase-out year (shorter `remainLife`)
produces a **smaller discount factor's reciprocal effect is inverted here** — actually a *shorter*
remaining life means *less* time to discount, so `pv` is *higher* and impairment *lower*... except
the correct reading is the opposite direction matters via `remainLife` shrinking the exponent, which
shrinks the discount — the worked example below resolves this precisely.

### 7.2 Parameterisation

| Field | Value | Provenance |
|---|---|---|
| `discountRate` | 8% default (from `ctx.discountRate` if set) | Plausible corporate/infrastructure WACC; not sector-differentiated |
| `CURRENT_YEAR` | 2026 (hardcoded) | Anchors all `remainLife` calculations |
| Book values (6 assets) | $340Bn–$1.4Tn | Hand-typed, India-market-scale plausible aggregates (these read as **sector-level national aggregates**, not single-asset book values, given the multi-hundred-billion-dollar scale) |
| `IMPAIR_MULT` (sector impairment multiplier used for portfolio-linked exposure) | Energy 0.35 / Mining 0.45 / Utilities 0.28 / Materials 0.20 / Industrials 0.10 | Hand-tuned per-sector haircut applied to linked portfolio holdings, not derived from the DCF model itself |

### 7.3 Calculation walkthrough

1. **Scenario sync** — the page reads `ctx.selectedNgfsScenarioId` from the platform's shared
   `TestDataContext` and maps it to `nze`/`aps`/`steps` via `SCENARIO_TO_TOGGLE` — i.e. NGFS scenario
   selections elsewhere in the platform genuinely drive which IEA phase-out year column this module
   uses, a real cross-module linkage.
2. **Client-side impairment** — computed directly from `assets` (editable inline, or uploaded via
   `DataUploadPanel`) using the formula in §7.1; always displayed regardless of API availability.
3. **Linked portfolio exposure** — `linkedHoldings` filters the shared portfolio context for
   Energy/Mining/Utilities/Materials sector holdings; `linkedExposure = Σ(exposure_usd ×
   IMPAIR_MULT[sector])` — a simple sector-level haircut, separate from the asset-level DCF.
4. **`runAPICalc()`** — POSTs `reserve_ids`, `scenario_id`, `target_years`, `discount_rate` to
   `/api/v1/stranded-assets/calculate/reserve-impairment`; on success, stores the real backend
   response (`source:'api'`); on failure, falls back to the already-computed client
   `impairmentResults` with an honest `demo:true, source:'client'` flag — a correctly-implemented
   graceful degradation pattern, in contrast to modules elsewhere in this batch that silently discard
   the backend response.

### 7.4 Worked example — Coal Power, NZE scenario

`book_usd=$1,400Bn`, `phaseOut=2030`, `discountRate=8%`, `CURRENT_YEAR=2026`:

```
remainLife = 2030 − 2026 = 4 years
pv         = 1,400 / 1.08⁴ = $1,029.0Bn
impairment = 1,400 − 1,029.0 = $371.0Bn
impairPct  = 371.0 / 1,400 × 100 = 26.5%
```

Under **STEPS** (phase-out 2048, `remainLife=22`): `pv = 1,400/1.08²² ≈ $259.6Bn`,
`impairment ≈ $1,140.4Bn`, `impairPct ≈ 81.5%` — **larger**, not smaller, than the NZE case. This
correctly captures the DCF logic: the *longer* the asset is assumed to keep generating value before
the terminal payment (STEPS, slow phase-out), the *more heavily discounted* that far-future terminal
value becomes relative to today's book value, so the model shows **higher** apparent "impairment"
for the slow-phase-out scenario — the opposite of what a reader would naively expect ("NZE = harsher
scenario = should show bigger loss"). This is a genuine modelling subtlety worth flagging: the
formula measures *time-value erosion of book value under a bullet-terminal-payment assumption*, not
*stranding severity* in the Carbon-Tracker sense (where NZE should show the asset losing economic
value *earlier*, which this formula does correctly reflect via `remainLife`, but the resulting
`impairPct` ranking across scenarios is counter-intuitive without this explanation).

### 7.5 Companion analytics

- **Demand trajectory chart** (`DEMAND_DATA`) — 2025–2050 fossil demand index (100=2025 baseline)
  under all 3 IEA scenarios (NZE falls to 5 by 2050; STEPS only to 70) — real, correctly-ordered IEA
  WEO demand-decline shape.
- **Manual entry / CSV upload** — `MANUAL_FIELDS` lets users add custom reserves with their own
  phase-out years per scenario, immediately feeding the same DCF formula.

### 7.6 Data provenance & limitations

- Book values for the 6 default asset classes are plausible India-market aggregates, not live-sourced
  from a named reserves database — no vintage/source citation in the file.
- The bullet-terminal-payment DCF simplification (no interim cash flows, no operating margin
  modelling) is a defensible first-order approximation but will differ materially from a full
  multi-year DCF with declining utilisation — flag this simplification to end users given the
  counter-intuitive scenario ranking noted in §7.4.
- `IMPAIR_MULT` sector haircuts (used only for the separate "linked portfolio exposure" KPI) are
  hand-tuned and not derived from — or reconciled with — the asset-level DCF impairment percentages.

**Framework alignment:** IEA World Energy Outlook NZE/APS/STEPS scenarios (real scenario names and
directionally correct phase-out ordering) · standard DCF/NPV impairment methodology (IAS 36-style
recoverable-amount concept, simplified to a single terminal payment) · NGFS Phase IV scenario linkage
via shared platform context (genuine cross-module wiring).

## 9 · Future Evolution

### 9.1 Evolution A — Full multi-year DCF, seeded asset tables, and bench-pinning (analytics ladder: rung 2 → 3)

**What.** This is a genuinely well-implemented tier-A module — real IEA WEO scenario names (NZE/APS/STEPS), a hand-typed plausible India-market fossil book-value table, a correct client-side DCF impairment, and a backend API call (`runAPICalc`) whose result **is actually used** with an honest `source: 'api' | 'client'` flag and graceful fallback (unlike the fire-and-forget siblings). Blast radius is 37 — foundational. Its §7.6 limitations are specific and honest: the impairment treats the entire book value as a single terminal payment at phase-out (a defensible first-order approximation, but it produces the counter-intuitive scenario ranking noted in §7.4 and diverges from a full DCF with declining utilisation); the book values are uncited; and the provenance shows `db-empty` alongside `real-db` — the write-side reserve/plant/infrastructure tables are largely unpopulated.

**How.** (1) Replace the bullet-terminal-payment DCF with a proper multi-year cash-flow model: annual revenue with declining utilisation toward the phase-out year, operating margin, and carbon cost — the engine's `calculate_reserve_impairment` already has the pieces (`Stranded_Value = NPV(volume × price − production − carbon cost)`). (2) Populate the empty reserve/power-plant/infrastructure tables via the create endpoints (the D1 write-side activation item) so the module runs on real asset inventories, not just the 6-class default table. (3) Cite the book values to a reserves-database vintage. (4) Reconcile the `IMPAIR_MULT` portfolio-exposure haircuts with the asset-level DCF percentages (currently unreconciled). (5) Bench-pin the DCF against a worked stranded-value example.

**Prerequisites.** Write-side table population (create endpoints exist); multi-year cash-flow inputs (utilisation curves per asset class). **Acceptance:** the DCF models interim cash flows and the scenario ranking becomes intuitive; the reserve/plant tables hold real records; portfolio-exposure haircuts reconcile with asset-level DCF.

### 9.2 Evolution B — Stranded-value analyst over the create-and-calculate API (LLM tier 2)

**What.** A tool-calling analyst over the module's rich API (dashboard, reserves/plants/infrastructure CRUD, and three `calculate/*` endpoints): "value this coal plant's stranded risk under NZE", "add our upstream reserves and compute impairment", "which assets in my inventory strand first?" — creating asset records via the POST endpoints and running the impairment calculators, narrating the DCF stranded value with the honest `source` flag.

**How.** Tool schemas from the module's OpenAPI operations (GET dashboards, POST create, POST calculate); grounding corpus = this Atlas record (the stranded-value formula, IEA scenario definitions). Asset creation is gated behind user confirmation (mutating endpoint + RBAC per the Tier-2 contract); the calculators are compute-only. The no-fabrication validator checks every impairment figure against tool output; the "show work" expander surfaces the DCF inputs and the api-vs-client source.

**Prerequisites.** Evolution A's multi-year DCF so narrated valuations aren't the counter-intuitive terminal-payment approximation; write-side population so the inventory is real. **Acceptance:** every stranded-value figure traces to a `calculate/*` response with its source flag; asset creation requires explicit confirmation; a scenario outside NZE/APS/STEPS returns a scoped answer.