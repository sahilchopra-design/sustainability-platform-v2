# Real Estate Valuation
**Module ID:** `real-estate-valuation` · **Route:** `/real-estate-valuation` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate-adjusted property valuation incorporating physical hazard risk, transition cost obligations, and energy efficiency premium/discount modelling.

> **Business value:** Enables surveyors, lenders, and investors to incorporate climate risk systematically into property valuation, reflecting emerging market pricing of physical and transition risk.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BREEAM`, `BREEAM_PREMIUM`, `CLIMATE_SCENARIO_FACTORS`, `EPC_PREMIUM`, `EPC_RATINGS`, `GRESB_FUNDS`, `LOCATIONS`, `LOC_CAP_ADJ`, `PORTFOLIO`, `PROP_TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `EPC_PREMIUM` | `{ A: 0.08, B: 0.04, C: 0, D: -0.02, E: -0.06, F: -0.10, G: -0.15 };` |
| `BREEAM_PREMIUM` | `{ Outstanding: 0.05, Excellent: 0.03, 'Very Good': 0.01, Good: 0, Pass: -0.01, Unrated: -0.02 };` |
| `LOC_CAP_ADJ` | `{ 'London City': 0.0, 'London West End': -0.3, Manchester: 0.8, Edinburgh: 0.6, Birmingham: 0.9, Bristol: 0.7 };` |
| `type` | `PROP_TYPES[Math.floor(sr(i * 3 + 1) * PROP_TYPES.length)];` |
| `loc` | `LOCATIONS[Math.floor(sr(i * 5 + 2) * LOCATIONS.length)];` |
| `epc` | `EPC_RATINGS[Math.floor(sr(i * 7 + 3) * EPC_RATINGS.length)];` |
| `breeam` | `BREEAM[Math.floor(sr(i * 11 + 4) * BREEAM.length)];` |
| `baseCapRate` | `4.5 + sr(i * 13 + 5) * 4 + LOC_CAP_ADJ[loc];` |
| `noi` | `+(1 + sr(i * 17 + 6) * 12).toFixed(2);` |
| `climateHaircut` | `+(1 + sr(i * 19 + 7) * 12).toFixed(1);` |
| `baseRisk` | `{ flood: +(10 + sr(i * 23 + 8) * 70), heat: +(10 + sr(i * 29 + 9) * 70), subsidence: +(5 + sr(i * 31 + 10) * 60), coastal: +(5 + sr(i * 37 + 11) * 65)` |
| `totalRisk` | `+(Object.values(baseRisk).reduce((a, b) => a + b, 0) / 5).toFixed(1);` |
| `gresb` | `Math.floor(55 + sr(i * 7 + 1) * 45);` |
| `mgmt` | `Math.floor(50 + sr(i * 11 + 2) * 50);` |
| `perf` | `Math.floor(45 + sr(i * 13 + 3) * 55);` |
| `greenAdj` | `greenApplied ? epcAdj + breeamAdj : 0;` |
| `adjustedCapRate` | `Math.max(2.5, capRate - greenAdj * capRate);` |
| `grossValue` | `propNOI / (capRate / 100);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/valuation/dashboard` | `get_dashboard_kpis` | api/v1/routes/real_estate_valuation.py |
| GET | `/api/v1/valuation/properties` | `list_properties` | api/v1/routes/real_estate_valuation.py |
| GET | `/api/v1/valuation/properties/{property_id}` | `get_property` | api/v1/routes/real_estate_valuation.py |
| POST | `/api/v1/valuation/properties` | `create_property` | api/v1/routes/real_estate_valuation.py |
| POST | `/api/v1/valuation/income/direct-capitalization` | `calculate_direct_capitalization` | api/v1/routes/real_estate_valuation.py |
| POST | `/api/v1/valuation/income/dcf` | `calculate_dcf` | api/v1/routes/real_estate_valuation.py |
| POST | `/api/v1/valuation/cost/replacement` | `calculate_replacement_cost` | api/v1/routes/real_estate_valuation.py |
| GET | `/api/v1/valuation/cost/construction-costs` | `get_construction_costs` | api/v1/routes/real_estate_valuation.py |
| GET | `/api/v1/valuation/cost/location-factors` | `get_location_factors` | api/v1/routes/real_estate_valuation.py |
| POST | `/api/v1/valuation/sales-comparison` | `calculate_sales_comparison` | api/v1/routes/real_estate_valuation.py |
| GET | `/api/v1/valuation/comparables` | `list_comparable_sales` | api/v1/routes/real_estate_valuation.py |
| GET | `/api/v1/valuation/comparables/{comparable_id}` | `get_comparable_sale` | api/v1/routes/real_estate_valuation.py |
| POST | `/api/v1/valuation/comparables` | `create_comparable_sale` | api/v1/routes/real_estate_valuation.py |
| POST | `/api/v1/valuation/comprehensive` | `run_comprehensive_valuation` | api/v1/routes/real_estate_valuation.py |
| GET | `/api/v1/valuation/market/cap-rates` | `get_market_cap_rates` | api/v1/routes/real_estate_valuation.py |

### 2.3 Engine `real_estate_db_service` (services/real_estate_db_service.py)
| Function | Args | Purpose |
|---|---|---|
| `get_engine` |  | Get SQLAlchemy engine with connection pooling disabled for serverless. |
| `RealEstateDBService.get_all_properties` | property_type, city, user_id, page, page_size | Get all properties with optional filtering. |
| `RealEstateDBService.get_property_by_id` | property_id | Get a single property by ID. |
| `RealEstateDBService.create_property` | data | Create a new property. |
| `RealEstateDBService._row_to_property_dict` | row | Convert database row to property dictionary. |
| `RealEstateDBService.get_all_comparables` | property_type, city, page, page_size | Get all comparable sales with optional filtering. |
| `RealEstateDBService.get_comparable_by_id` | comp_id | Get a single comparable sale by ID. |
| `RealEstateDBService.get_comparables_for_property` | property_type, city, limit | Get comparable sales for a property type and city. |
| `RealEstateDBService.create_comparable` | data | Create a new comparable sale. |
| `RealEstateDBService._row_to_comparable_dict` | row | Convert database row to comparable dictionary. |
| `RealEstateDBService.get_dashboard_metrics` |  | Get aggregated dashboard metrics for real estate valuation. |
| `get_real_estate_db_service` |  | Get singleton instance of database service. |

### 2.3 Engine `real_estate_valuation_engine` (services/real_estate_valuation_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CostDataService.get_construction_cost` | construction_type, quality | Get base construction cost per SF. |
| `CostDataService.get_location_factor` | location | Get location adjustment factor. |
| `MarketDataService.get_cap_rate` | property_type, quality, tier | Get market cap rate for property type and quality. |
| `MarketDataService.get_location_adjustment` | subject_location, comp_location | Calculate location adjustment between subject and comparable. |
| `RealEstateValuationEngine.income_approach_direct_cap` | inputs | Calculate property value using direct capitalization method. |
| `RealEstateValuationEngine.income_approach_dcf` | inputs | Calculate property value using Discounted Cash Flow analysis. |
| `RealEstateValuationEngine.cost_approach` | inputs | Calculate property value using replacement cost method. |
| `RealEstateValuationEngine.sales_comparison` | request | Calculate property value using sales comparison approach. |
| `RealEstateValuationEngine.comprehensive_valuation` | property_data, income_inputs, cost_inputs, comparables, weights, include_income | Run comprehensive valuation using all three approaches and reconcile. |
| `RealEstateValuationEngine._calculate_irr` | cash_flows, max_iterations | Calculate Internal Rate of Return using Newton-Raphson method. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`, `mock-sample`, `real-db`

**Database tables:** `PostgreSQL` *(shared)*, `database` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `decimal` *(shared)*, `fastapi` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*, `uuid` *(shared)*
**Frontend seed datasets:** `BREEAM`, `EPC_RATINGS`, `LOCATIONS`, `PROP_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Estimated Climate Discount (%) | — | Valuation Engine | Modelled reduction in market value for asset at high physical and transition risk vs comparable low-risk asset |
| Energy Upgrade Capex (£/m²) | — | CRREM CapEx Tool | Estimated capital required per square metre to achieve net-zero operational carbon pathway. |
| Stranding Risk Premium (bps) | — | Lender Survey | Additional yield premium demanded by lenders for assets at near-term stranding risk. |
- **Property fundamentals + EPC + hazard scores + CRREM pathways** → Climate-adjusted DCF; stranding analysis; capex scenario modelling → **Climate-adjusted valuation report with scenario ranges**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/valuation/comparables** — status `passed`, provenance ['real-db'], source tables: `comparable_sales`
Output: `{'type': 'object', 'keys': ['items', 'total'], 'n_keys': 2}`

**GET /api/v1/valuation/comparables/{comparable_id}** — status `passed`, provenance ['real-db'], source tables: `comparable_sales`
Output: `{'type': 'object', 'keys': ['property_type', 'address', 'city', 'state_province', 'country', 'latitude', 'longitude', 'sale_date', 'sale_price', 'size_sf', 'year_built', 'num_units', 'occupancy_rate', 'quality_rating', '`

**GET /api/v1/valuation/cost/construction-costs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['construction_costs', 'total'], 'n_keys': 2}`

**GET /api/v1/valuation/cost/location-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['location_factors', 'description'], 'n_keys': 2}`

**GET /api/v1/valuation/dashboard** — status `passed`, provenance ['real-db'], source tables: `properties`, `valuations`
Output: `{'type': 'object', 'keys': ['total_properties', 'total_valuations', 'total_portfolio_value', 'avg_cap_rate', 'avg_value_per_sf', 'properties_by_type', 'valuations_by_method', 'recent_valuations'], 'n_keys': 8}`

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted DCF
**Headline formula:** `V = Σ(NOI_t / (1+r+r_climate)^t) – PV(capex_energy)`
**Standards:** ['RICS Valuation Professional Standards (2024)', 'CRREM Stranding Risk Methodology']

**Engine `real_estate_db_service` — extracted transformation lines:**
```python
offset = (page - 1) * page_size
offset = (page - 1) * page_size
```

**Engine `real_estate_valuation_engine` — extracted transformation lines:**
```python
rental_income = inputs.rentable_area_sf * inputs.market_rent_per_sf
pgi = rental_income + inputs.other_income
vacancy_loss = pgi * inputs.vacancy_rate
collection_loss = pgi * inputs.collection_loss_rate
egi = pgi - vacancy_loss - collection_loss
operating_expenses = egi * inputs.operating_expense_ratio
noi = egi - operating_expenses
property_value = noi / inputs.cap_rate
base_revenue = current_noi / STABILIZED_NOI_MARGIN
base_expenses = base_revenue - current_noi
noi = revenue - expenses
cfads = noi - debt_service
final_noi = cash_flows[-1].noi
terminal_value = terminal_noi / terminal_cap_rate
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **63** other module(s).

| Connected module | Shared via |
|---|---|
| `stranded-assets` | table:PostgreSQL, table:database, table:datetime, table:db, table:decimal, table:schemas |
| `carbon-aware-allocation` | table:database, table:datetime, table:db, table:schemas, table:sqlalchemy |
| `carbon-capture-finance` | table:database, table:datetime, table:db, table:schemas, table:sqlalchemy |
| `carbon-credit-audit-trail` | table:database, table:datetime, table:db, table:schemas, table:sqlalchemy |
| `carbon-wallet` | table:database, table:datetime, table:db, table:schemas, table:sqlalchemy |
| `carbon-adjusted-valuation` | table:database, table:datetime, table:db, table:schemas, table:sqlalchemy |
| `carbon-storage-geology` | table:database, table:datetime, table:db, table:schemas, table:sqlalchemy |
| `carbon-budget` | table:database, table:datetime, table:db, table:schemas, table:sqlalchemy |
| `carbon-reduction-projects` | table:database, table:datetime, table:db, table:schemas, table:sqlalchemy |
| `carbon-footprint-intelligence` | table:database, table:datetime, table:db, table:schemas, table:sqlalchemy |