# Avoided Emissions Hub
**Module ID:** `avoided-emissions-hub` · **Route:** `/avoided-emissions-hub` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Scope 4 / avoided emissions quantification methodology. Covers enabled emissions reductions from sold products vs reference scenarios, PACT methodology alignment, and positive impact accounting.

> **Business value:** Avoided emissions are central to the value proposition of clean tech companies. They are also controversial due to double-counting and methodology inconsistency. This module applies the emerging PACT framework to ensure credible, auditable Scope 4 claims that withstand investor scrutiny.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOARD_SECTIONS`, `COMPANY_NAMES`, `CRED_METHODS`, `INITIAL_ALERTS`, `KPI_DEFS`, `PERIODS`, `QUARTERS`, `SECTORS`, `SECTOR_COLORS`, `SUB_MODULES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `genCompanies` | `()=>COMPANY_NAMES.slice(0,150).map((name,i)=>{` |
| `sector` | `SECTORS[Math.floor(s*SECTORS.length)];` |
| `emitted` | `Math.round(50+s2*500);` |
| `avoided` | `Math.round(20+s3*800);` |
| `net` | `avoided-emitted;` |
| `credScore` | `Math.round(40+s4*55);` |
| `handprint` | `Math.round(10+sr(i*19+2)*90);` |
| `enablement` | `Math.round(5+sr(i*23+4)*85);` |
| `solutionRev` | `Math.round(10+sr(i*29+6)*80);` |
| `taxonomyPct` | `Math.round(5+sr(i*31+8)*70);` |
| `purePlay` | `sr(i*37+9)>0.55;` |
| `dqScore` | `Math.round(50+sr(i*41+10)*45);` |
| `totalAvoided` | `companies.reduce((a,c)=>a+c.avoided,0)*pMul/1000;` |
| `totalEmitted` | `companies.reduce((a,c)=>a+c.emitted,0)*pMul/1000;` |
| `avoidedRatio` | `totalEmitted>0?totalAvoided/totalEmitted:0;` |
| `avgSolRev` | `companies.reduce((a,c)=>a+c.solutionRev,0)/_n;` |
| `netImpact` | `totalAvoided-totalEmitted;` |
| `avgHandprint` | `companies.reduce((a,c)=>a+c.handprint,0)/_n;` |

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
**Frontend seed datasets:** `BOARD_SECTIONS`, `COMPANY_NAMES`, `CRED_METHODS`, `INITIAL_ALERTS`, `KPI_DEFS`, `PERIODS`, `QUARTERS`, `SECTORS`, `SECTOR_COLORS`, `SUB_MODULES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Product Categories | — | Scope 4 use cases | Most material Scope 4 claims |
| Reference Comparison | — | Methodology | Baseline against which reduction is measured |
| Double-Count Risk | — | Methodology challenge | Two companies claiming same avoided emission |
- **Product lifecycle data** → LCA comparison vs reference → **Avoided emission per unit**
- **Sales volume data** → Scaling calculation → **Total portfolio avoided emissions**
- **Supply chain claims** → Double-count check → **Net avoided emissions**

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
**Methodology:** PACT-aligned avoided emissions
**Headline formula:** `AvoidedEmissions = ReferenceScenario_emissions - Product_emissions; Scope4 = Net(S1+S2+S3) - AvoidedEmissions`
**Standards:** ['WBCSD PACT Framework', 'GHG Protocol Scope 4 Guidance (draft)', 'C40 Cities']

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
| `avoided-emissions-portfolio` | engine:avoided_emissions_engine |