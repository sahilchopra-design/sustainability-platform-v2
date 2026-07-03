# Residential RE Assessment
**Module ID:** `residential-re-assessment` · **Route:** `/residential-re-assessment` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Residential property climate risk and energy performance analytics integrating EPC ratings, flood and heat exposure, and mortgage portfolio vulnerability scoring.

> **Business value:** Provides lenders with property-level climate risk and energy efficiency analytics for residential mortgage books.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ClimatePhysicalRisk`, `EPC_GRADES`, `EpcEnergyTransition`, `MortgageStress`, `PRICE_TREND`, `PROPERTIES`, `PROP_TYPES`, `PortfolioOverview`, `REGIONS`, `RETROFIT_COSTS`, `STRESS_SCENARIOS`, `TABS`, `TENURE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(arr, s) => arr[Math.floor(sr(s) * arr.length)];` |
| `PROP_TYPES` | `["Terraced","Semi-Detached","Detached","Flat/Apartment","Bungalow"];` |
| `TENURE` | `["Owner-Occupied","Buy-to-Let","Social Housing","Shared Ownership"];` |
| `epcIdx` | `Math.min(6, Math.floor(sr(i * 7) * 7));` |
| `value` | `Math.round(150 + sr(i * 11) * 1350);  // £k` |
| `ltv` | `+(0.45 + sr(i * 13) * 0.45).toFixed(2);` |
| `physRisk` | `Math.round(10 + sr(i * 17) * 80);` |
| `floodZ` | `sr(i * 19) > 0.75;` |
| `costToC` | `epcIdx > 2 ? Math.round(5 + sr(i * 23) * 35) : 0; // £k to reach C` |
| `stranded` | `epcIdx >= 5 && sr(i * 31) > 0.4;` |
| `RETROFIT_COSTS` | `EPC_GRADES.map((g, i) => ({` |
| `totalValue` | `PROPERTIES.reduce((s,p) => s + p.value, 0);` |
| `avgLtv` | `(PROPERTIES.reduce((s,p) => s + p.ltv, 0) / (PROPERTIES.length \|\| 1) * 100).toFixed(1);` |
| `regionAgg` | `REGIONS.map(r => {` |
| `epcDist` | `EPC_GRADES.map(g => ({` |
| `scatterData` | `PROPERTIES.map(p => ({` |
| `totalRetrofitCost` | `PROPERTIES.filter(p => p.epcIdx > 2).reduce((s, p) => s + p.costToC, 0);` |
| `energyByEpc` | `EPC_GRADES.map(g => {` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/residential-re/value-property` | `value_property` | api/v1/routes/residential_re.py |
| POST | `/api/v1/residential-re/mortgage-portfolio` | `assess_mortgage_portfolio` | api/v1/routes/residential_re.py |
| POST | `/api/v1/residential-re/decarb-pathway` | `decarb_pathway` | api/v1/routes/residential_re.py |
| GET | `/api/v1/residential-re/ref/epc-energy` | `ref_epc_energy` | api/v1/routes/residential_re.py |
| GET | `/api/v1/residential-re/ref/mees-timelines` | `ref_mees_timelines` | api/v1/routes/residential_re.py |
| GET | `/api/v1/residential-re/ref/crrem-pathway` | `ref_crrem_pathway` | api/v1/routes/residential_re.py |
| GET | `/api/v1/residential-re/ref/retrofit-costs` | `ref_retrofit_costs` | api/v1/routes/residential_re.py |
| GET | `/api/v1/residential-re/ref/decarb-measures` | `ref_decarb_measures` | api/v1/routes/residential_re.py |
| GET | `/api/v1/residential-re/ref/hedonic-coefficients` | `ref_hedonic_coefficients` | api/v1/routes/residential_re.py |

### 2.3 Engine `residential_re_engine` (services/residential_re_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ResidentialRealEstateEngine.value_property` | inp | Hedonic regression-based valuation with EPC premium/discount, |
| `ResidentialRealEstateEngine.assess_mortgage_portfolio` | inp | Portfolio-level mortgage climate risk: EPC distribution, stranding |
| `ResidentialRealEstateEngine.decarb_pathway` | units, target_epc, energy_cost_eur_kwh, grid_ef_kgco2_kwh | Generate decarbonisation pathway for a social/affordable housing stock. |
| `ResidentialRealEstateEngine.get_epc_energy_map` |  |  |
| `ResidentialRealEstateEngine.get_mees_timelines` |  |  |
| `ResidentialRealEstateEngine.get_crrem_residential_pathway` |  |  |
| `ResidentialRealEstateEngine.get_retrofit_cost_matrix` |  |  |
| `ResidentialRealEstateEngine.get_decarb_measures` |  |  |
| `ResidentialRealEstateEngine.get_hedonic_coefficients` |  |  |
| `ResidentialRealEstateEngine._estimate_retrofit_cost` | from_epc, to_epc, area_m2 | Estimate total retrofit cost to improve from one EPC band to another. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `EPC_GRADES`, `PRICE_TREND`, `PROP_TYPES`, `REGIONS`, `STRESS_SCENARIOS`, `TABS`, `TENURE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EPC A/B Share | — | EPC Register | Proportion of residential portfolio with Energy Performance Certificate rating A or B. |
| Flood Zone Exposure | — | EA Flood Map | Share of mortgaged properties in high or medium flood risk zones. |
| Avg Climate Haircut | — | NGFS model | Average property value reduction attributable to physical climate risk under RCP 4.5 by 2035. |
- **Mortgage register, EPC data, hazard raster layers** → Geocoding, hazard overlay, climate haircut modelling → **Climate-adjusted LTV scores, EPC upgrade flags, portfolio heatmaps**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/residential-re/ref/crrem-pathway** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['crrem_pathway'], 'n_keys': 1}`

**GET /api/v1/residential-re/ref/decarb-measures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['measures'], 'n_keys': 1}`

**GET /api/v1/residential-re/ref/epc-energy** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['epc_energy_map'], 'n_keys': 1}`

**GET /api/v1/residential-re/ref/hedonic-coefficients** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['coefficients'], 'n_keys': 1}`

**GET /api/v1/residential-re/ref/mees-timelines** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['mees_timelines'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted LTV
**Headline formula:** `Loan Balance ÷ (Property Value × (1 – Climate Haircut))`
**Standards:** ['NGFS Physical Risk', 'EBA LOM Guidelines']

**Engine `residential_re_engine` — extracted transformation lines:**
```python
base = max(base, area * 500)  # floor: at least 500 EUR/m²
band_diff = d_idx - epc_idx  # positive = better than D
value_m2 = round(hedonic_value / area, 2) if area else 0
years_to_strand = max(0, stranding_year - 2026)
transition_haircut = 0.05 + (2035 - stranding_year) * 0.01
climate_adj_value = round(hedonic_value * (1 - transition_haircut), 2)
mortgage = inp.mortgage_balance_eur if inp.mortgage_balance_eur > 0 else actual_value * inp.mortgage_ltv
climate_ltv = round(mortgage / climate_adj_value, 4) if climate_adj_value > 0 else 0
base_ltv = round(mortgage / actual_value, 4) if actual_value > 0 else 0
ltv_stress = round((climate_ltv - base_ltv) * 10000, 1)  # bps
epc_premium_pct=round(epc_pct * 100, 2),
flood_discount_pct=round(flood_pct * 100, 2),
res.ltv_stress_bps = round(res.ltv_stress_bps * stress_mult, 1)
avg_ltv = round(total_ltv / n, 4)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).