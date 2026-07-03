# Energy Transition Lending Analytics
**Module ID:** `energy-transition-lending` · **Route:** `/energy-transition-lending` · **Tier:** A (backend vertical) · **EP code:** EP-DO4 · **Sprint:** DO

## 1 · Overview
Analyses bank lending to energy transition assets — renewable project finance, green mortgages for EV charging, energy efficiency lending, and coal exit financing. Models Paris-aligned lending portfolio, green asset ratio (GAR), and PCAF financed emissions for energy sector loans.

> **Business value:** Required for EU bank CSRD/GAR disclosure, ECB climate risk supervision expectations, and PCAF signatory reporting. Provides Paris-aligned energy lending analytics integrating PCAF financed emissions with EU Taxonomy GAR and portfolio temperature scoring.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ASSET_CLASSES`, `KpiCard`, `LENDERS`, `LENDER_TYPES`, `MiniBar`, `RATINGS`, `REGIONS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `RATINGS` | `['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB'];` |
| `type` | `LENDER_TYPES[Math.floor(sr(i*7+1)*LENDER_TYPES.length)];` |
| `region` | `REGIONS[Math.floor(sr(i*11+2)*REGIONS.length)];` |
| `rating` | `RATINGS[Math.floor(sr(i*13+3)*RATINGS.length)];` |
| `commitmentBn` | `parseFloat((0.2 + sr(i*17+4)*19.8).toFixed(2));` |
| `avgTenor` | `parseFloat((8 + sr(i*19+5)*17).toFixed(1));` |
| `spread` | `Math.round(80 + sr(i*23+6)*280);` |
| `assetClass` | `ASSET_CLASSES[Math.floor(sr(i*29+7)*ASSET_CLASSES.length)];` |
| `greenLoanPct` | `parseFloat((20 + sr(i*31+8)*75).toFixed(1));` |
| `refinancingRisk` | `parseFloat((5 + sr(i*37+9)*60).toFixed(0));` |
| `avgDscr` | `parseFloat((1.1 + sr(i*41+1)*1.4).toFixed(2));` |
| `llcr` | `parseFloat((1.15 + sr(i*43+2)*0.85).toFixed(2));` |
| `firstLoss` | `parseFloat((3 + sr(i*47+3)*12).toFixed(1));` |
| `subordinated` | `parseFloat((sr(i*53+4)*20).toFixed(1));` |
| `watchlist` | `sr(i*59+5) > 0.8;` |
| `totalCommitment` | `filtered.reduce((s, l) => s + l.commitmentBn, 0);` |
| `avgSpread` | `filtered.reduce((s, l) => s + l.spread, 0) / n;` |
| `avgTenor` | `filtered.reduce((s, l) => s + l.avgTenor, 0) / n;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/energy-transition/fleet-transition` | `fleet_transition` | api/v1/routes/energy_transition.py |
| POST | `/api/v1/energy-transition/grid-ef-projection` | `grid_ef_projection` | api/v1/routes/energy_transition.py |
| POST | `/api/v1/energy-transition/avoided-emissions` | `avoided_emissions` | api/v1/routes/energy_transition.py |
| POST | `/api/v1/energy-transition/country-comparison` | `country_comparison` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/fuel-types` | `ref_fuel_types` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/nze-milestones` | `ref_nze_milestones` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/replacement-options` | `ref_replacement_options` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/grid-ef-countries` | `ref_grid_countries` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/grid-ef-scenarios` | `ref_grid_scenarios` | api/v1/routes/energy_transition.py |

### 2.3 Engine `generation_transition` (services/generation_transition.py)
| Function | Args | Purpose |
|---|---|---|
| `GenerationTransitionPlanner.plan_transition` | fleet_name, plants, target_year, replacement_tech, carbon_price_eur_t, base_year | Generate a fleet transition plan. |
| `GenerationTransitionPlanner._auto_replace` | fuel_type | Select replacement technology based on original fuel type. |
| `GenerationTransitionPlanner._interpolate_nze` | year, base_emissions, base_year | Interpolate NZE target emissions for a given year. |
| `GenerationTransitionPlanner.get_fuel_types` |  |  |
| `GenerationTransitionPlanner.get_nze_milestones` |  |  |
| `GenerationTransitionPlanner.get_replacement_options` |  |  |

### 2.3 Engine `grid_ef_trajectory` (services/grid_ef_trajectory.py)
| Function | Args | Purpose |
|---|---|---|
| `GridEFTrajectoryEngine.project_grid_ef` | country, scenario, start_year, end_year | Project grid EF trajectory for a country under a scenario. |
| `GridEFTrajectoryEngine.avoided_emissions` | country, scenario, annual_generation_mwh, start_year, project_lifetime_years | Calculate avoided emissions for a renewable project. |
| `GridEFTrajectoryEngine.compare_countries` | countries, scenario | Compare grid EF trajectories across countries. |
| `GridEFTrajectoryEngine._interpolate_ef` | year, ef_base, scen, base_year | Interpolate grid EF for a given year using scenario target factors. |
| `GridEFTrajectoryEngine.get_countries` |  |  |
| `GridEFTrajectoryEngine.get_scenarios` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `renewable` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ASSET_CLASSES`, `LENDER_TYPES`, `RATINGS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EU Bank Green Asset Ratio | — | EBA Basel IV/GAR Survey 2023 | Average EU bank green asset ratio 7% — target 50%+ for Paris-aligned transition per industry estimates |
| Energy Sector Loan Share | — | ECB Bank Lending Survey 2023 | Energy sector represents 8–15% of large bank loan portfolios — primary driver of financed emissions |
| Renewable Project Finance Market | — | BloombergNEF Project Finance 2024 | Global renewable energy project finance $580Bn in 2023 — record high, growing 25% yr-on-yr |
- **Energy sector loan tape with company/project IDs** → PCAF emissions calculation → **Financed Scope 1+2 emissions by borrower**
- **EU Taxonomy screening criteria for energy activities** → GAR calculation → **Taxonomy-aligned vs eligible energy loans**
- **IEA scenario demand for energy by fuel type** → Portfolio temperature score → **Loan-weighted temperature alignment for energy portfolio**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/energy-transition/ref/fuel-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['coal_subcritical', 'coal_supercritical', 'coal_usc', 'gas_ocgt', 'gas_ccgt', 'gas_ccgt_ccs', 'oil', 'biomass', 'nuclear', 'wind_onshore', 'wind_offshore', 'solar_pv', 'hydro', 'battery'], 'n_`

**GET /api/v1/energy-transition/ref/grid-ef-countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['DE', 'FR', 'NL', 'PL', 'ES', 'IT', 'GB', 'SE', 'US', 'CN', 'IN', 'JP', 'AU', 'BR', 'ZA', 'KR', 'CA', 'MX', 'ID', 'SA', 'AE', 'NG', 'EG', 'TH', 'VN'], 'n_keys': 25}`

**GET /api/v1/energy-transition/ref/grid-ef-scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['current_policies', 'stated_policies', 'nze_2050', 'ngfs_orderly', 'ngfs_disorderly', 'ngfs_hot_house'], 'n_keys': 6}`

**GET /api/v1/energy-transition/ref/nze-milestones** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': [2025, 2030, 2035, 2040, 2050], 'n_keys': 5}`

**GET /api/v1/energy-transition/ref/replacement-options** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 8, 'item0_keys': None}`

## 5 · Intermediate Transformation Logic
**Methodology:** Energy Transition Lending Portfolio
**Headline formula:** `GreenAssetRatio = GreenLoans / TotalLoans; PCAF_energy = Σ [(Loan_i/EnterpriseValue_i) × Scope1_i + (Loan_j/PropertyValue_j) × EnergyUse_j × EF_j]; ParisAlignment = Σ [Loan_weight_i × TemperatureScore_i]`
**Standards:** ['EU Taxonomy Green Asset Ratio (GAR) Disclosure', 'PCAF Standard Part A+B+C 2022', 'EBA Climate Risk — Green Lending Guidance 2023', 'Partnership for Paris Aligned Finance Energy Sector Guidelines']

**Engine `generation_transition` — extracted transformation lines:**
```python
p.annual_generation_mwh = p.capacity_mw * 8760 * p.capacity_factor_pct / 100
years_available = target_year - base_year
retire_year = base_year + int((i + 1) * years_available / num_fossil) if num_fossil > 0 else base_year
age = retire_year - plant.commissioning_year
co2_avoided = plant.annual_generation_mwh * ef
remaining_life = max(0, plant.commissioning_year + expected_life - retire_year)
stranded_frac = remaining_life / expected_life if expected_life > 0 else 0
stranded_value = plant.book_value_eur * stranded_frac
rep_cap = plant.capacity_mw * multiplier
yr_emissions = current_emissions - cumulative_saved
frac = (year - y0) / (y1 - y0) if y1 > y0 else 0
ef_yr = ef0 + (ef1 - ef0) * frac
```

**Engine `grid_ef_trajectory` — extracted transformation lines:**
```python
reduction = (1 - ef_2050 / ef_base) * 100 if ef_base > 0 else 0
yr = start_year + i
avoided = annual_generation_mwh * ef
avg_ef = ef_sum / project_lifetime_years if project_lifetime_years > 0 else 0
frac = (year - base_year) / (2030 - base_year) if 2030 > base_year else 0
factor = 1 + (f_2030 - 1) * frac
frac = (year - 2030) / 20
factor = f_2030 + (f_2050 - f_2030) * frac
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **2** other module(s).
**Shared engines (edits propagate!):** `generation_transition` (used by 3 modules), `grid_ef_trajectory` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `energy-transition-dashboard` | engine:generation_transition, engine:grid_ef_trajectory, table:renewable |
| `energy-transition-analytics` | engine:generation_transition, engine:grid_ef_trajectory, table:renewable |