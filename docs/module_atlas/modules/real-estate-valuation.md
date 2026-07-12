# Real Estate Valuation
**Module ID:** `real-estate-valuation` · **Route:** `/real-estate-valuation` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate-adjusted property valuation incorporating physical hazard risk, transition cost obligations, and energy efficiency premium/discount modelling.

> **Business value:** Enables surveyors, lenders, and investors to incorporate climate risk systematically into property valuation, reflecting emerging market pricing of physical and transition risk.

**How an analyst works this module:**
- Input property details: location, type, size, EPC rating.
- Apply physical hazard and CRREM transition risk adjustment.
- Compute climate-adjusted DCF and comparable market discount.
- Model energy upgrade scenarios and value uplift.

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
| `baseRisk` | `{ flood: +(10 + sr(i * 23 + 8) * 70), heat: +(10 + sr(i * 29 + 9) * 70), subsidence: +(5 + sr(i * 31 + 10) * 60), coastal: +(5 + sr(i * 37 + 11) * 65), wildfire: +(5 + sr(i * 41 + 12) * 45) };` |
| `totalRisk` | `+(Object.values(baseRisk).reduce((a, b) => a + b, 0) / 5).toFixed(1);` |
| `gresb` | `Math.floor(55 + sr(i * 7 + 1) * 45);` |
| `mgmt` | `Math.floor(50 + sr(i * 11 + 2) * 50);` |
| `perf` | `Math.floor(45 + sr(i * 13 + 3) * 55);` |
| `greenAdj` | `greenApplied ? epcAdj + breeamAdj : 0;` |
| `adjustedCapRate` | `Math.max(2.5, capRate - greenAdj * capRate);` |
| `grossValue` | `propNOI / (capRate / 100);` |
| `adjustedValue` | `propNOI / (adjustedCapRate / 100);` |
| `greenDelta` | `adjustedValue - grossValue;` |
| `climateHaircutPct` | `+(2 + sr(propGIA * 0.001 + 1) * 8).toFixed(1);` |
| `climateAdjValue` | `adjustedValue * (1 - climateHaircutPct / 100);` |
| `compEvidence` | `useMemo(() => { return PORTFOLIO.filter(p => p.type === propType && p.loc === propLoc).slice(0, 5) .concat(PORTFOLIO.filter(p => p.type === propType).slice(0, 3)) .slice(0, 5) .map(p => ({ name: p.name, capRate: p.baseCapRate, noi: p.noi, value: +(p.noi / (p.baseCapRate / 100)).toFixed(1), epc: p.epc }));` |
| `totalClimateRisk` | `+(Object.values(climateRiskScores).reduce((a, b) => a + b, 0) / 5).toFixed(1);` |
| `scenarioHaircuts` | `Object.entries(CLIMATE_SCENARIO_FACTORS).map(([sc, fac]) => ({` |
| `bulkRanked` | `useMemo(() => [...PORTFOLIO].sort((a, b) => b.totalRisk - a.totalRisk), []);` |
| `annualGap` | `Math.max(0, (gresb2030Target - fund.gresb) / yearsTo2030);` |
| `peerRank` | `useMemo(() => { const sorted = [...GRESB_FUNDS].filter(f => f.sector === fund.sector).sort((a, b) => b.gresb - a.gresb);` |
| `pos` | `sorted.findIndex(f => f.id === fund.id) + 1;` |
| `total` | `+(Object.values(scores).reduce((a, b) => a + b, 0) / 5).toFixed(1);` |

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
| GET | `/api/v1/valuation/map-data` | `get_properties_map_data` | api/v1/routes/real_estate_valuation.py |

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
| `RealEstateValuationEngine.income_approach_direct_cap` | inputs | Calculate property value using direct capitalization method. Formula: Value = NOI / Cap Rate Where NOI = EGI - Operating Expenses And EGI = PGI - Vacancy Loss - Collection Loss |
| `RealEstateValuationEngine.income_approach_dcf` | inputs | Calculate property value using Discounted Cash Flow analysis. Generates year-by-year projections and calculates NPV, IRR. |
| `RealEstateValuationEngine.cost_approach` | inputs | Calculate property value using replacement cost method. Formula: Value = Land Value + (RCN - Total Depreciation) |
| `RealEstateValuationEngine.sales_comparison` | request | Calculate property value using sales comparison approach. Adjusts comparable sales for differences with subject property. |
| `RealEstateValuationEngine.comprehensive_valuation` | property_data, income_inputs, cost_inputs, comparables, weights, include_income, include_cost, include_sales | Run comprehensive valuation using all three approaches and reconcile. |
| `RealEstateValuationEngine._calculate_irr` | cash_flows, max_iterations | Calculate Internal Rate of Return using Newton-Raphson method. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`, `mock-sample`, `real-db`

**Database tables:** `PostgreSQL` *(shared)*, `database` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `decimal` *(shared)*, `fastapi` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*, `uuid` *(shared)*
**Frontend seed datasets:** `BREEAM`, `EPC_RATINGS`, `LOCATIONS`, `PROP_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Estimated Climate Discount (%) | — | Valuation Engine | Modelled reduction in market value for asset at high physical and transition risk vs comparable low-risk asset. |
| Energy Upgrade Capex (£/m²) | — | CRREM CapEx Tool | Estimated capital required per square metre to achieve net-zero operational carbon pathway. |
| Stranding Risk Premium (bps) | — | Lender Survey | Additional yield premium demanded by lenders for assets at near-term stranding risk. |
- **Property fundamentals + EPC + hazard scores + CRREM pathways** → Climate-adjusted DCF; stranding analysis; capex scenario modelling → **Climate-adjusted valuation report with scenario ranges**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/valuation/comparables** — status `passed`, provenance ['real-db'], source tables: `comparable_sales`
Output: `{'type': 'object', 'keys': ['items', 'total'], 'n_keys': 2}`

**GET /api/v1/valuation/comparables/{comparable_id}** — status `passed`, provenance ['real-db'], source tables: `comparable_sales`
Output: `{'type': 'object', 'keys': ['property_type', 'address', 'city', 'state_province', 'country', 'latitude', 'longitude', 'sale_date', 'sale_price', 'size_sf', 'year_built', 'num_units', 'occupancy_rate', 'quality_rating', 'condition_rating', 'data_source', 'verified', 'id', 'price_per_sf', 'created_at'`

**GET /api/v1/valuation/cost/construction-costs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['construction_costs', 'total'], 'n_keys': 2}`

**GET /api/v1/valuation/cost/location-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['location_factors', 'description'], 'n_keys': 2}`

**GET /api/v1/valuation/dashboard** — status `passed`, provenance ['real-db'], source tables: `properties`, `valuations`
Output: `{'type': 'object', 'keys': ['total_properties', 'total_valuations', 'total_portfolio_value', 'avg_cap_rate', 'avg_value_per_sf', 'properties_by_type', 'valuations_by_method', 'recent_valuations'], 'n_keys': 8}`

**GET /api/v1/valuation/map-data** — status `failed`, provenance ['real-db'], source tables: `properties`
Output: `None`

**GET /api/v1/valuation/market/cap-rates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cap_rates', 'total', 'as_of_date'], 'n_keys': 3}`

**GET /api/v1/valuation/properties** — status `passed`, provenance ['real-db'], source tables: `properties`
Output: `{'type': 'object', 'keys': ['items', 'total', 'page', 'page_size'], 'n_keys': 4}`

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted DCF
**Headline formula:** `V = Σ(NOI_t / (1+r+r_climate)^t) – PV(capex_energy)`

Discounted cash flow with climate risk premium added to discount rate and capex requirement for energy upgrade netted from value.

**Standards:** ['RICS Valuation Professional Standards (2024)', 'CRREM Stranding Risk Methodology']
**Reference documents:** RICS Valuation Professional Standards 2024 (Red Book); CRREM Property Type Pathways and CapEx Tool

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
terminal_value_present = terminal_value_net * terminal_pv_factor
npv = total_pv + terminal_value_present
adj_cap = terminal_cap_rate + Decimal(str(delta))
adj_pv = adj_terminal * terminal_pv_factor
adj_disc = discount_rate + Decimal(str(delta))
adj_npv = total_pv + terminal_value_net * adj_pv_factor
land_value = inputs.land_area_acres * inputs.land_value_per_acre
rcn_before_adj = inputs.building_area_sf * base_cost_per_sf
rcn = rcn_before_adj * inputs.location_factor
age_life_ratio = Decimal(str(inputs.effective_age)) / Decimal(str(inputs.total_economic_life))
physical_depreciation = rcn * age_life_ratio * condition_factor
functional_obsolescence = deficiencies_total + superadequacies_total
external_obsolescence = rcn * inputs.external_obsolescence_percent
total_depreciation = physical_depreciation + functional_obsolescence + external_obsolescence
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **67** other module(s).

| Connected module | Shared via |
|---|---|
| `stranded-assets` | table:PostgreSQL, table:database, table:decimal, table:schemas, table:uuid |
| `carbon-market-intelligence` | table:database, table:schemas, table:sqlalchemy |
| `carbon-integrity-mrv-analytics` | table:database, table:schemas, table:sqlalchemy |
| `carbon-institutions-taxonomy` | table:database, table:schemas, table:sqlalchemy |
| `carbon-footprint-intelligence` | table:database, table:schemas, table:sqlalchemy |
| `carbon-reduction-projects` | table:database, table:schemas, table:sqlalchemy |
| `carbon-aware-allocation` | table:database, table:schemas, table:sqlalchemy |
| `carbon-forward-curve` | table:database, table:schemas, table:sqlalchemy |
| `carbon-project-lifecycle` | table:database, table:schemas, table:sqlalchemy |
| `carbon-removal-markets` | table:database, table:schemas, table:sqlalchemy |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

This is the platform's best-implemented real-estate valuation module and is the module that
should actually back the "Climate Adjusted Value" methodology the sibling `real-assets-climate`
guide entry describes (but that module's code never implements it — see its own deep dive). Three
linked calculations:

```
grossValue      = NOI / (capRate / 100)                                   // income capitalisation
adjustedCapRate = max(2.5, capRate − greenAdj × capRate)                  // green-premium yield compression
adjustedValue   = NOI / (adjustedCapRate / 100)
climateHaircutPct = 2 + sr(GIA×0.001 + 1) × 8                             // 2–10%
climateAdjValue = adjustedValue × (1 − climateHaircutPct / 100)
```

where `greenAdj = EPC_PREMIUM[epc] + BREEAM_PREMIUM[breeam]` when the user toggles "apply green
adjustment" on.

**Guide simplification note:** the guide's formula is a multi-period DCF with a climate-risk-loaded
discount rate and a capex-netting term, `V = Σ(NOI_t/(1+r+r_climate)^t) − PV(capex_energy)`. The
code instead uses a **single-period income capitalisation** (`NOI/capRate`, standard UK valuation
practice) with climate risk applied as a **post-hoc percentage haircut on value**, not as an
addition to the discount rate, and no explicit energy-capex NPV is netted off. This is a
legitimate, commonly-used valuation shortcut (RICS Red Book permits direct capitalisation for
stabilised assets) but is not literally the guide's stated DCF formula.

### 7.2 Parameterisation

| Table | Values | Provenance |
|---|---|---|
| `EPC_PREMIUM` | A +8%, B +4%, C 0, D −2%, E −6%, F −10%, G −15% | Synthetic but directionally consistent with published "green premium/brown discount" literature (JLL, CBRE studies report low-single-digit to low-teens % swings by EPC band) |
| `BREEAM_PREMIUM` | Outstanding +5%, Excellent +3%, Very Good +1%, Good 0, Pass −1%, Unrated −2% | Synthetic, same directional logic |
| `LOC_CAP_ADJ` (cap-rate location adjustment, pts) | London City 0.0, West End −0.3, Manchester +0.8, Edinburgh +0.6, Birmingham +0.9, Bristol +0.7 | Synthetic — correctly reflects that prime London carries the lowest (most expensive) cap rate and regional UK cities trade wider |
| `CLIMATE_SCENARIO_FACTORS` (hazard multiplier by scenario) | Current 1.0× all; RCP4.5 flood 1.3/heat 1.5/subsidence 1.2/coastal 1.4/wildfire 1.6; RCP8.5 flood 1.8/heat 2.2/subsidence 1.5/coastal 2.0/wildfire 2.5; NZ2050 flood 1.1/heat 1.2/subsidence 1.0/coastal 1.1/wildfire 1.2 | Synthetic but ordinally correct: RCP8.5 (hot-house) > RCP4.5 (moderate) > NZ2050 (managed transition) ≈ Current, and heat/wildfire scale faster than flood/subsidence — consistent with IPCC AR6 physical-hazard trajectories |
| `climateHaircutPct` range | 2–10% | Synthetic, order-of-magnitude consistent with the sibling guide's own cited "Estimated Climate Discount 8.4%" |
| GRESB 2030 target | 85 (out of 100), 4-year horizon | UI assumption, not sourced to a specific GRESB target-setting standard |

### 7.3 Calculation walkthrough

1. **Property Valuation tab**: user sets NOI (£M), base cap rate (%), EPC, BREEAM, GIA. `epcAdj`
   and `breeamAdj` are looked up from the premium tables; if "apply green adjustment" is toggled,
   `greenAdj = epcAdj+breeamAdj` compresses the cap rate (`adjustedCapRate`, floored at 2.5% to
   avoid an unrealistic/negative yield), which **raises** value since `V=NOI/capRate` is inversely
   proportional to the rate. `climateHaircutPct` (seeded off `propGIA`) then multiplies down the
   green-adjusted value to `climateAdjValue`.
2. **Comparable evidence** (`compEvidence`): pulls up to 5 properties from the static 30-asset
   `PORTFOLIO` matching the selected type+location (falling back to type-only matches), each with
   its own implied value `noi/(baseCapRate/100)` — a genuine comparable-transaction-style cross
   check against the user's inputs.
3. **Climate Risk Overlay tab**: for a selected portfolio property, `climateRiskScores` scale the
   property's `baseRisk` (5 hazards, each 5–80 at "Current") by the selected scenario's hazard
   multipliers, capped at 100. `totalClimateRisk` is the unweighted mean of the 5 scaled hazard
   scores (equal-weighted, unlike the hazard-weighted composite in `real-estate-climate-risk`).
4. **Scenario haircut comparison** (`scenarioHaircuts`): for every scenario, computes
   `mean(hazardFactors) × property.climateHaircut × 0.4` — i.e. the property's own base climate
   haircut (1–13%, seeded at property creation) scaled by how severe the scenario's average hazard
   multiplier is, times a 0.4 dampening constant.
5. **Bulk ranking** (`bulkRanked`): all 30 portfolio properties sorted by `totalRisk` descending —
   `totalRisk` is the mean of the 5 **base** (Current-scenario) hazard scores set at property
   creation, independent of the currently-selected scenario in the Climate Risk tab.
6. **GRESB Benchmarking tab**: 20 named UK-listed REITs with synthetic `gresb`/`mgmt`/`perf`
   scores; `annualGap = max(0, (85 − fund.gresb)/4)` — required annual point improvement to hit an
   85-by-2030 target; `peerRank` — sector-relative rank by GRESB score among funds sharing the
   same `sector` tag.

### 7.4 Worked example

Property Valuation tab, `propNOI=£3.5M`, `capRate=5.0%`, `epc=A` (+8%), `breeam=Very Good` (+1%),
green adjustment **applied**, `propGIA=50,000 m²`:

| Step | Formula | Result |
|---|---|---|
| `grossValue` | `3.5/(5.0/100)` | **£70.0M** |
| `greenAdj` | `0.08+0.01` | 0.09 |
| `adjustedCapRate` | `max(2.5, 5.0−0.09×5.0)` | `5.0−0.45=` **4.55%** |
| `adjustedValue` | `3.5/(4.55/100)` | **£76.92M** |
| `greenDelta` | `76.92−70.0` | **+£6.92M** (+9.9% green uplift) |
| `climateHaircutPct` | `2+sr(50000×0.001+1)×8 = 2+sr(51)×8` | `sr(51)=frac(sin(52)×10⁴)≈0.6603` → `2+5.28=` **7.3%** |
| `climateAdjValue` | `76.92×(1−0.073)` | **£71.30M** |

Net effect: EPC-A/BREEAM-Very-Good green premium adds ~£6.9M, climate physical-risk haircut
removes ~£5.6M, landing close to the ungreened base value — illustrating how a green premium can
be materially eroded by physical climate risk on the same asset.

### 7.5 GRESB target-gap rubric

| Metric | Formula |
|---|---|
| Annual GRESB gap | `max(0, (85 − current) / 4)` pts/yr needed to reach 85 by 2030 |
| Peer rank | position within same-sector fund list sorted by GRESB descending |

### 7.6 Companion analytics

Property Valuation (single-asset calculator + comparable evidence table), Climate Risk Overlay
(per-property hazard radar + scenario haircut bar + bulk 30-property risk ranking), GRESB
Benchmarking (fund scorecard + sector peer rank + carbon/energy/water intensity), Methodology tab
(static text describing the approach).

### 7.7 Data provenance & limitations

- **All 30 portfolio properties and 20 GRESB funds are synthetic**, generated by
  `sr(seed)=frac(sin(seed+1)×10⁴)`; property and fund names are real-sounding UK addresses/REIT
  names used as labels only, not linked to actual valuations or GRESB scores.
- Single-period income capitalisation, not a full multi-period DCF as the guide's formula states —
  no explicit cash-flow projection, terminal value, or discount-rate build-up.
- Climate haircut is a **flat percentage on value**, not derived from the same hazard scores shown
  in the Climate Risk Overlay tab for the *same* property — the two climate metrics
  (`climateHaircutPct` in the Valuation tab vs `climateRiskScores`/`totalClimateRisk` in the Risk
  Overlay tab) are computed from different, uncorrelated seeds for the same asset.
- `scenarioHaircuts` mixes a property's own climate haircut constant with the *portfolio-average*
  hazard multiplier rather than that property's own scaled hazard scores — an internal
  inconsistency a model-validation reviewer would flag.
- No energy-upgrade capex NPV is netted from value despite being named in the guide ("Energy
  Upgrade Capex £142/m²" data point) — retrofit cost does not appear anywhere in this file.

**Framework alignment:** RICS Valuation – Professional Standards (Red Book) — direct income
capitalisation is a RICS-permitted method for stabilised income-producing assets · CRREM — invoked
by name in the header but no per-property CRREM pathway/stranding-year check exists in this file
(contrast with `real-estate-carbon-analytics`) · GRESB — fund-level Management/Performance
component scores are represented structurally, though the composite `gresb` score is a single
synthetic draw rather than GRESB's real weighted-aspect scoring · TCFD — physical-hazard scenario
overlay (Current/RCP4.5/RCP8.5/NZ2050) follows TCFD's recommended scenario-analysis structure.

## 9 · Future Evolution

### 9.1 Evolution A — Internally consistent climate-adjusted valuation with retrofit NPV (analytics ladder: rung 2 → 3)

**What.** The valuation mechanics are sound RICS practice — direct income capitalisation with EPC/BREEAM cap-rate premia (the platform's reference implementation of a green-value adjustment) — but §7.7 flags internal inconsistencies a model validator would fail: the Valuation tab's `climateHaircutPct` and the Risk Overlay tab's `climateRiskScores` are drawn from different, uncorrelated seeds for the same property; `scenarioHaircuts` mixes a property's own haircut with the portfolio-average hazard multiplier; and the guide's energy-upgrade capex (£142/m²) appears nowhere — retrofit cost is never netted from value. Evolution A makes the module self-consistent and completes the upgrade-scenario feature.

**How.** (1) Derive the haircut from the property's own hazard scores: one climate-risk vector per asset (from the digital-twin scorer once geocoded), feeding both the overlay display and the haircut via a documented score→discount function — one source, two views. (2) `scenarioHaircuts` scales the property's own hazards by scenario factor, fixing the portfolio-average leak. (3) Implement upgrade economics: retrofit capex (per-m² cost by EPC jump) vs value uplift from the existing `EPC_PREMIUM` ladder, yielding an upgrade NPV and payback — closing the guide's promised workflow step. (4) Port the valuation chain behind the existing `/api/v1/valuation/*` routes (backend endpoints exist but the page computes client-side) and pin the §7.4 worked example.

**Prerequisites.** Geocoding for the register; score→haircut function documented with basis (the emerging brown-discount literature) per Atlas §8 convention. **Acceptance:** the same property's overlay scores and valuation haircut are algebraically linked (changing one hazard changes both); an EPC D→B upgrade scenario reports capex, uplift, and NPV that reconcile with the premium ladder.

### 9.2 Evolution B — Valuer's assistant with Red-Book-aware narration (LLM tier 2)

**What.** Surveyors need the number and the defensible narrative. The copilot drafts valuation commentary from computed state: "explain the £2.1M green delta on this asset — which certification premium drives it, and what comparable evidence supports the cap rate?", using the module's own `compEvidence` comparable-selection output; and runs what-ifs ("value at EPC B post-retrofit under Disorderly") as tool calls against the Evolution-A endpoints.

**How.** Tier-2 tool schemas over the valuation/upgrade/scenario endpoints; system prompt grounded in §7.2's premium tables and §7.7's method limitations, so commentary always states the method (single-period income capitalisation, RICS-permitted for stabilised assets — not a multi-period DCF) rather than implying more. Comparable-evidence citations name the specific register rows the `compEvidence` filter selected. Hard rule inherited from platform convention: valuation figures for real addresses are never asserted — the register's property names are labels, and the copilot must present outputs as model valuations of entered inputs, not market appraisals.

**Prerequisites.** Evolution A consistency fixes (narrating today's uncorrelated haircut/overlay pair would expose the contradiction §7.7 documents); endpoint wiring. **Acceptance:** commentary figures match tool outputs; the method statement appears in every draft; upgrade advice quotes the computed NPV, not a generic claim.