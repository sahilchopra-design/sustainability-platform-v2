# Avoided Emissions Portfolio
**Module ID:** `avoided-emissions-portfolio` · **Route:** `/avoided-emissions-portfolio` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Scope 4 avoided emissions tracking engine following GHG Protocol Land Sector and Removal Guidance and WBCSD Avoided Emissions Framework. Quantifies emissions displaced by portfolio clean energy, efficient transport, and land-restoration investments against a counterfactual baseline. Supports green bond and sustainability-linked instrument impact reporting.

> **Business value:** Scope 4 avoided emissions provide institutional investors with a positive impact metric that complements the carbon footprint narrative. For green bond issuers, credible avoided emissions calculations backed by GHG Protocol methodology are increasingly required by investors as part of use-of-proceeds substantiation and annual impact reporting.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAT_COLORS`, `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `CREDIBILITY_TIERS`, `CTooltip`, `HOLDINGS`, `QUARTERS`, `SDG_MAP`, `SECTORS`, `SECTOR_COLORS`, `SOLUTION_CATS`, `TABS`, `Tab1PortfolioClimateImpact`, `Tab2ClimateSolutionExposure`, `Tab3ImpactAttribution`, `Tab4InvestmentImpactReport`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SECTORS` | `['Clean Energy','Energy Efficiency','Electric Transport','Sustainable Agriculture','Waste Management','Water Solutions','Nature-Based Solutions','Digi` |
| `CREDIBILITY_TIERS` | `['High','Medium-High','Medium','Medium-Low','Low'];` |
| `fmt` | `n=>{if(Math.abs(n)>=1e9) return (n/1e9).toFixed(1)+'B';if(Math.abs(n)>=1e6) return (n/1e6).toFixed(1)+'M';if(Math.abs(n)>=1e3) return (n/1e3).toFixed(` |
| `fmtPct` | `n=>(n*100).toFixed(1)+'%';` |
| `sector` | `SECTORS[Math.floor(s * SECTORS.length)];` |
| `prefix` | `COMPANY_PREFIXES[Math.floor(s2 * COMPANY_PREFIXES.length)];` |
| `suffix` | `COMPANY_SUFFIXES[Math.floor(s3 * COMPANY_SUFFIXES.length)];` |
| `aumWeight` | `0.2 + s4 * 2.8;` |
| `emitted` | `800 + s5 * 24000;` |
| `avoidedRatio` | `0.05 + solutionRevPct * 1.8 + s7 * 0.3;` |
| `avoided` | `emitted * avoidedRatio;` |
| `net` | `emitted - avoided;` |
| `tier` | `CREDIBILITY_TIERS[Math.floor(sr(i * 47 + 71) * CREDIBILITY_TIERS.length)];` |
| `evic` | `500 + sr(i * 53 + 83) * 9500;` |
| `outstanding` | `evic * (0.01 + sr(i * 59 + 89) * 0.08);` |
| `attrFactor` | `outstanding / evic;` |
| `solutionCat` | `SOLUTION_CATS[Math.floor(sr(i * 61 + 97) * SOLUTION_CATS.length)];` |
| `qTrend` | `QUARTERS.map((q, qi) => {` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/avoided-emissions/calculate-activity` | `calculate_activity` | api/v1/routes/avoided_emissions.py |
| POST | `/api/v1/avoided-emissions/additionality-check` | `additionality_check` | api/v1/routes/avoided_emissions.py |
| POST | `/api/v1/avoided-emissions/article6-eligibility` | `article6_eligibility` | api/v1/routes/avoided_emissions.py |
| POST | `/api/v1/avoided-emissions/bvcm-check` | `bvcm_check` | api/v1/routes/avoided_emissions.py |
| POST | `/api/v1/avoided-emissions/portfolio-aggregate` | `portfolio_aggregate` | api/v1/routes/avoided_emissions.py |
| POST | `/api/v1/avoided-emissions/full-assessment` | `full_assessment` | api/v1/routes/avoided_emissions.py |
| GET | `/api/v1/avoided-emissions/ref/categories` | `ref_categories` | api/v1/routes/avoided_emissions.py |
| GET | `/api/v1/avoided-emissions/ref/baseline-factors` | `ref_baseline_factors` | api/v1/routes/avoided_emissions.py |
| GET | `/api/v1/avoided-emissions/ref/article6-criteria` | `ref_article6_criteria` | api/v1/routes/avoided_emissions.py |

### 2.3 Engine `avoided_emissions_engine` (services/avoided_emissions_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `AvoidedEmissionsEngine.calculate_avoided_per_activity` | entity_id, activity_type, baseline_factor, solution_factor, quantity, attribution_factor | Calculate avoided emissions for a single activity. |
| `AvoidedEmissionsEngine.assess_additionality` | entity_id, activity_type, activity_data | Score additionality across five criteria (0-100 each, averaged). |
| `AvoidedEmissionsEngine.check_article6_eligibility` | entity_id, activity_data | Check Paris Agreement Article 6 ITMO eligibility. |
| `AvoidedEmissionsEngine.check_bvcm_eligibility` | entity_id, activity_data | Check SBTi Beyond Value Chain Mitigation (BVCM) eligibility. |
| `AvoidedEmissionsEngine.aggregate_portfolio` | entity_id, activities, own_emissions_tco2e | Aggregate avoided emissions across all activities. |
| `AvoidedEmissionsEngine.full_assessment` | entity_id, entity_name, assessment_type, reporting_year, activities_data, own_emissions_tco2e | Comprehensive Scope 4 avoided emissions assessment. |
| `AvoidedEmissionsEngine.get_avoided_emission_categories` |  |  |
| `AvoidedEmissionsEngine.get_baseline_factors` |  |  |
| `AvoidedEmissionsEngine.get_article6_criteria` |  |  |
| `AvoidedEmissionsEngine.get_bvcm_requirements` |  |  |
| `AvoidedEmissionsEngine.get_solution_factors` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `CREDIBILITY_TIERS`, `PEERS`, `QUARTERS`, `SECTORS`, `SOLUTION_CATS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Avoided Emissions | `Baseline – Project_scenario` | WBCSD framework | Total annual emissions displaced by portfolio investments vs BAU counterfactual |
| Attribution Factor | `Investment / Total_capex` | GHG Protocol | Fraction of avoided emissions attributed to investor based on ownership/financing share |
| Additionality Score | `Multi-criteria assessment` | ICVCM CCP | Likelihood that avoided emissions would not have occurred without the investment |
- **Portfolio investment data (type, capex, location)** → Select BAU counterfactual; apply emission factors; compute avoided emissions with attribution → **Per-investment avoided emissions attributed to portfolio with additionality flags**
- **Grid emission factor databases (IEA, EPA eGRID)** → Match project location to grid emission factor for counterfactual baseline → **Counterfactual emission baselines for clean energy and efficiency investments**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/avoided-emissions/ref/article6-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['corresponding_adjustment', 'authorization', 'participation', 'sustainable_development', 'real_permanent_additional'], 'n_keys': 5}`

**GET /api/v1/avoided-emissions/ref/baseline-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['coal_electricity_kwh', 'grid_average_eu_kwh', 'grid_average_us_kwh', 'natural_gas_m3', 'diesel_litre', 'petrol_litre', 'steel_tonne_bof', 'cement_tonne_opc', 'aluminium_tonne_primary', 'beef_`

**GET /api/v1/avoided-emissions/ref/categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['enabled', 'substitution', 'facilitated'], 'n_keys': 3}`

**POST /api/v1/avoided-emissions/additionality-check** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/avoided-emissions/article6-eligibility** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** GHG Protocol counterfactual avoided emissions
**Headline formula:** `Avoided_emissions = Baseline_scenario_emissions – Project_scenario_emissions; Baseline = BAU counterfactual without investment`
**Standards:** ['GHG Protocol Scope 4 Draft', 'WBCSD Avoided Emissions Framework', 'ICVCM Core Carbon Principles']

**Engine `avoided_emissions_engine` — extracted transformation lines:**
```python
avoided_per_unit = baseline_factor - solution_factor (kgCO2e/unit)
avoided_per_unit_kgco2e = max(0.0, baseline_factor - solution_factor)
total_avoided_tco2e = round(avoided_per_unit_kgco2e * quantity * attribution_factor / 1000, 4)
itmo_potential_units = round(float(annual_avoided_raw) * attribution_factor, 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `avoided_emissions_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `avoided-emissions-hub` | engine:avoided_emissions_engine |