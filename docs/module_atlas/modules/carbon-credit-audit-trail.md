# Carbon Credit Audit Trail
**Module ID:** `carbon-credit-audit-trail` · **Route:** `/carbon-credit-audit-trail` · **Tier:** A (backend vertical) · **EP code:** EP-DQ6 · **Sprint:** DQ

## 1 · Overview
Provides immutable, hash-linked audit trail for carbon credit transactions and project lifecycle events. Implements ISO 14064-3:2019 §6.7 uncertainty records, VVB Corrective Action Request (CAR) and Clarification (CL) tracking, Forward Action Request (FAR) management, and registry retirement verification.

> **Business value:** Required for project developers subject to CDM EB or Verra VCS audit, corporate buyers verifying credit quality for VCMI/SBTi claims, and VVBs managing their portfolio of verification assignments. Provides ISO 14064-3:2019 §6.7-compliant record-keeping with tamper-evident hash chain.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `AUDIT_EVENTS`, `Badge`, `CALC_VERSIONS`, `CAR_EVENTS`, `CAR_ROOT_CAUSES`, `CHANGE_TYPES`, `EQUIPMENT`, `EVENTS_BY_DATE`, `EVENT_SEVERITIES`, `EVENT_TYPES`, `EventTypeBadge`, `HEX`, `ISO_REFS`, `KpiCard`, `METHODOLOGIES`, `PROJECT_NAMES`, `REG_REFS`, `SectionHeader`, `SeverityBadge`, `UNIQUE_PROJECTS`, `USERS`, `VERIF_EVENTS`, `VVB_NAMES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `simHash` | `(seed, len = 16) => Array.from({ length: len }, (_, i) => HEX[Math.floor(sr(seed * 31 + i * 7) * 16)]).join('');` |
| `VVB_NAMES` | `['SGS SA', 'DNV GL', 'Bureau Veritas', 'TÜV SÜD', 'RINA Services', 'Afri-Cert', 'ACM International', 'SCS Global Services'];` |
| `METHODOLOGIES` | `['VM0007 REDD+', 'VM0010 Improved Cook', 'VM0015 Methane Capture', 'AMS-I.D Solar', 'AMS-III.R REDD', 'ACM0002 Grid', 'GS-TPDDTEC', 'ACR-AF'];` |
| `projId` | ``PRJ-${String(pi + 1).padStart(3, '0')}`;` |
| `prevHash` | `simHash(pi * 1000, 8);` |
| `globalIdx` | `pi * 20 + ei;` |
| `severity` | `EVENT_SEVERITIES[Math.floor(sr(globalIdx * 7 + 2) * 4)];` |
| `vvbSigned` | `eventType === 'VERIFICATION_COMPLETED' \|\| eventType === 'ISSUANCE_APPROVED' \|\| sr(globalIdx * 11) > 0.6;` |
| `inputHash` | `simHash(globalIdx * 53 + 1, 8);` |
| `outputHash` | `simHash(globalIdx * 67 + 3, 8);` |
| `daysAgo` | `Math.floor(sr(globalIdx * 13 + 4) * 180);` |
| `erResult` | `Math.round(500 + sr(globalIdx * 19 + 5) * 45000);` |
| `calcVer` | `CALC_VERSIONS[Math.floor(sr(globalIdx * 23 + 6) * CALC_VERSIONS.length)];` |
| `user` | `USERS[Math.floor(sr(globalIdx * 29 + 7) * USERS.length)];` |
| `regRef` | `REG_REFS[Math.floor(sr(globalIdx * 31 + 8) * REG_REFS.length)];` |
| `isoRef` | `ISO_REFS[Math.floor(sr(globalIdx * 37 + 9) * ISO_REFS.length)];` |
| `tsStr` | ``${ts.getFullYear()}-${String(ts.getMonth()+1).padStart(2,'0')}-${String(ts.getDate()).padStart(2,'0')} ${String(ts.getHours()).padStart(2,'0')}:${Str` |
| `EVENTS_BY_DATE` | `[...AUDIT_EVENTS].sort((a, b) => a.daysAgo - b.daysAgo);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/carbon/methodologies` | `get_methodologies` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/emission-factors` | `get_emission_factors` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/portfolios` | `get_portfolios` | api/v1/routes/carbon.py |
| POST | `/api/v1/carbon/portfolios` | `create_portfolio` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/portfolios/{portfolio_id}` | `get_portfolio` | api/v1/routes/carbon.py |
| PUT | `/api/v1/carbon/portfolios/{portfolio_id}` | `update_portfolio` | api/v1/routes/carbon.py |
| DELETE | `/api/v1/carbon/portfolios/{portfolio_id}` | `delete_portfolio` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/portfolios/{portfolio_id}/dashboard` | `get_portfolio_dashboard` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/projects` | `get_projects` | api/v1/routes/carbon.py |
| POST | `/api/v1/carbon/projects` | `create_project` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/projects/{project_id}` | `get_project` | api/v1/routes/carbon.py |
| PUT | `/api/v1/carbon/projects/{project_id}` | `update_project` | api/v1/routes/carbon.py |
| DELETE | `/api/v1/carbon/projects/{project_id}` | `delete_project` | api/v1/routes/carbon.py |
| POST | `/api/v1/carbon/projects/from-calculation` | `create_project_from_calculation` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/portfolios/{portfolio_id}/scenarios` | `get_scenarios` | api/v1/routes/carbon.py |

### 2.3 Engine `carbon_calculator` (services/carbon_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `CarbonCalculationEngine.calculate_project_risk` | project_type, country_code, quality_rating, custom_risks | Calculate risk factors for a single project. |
| `CarbonCalculationEngine.calculate_risk_adjusted_credits` | annual_credits, risk_breakdown | Calculate risk-adjusted credit amount. |
| `CarbonCalculationEngine.calculate_npv` | annual_credits, price_per_credit, years, discount_rate, price_growth_rate | Calculate Net Present Value of carbon credits over time. |
| `CarbonCalculationEngine.calculate_quality_score` | additionality_score, permanence_score, co_benefits_score, verification_status | Calculate overall quality score and rating for a project. |
| `CarbonCalculationEngine.generate_yearly_projections` | total_annual_credits, risk_adjusted_credits, years, optimistic_factor, pessimistic_factor | Generate yearly credit projections. |
| `CarbonCalculationEngine.run_monte_carlo` | projects, scenario, n_runs, random_seed | Run Monte Carlo simulation for portfolio. |
| `CarbonCalculationEngine.calculate_portfolio` | projects, scenario, run_monte_carlo | Calculate portfolio-level metrics. |

### 2.3 Engine `methodology_engine` (services/methodology_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ACM0001_LandfillGas` | inputs | ACM0001: Flaring or Use of Landfill Gas - Waste Sector |
| `ACM0002_RenewableEnergy` | inputs | ACM0002: Grid-Connected Renewable Energy - Energy Sector |
| `ACM0003_BiomassSubstitution` | inputs | ACM0003: Partial Substitution of Fossil Fuels with Biomass - Energy Sector |
| `ACM0005_WasteHeatRecovery` | inputs | ACM0005: Grid Electricity from Waste Heat Recovery - Energy/Industrial Sector |
| `ACM0006_BiomassEnergy` | inputs | ACM0006: Electricity and Heat from Biomass - Energy Sector |
| `ACM0007_FuelSwitch` | inputs | ACM0007: Analysis of Least Cost Fuel Option - Energy Sector |
| `ACM0008_CoalMineMethane` | inputs | ACM0008: Abatement of Methane from Coal Mines - Mining Sector |
| `ACM0009_CoalToGas` | inputs | ACM0009: Fuel Switch from Coal to Gas - Energy Sector |
| `ACM0010_ManureMethane` | inputs | ACM0010: GHG Emission Reductions from Manure Management - Agriculture Sector |
| `ACM0012_WasteHeatPower` | inputs | ACM0012: Waste Heat Recovery for Power Generation - Industrial Sector |
| `ACM0014_CementBlending` | inputs | ACM0014: Cement Blending - Industrial Sector |
| `ACM0022_Composting` | inputs | ACM0022: Alternative Waste Treatment (Composting) - Waste Sector |
| `ACM0023_LowEmissionVehicles` | inputs | ACM0023: Introduction of Low-Emission Vehicles - Transport Sector |
| `AMS_III_C_LowEmissionVehicles` | inputs | AMS-III.C: Emission Reductions by Low-Emission Vehicles - Transport Sector |
| `VM0032_CoalMineMethane` | inputs | VM0032: Coal Mine Methane (VCS) - Mining Sector |
| `AMS_I_A_RenewableElectricity` | inputs | AMS-I.A: Electricity from Renewable Sources (Small-scale < 15 MW) |
| `AMS_I_C_RenewableThermal` | inputs | AMS-I.C: Thermal Energy from Renewable Sources |
| `AMS_I_D_GridRenewable` | inputs | AMS-I.D: Grid Connected Renewable Electricity Generation |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`, `real-db`

**Database tables:** `Manure` *(shared)*, `Wind` *(shared)*, `database` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `projects` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `AUDIT_EVENTS`, `CALC_VERSIONS`, `CAR_ROOT_CAUSES`, `CHANGE_TYPES`, `EVENTS_BY_DATE`, `EVENT_SEVERITIES`, `EVENT_TYPES`, `ISO_REFS`, `METHODOLOGIES`, `PROJECT_NAMES`, `REG_REFS`, `TABS`, `USERS`, `VVB_NAMES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Audit Trail Completeness | — | ISO 14064-3:2019 §6.7.1 | ISO 14064-3 requires complete audit trail from data collection to verified statement — no gaps permitted |
| VVB CAR Resolution Rate | — | CDM VVM v2.0 Section 5.3 | All CARs must be resolved before VVB can issue positive verification statement — non-resolution = rejection |
| Registry Retirement Verification | — | Verra, Gold Standard, ACR Registry Rules | Retired credits have unique serial numbers on public registries — prevents double counting |
- **Project event log (registrations, monitoring reports, verifications)** → Hash-linked audit trail → **Complete tamper-evident event history from project inception**
- **VVB audit finding database (CAR/CL/FAR) with resolutions** → Finding tracking → **Open vs resolved findings with closure evidence**
- **Registry serial number data (Verra, Gold Standard, ACR)** → Retirement verification → **Credit retirement status and serial number traceability**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/carbon/calculations/{calculation_id}** — status `failed`, provenance ['db-empty'], source tables: `carbon_calculation`
Output: `None`

**GET /api/v1/carbon/data/grid-emission-factor** — status `failed`, provenance ['db-empty'], source tables: `carbon_emission_factor`
Output: `None`

**GET /api/v1/carbon/emission-factors** — status `passed`, provenance ['real-db'], source tables: `carbon_emission_factor`
Output: `{'type': 'array', 'len': 8, 'item0_keys': None}`

**GET /api/v1/carbon/methodologies** — status `passed`, provenance ['real-db'], source tables: `carbon_methodology`
Output: `{'type': 'array', 'len': 6, 'item0_keys': None}`

**GET /api/v1/carbon/methodology-details/{methodology_code}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Audit Trail Hash Chain
**Headline formula:** `Hash_n = SHA256(EventData_n + Hash_{n-1} + Timestamp_n); AuditIntegrity = all Hash_n match recomputed values; ISO14064_3_record = {Event, Evidence, Uncertainty, VVBopinion, Timestamp, Hash}`
**Standards:** ['ISO 14064-3:2019 §6.7 — Record-Keeping Requirements', 'Verra VCS Standard v4.0 — Validation/Verification Requirements', 'CDM Validation and Verification Standard v2.0', 'ICVCM CCP Principle 3 — Transparent and Robust Independent Third-Party Validation and Verification']

**Engine `carbon_calculator` — extracted transformation lines:**
```python
quality_multiplier = 1.0 + (3.0 - quality_score) * 0.05  # Higher quality = lower risk
total_risk = permanence_risk + delivery_risk + regulatory_risk + market_risk
risk_discount = total_risk_pct / 100
future_price = price_per_credit * ((1 + price_growth_rate) ** year)
annual_value = annual_credits * future_price
discounted_value = annual_value / ((1 + discount_rate) ** year)
score = (additionality * 0.4 + permanence * 0.35 + co_benefits * 0.25) + verification_bonus
year = current_year + i
time_factor = 1.0 + (i * 0.02)  # Slight increase over time
base = total_annual_credits * time_factor
optimistic = base * optimistic_factor
pessimistic = base * pessimistic_factor
risk_adj = risk_adjusted_credits * time_factor
perm_adj = sampler.normal(1 - permanence_risk, permanence_risk * 0.5)
```

**Engine `methodology_engine` — extracted transformation lines:**
```python
baseline_methane = methane_generation_potential * waste_quantity
baseline_emissions = baseline_methane * methane_gwp
methane_captured = baseline_methane * capture_efficiency
project_emissions = (methane_captured * (1 - destruction_efficiency) * methane_gwp) + \
emission_reductions = baseline_emissions - project_emissions - leakage
annual_generation = installed_capacity_mw * capacity_factor * 8760
combined_margin_ef = (operating_margin_weight * grid_emission_factor) + \
baseline_emissions = annual_generation * combined_margin_ef
gross_emission_reductions = baseline_emissions - project_emissions - leakage
uncertainty_deduction = gross_emission_reductions * uncertainty_factor
net_emission_reductions = gross_emission_reductions - uncertainty_deduction
biomass_emissions = biomass_quantity * biomass_ncv * biomass_emission_factor / 1000
emission_reductions = baseline_emissions - project_emissions
electricity_generated = waste_heat_available * conversion_efficiency
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **63** other module(s).
**Shared engines (edits propagate!):** `carbon_calculator` (used by 19 modules), `methodology_engine` (used by 19 modules)

| Connected module | Shared via |
|---|---|
| `carbon-aware-allocation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-capture-finance` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-wallet` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-adjusted-valuation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-storage-geology` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-budget` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-reduction-projects` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-footprint-intelligence` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-integrity-mrv-analytics` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-removal-markets` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |