# Carbon Credit Audit Trail
**Module ID:** `carbon-credit-audit-trail` · **Route:** `/carbon-credit-audit-trail` · **Tier:** A (backend vertical) · **EP code:** EP-DQ6 · **Sprint:** DQ

## 1 · Overview
Provides immutable, hash-linked audit trail for carbon credit transactions and project lifecycle events. Implements ISO 14064-3:2019 §6.7 uncertainty records, VVB Corrective Action Request (CAR) and Clarification (CL) tracking, Forward Action Request (FAR) management, and registry retirement verification.

> **Business value:** Required for project developers subject to CDM EB or Verra VCS audit, corporate buyers verifying credit quality for VCMI/SBTi claims, and VVBs managing their portfolio of verification assignments. Provides ISO 14064-3:2019 §6.7-compliant record-keeping with tamper-evident hash chain.

**How an analyst works this module:**
- Record project lifecycle events in audit trail
- Track VVB CAR/CL/FAR status through resolution
- Verify hash chain integrity for tampering detection
- Monitor registry retirement and serial numbers
- Generate ISO 14064-3 §6.7 compliant audit documentation

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `AUDIT_EVENTS`, `Badge`, `CALC_VERSIONS`, `CAR_EVENTS`, `CAR_ROOT_CAUSES`, `CHANGE_TYPES`, `EQUIPMENT`, `EVENTS_BY_DATE`, `EVENT_SEVERITIES`, `EVENT_TYPES`, `EventTypeBadge`, `HEX`, `ISO_REFS`, `KpiCard`, `METHODOLOGIES`, `PROJECT_NAMES`, `REG_REFS`, `SHA256_K`, `SectionHeader`, `SeverityBadge`, `UNIQUE_PROJECTS`, `USERS`, `VERIF_EVENTS`, `VVB_NAMES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `bitLen` | `bytes.length * 8;` |
| `temp1` | `(h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;` |
| `simHash` | `(seed, len = 16) => Array.from({ length: len }, (_, i) => HEX[Math.floor(sr(seed * 31 + i * 7) * 16)]).join('');` |
| `VVB_NAMES` | `['SGS SA', 'DNV GL', 'Bureau Veritas', 'TÜV SÜD', 'RINA Services', 'Afri-Cert', 'ACM International', 'SCS Global Services'];` |
| `METHODOLOGIES` | `['VM0007 REDD+', 'VM0010 Improved Cook', 'VM0015 Methane Capture', 'AMS-I.D Solar', 'AMS-III.R REDD', 'ACM0002 Grid', 'GS-TPDDTEC', 'ACR-AF'];` |
| `projId` | ``PRJ-${String(pi + 1).padStart(3, '0')}`;` |
| `globalIdx` | `pi * 20 + ei;` |
| `severity` | `EVENT_SEVERITIES[Math.floor(sr(globalIdx * 7 + 2) * 4)];` |
| `vvbSigned` | `eventType === 'VERIFICATION_COMPLETED' \|\| eventType === 'ISSUANCE_APPROVED' \|\| sr(globalIdx * 11) > 0.6;` |
| `daysAgo` | `Math.floor(sr(globalIdx * 13 + 4) * 180);` |
| `erResult` | `Math.round(500 + sr(globalIdx * 19 + 5) * 45000);` |
| `calcVer` | `CALC_VERSIONS[Math.floor(sr(globalIdx * 23 + 6) * CALC_VERSIONS.length)];` |
| `user` | `USERS[Math.floor(sr(globalIdx * 29 + 7) * USERS.length)];` |
| `regRef` | `REG_REFS[Math.floor(sr(globalIdx * 31 + 8) * REG_REFS.length)];` |
| `isoRef` | `ISO_REFS[Math.floor(sr(globalIdx * 37 + 9) * ISO_REFS.length)];` |
| `tsStr` | ``${ts.getFullYear()}-${String(ts.getMonth()+1).padStart(2,'0')}-${String(ts.getDate()).padStart(2,'0')} ${String(ts.getHours()).padStart(2,'0')}:${String(ts.getMinutes()).padStart(2,'0')} UTC`;` |
| `recordHash` | `sha256Hex(inputHash + outputHash + prevHash);` |
| `evs` | `[...byProject[projId]].sort((a, b) => a.seq - b.seq);` |
| `expRecordHash` | `sha256Hex(expInputHash + expOutputHash + expectedPrevHash);` |
| `EVENTS_BY_DATE` | `[...AUDIT_EVENTS].sort((a, b) => a.daysAgo - b.daysAgo);` |
| `UNIQUE_PROJECTS` | `PROJECT_NAMES.map((name, i) => ({` |
| `calcPageEvents` | `useMemo(() => { const start = calcPage * PAGE_SIZE;` |
| `totalCalcPages` | `Math.ceil(filteredEvents.length / PAGE_SIZE);` |
| `cmdKpis` | `useMemo(() => { const openCARs    = AUDIT_EVENTS.filter(e => e.eventType === 'CAR_RAISED').length - AUDIT_EVENTS.filter(e => e.eventType === 'CAR_RESOLVED').length;` |
| `verifCoverage` | `Math.round(VERIF_EVENTS.length / 30 * 100);` |
| `avgRes` | `Math.round(AUDIT_EVENTS.filter(e => e.eventType === 'CAR_RESOLVED').reduce((s, e) => s + Math.floor(sr(e.projectId.charCodeAt(4) * 7) * 14 + 3), 0) / Math.max(1, AUDIT_EVENTS.filter(e => e.eventType === 'CAR_RESOLVED').l` |
| `chainIntegrity` | `useMemo(() => verifyChain(AUDIT_EVENTS), []);  // ── Tamper-evidence self-test (interactive) ───────────────────────────── // Clones project PRJ-001's chain into local state so a reviewer can tamper // one record directly in the UI and watch SHA-256 verification detect the // break and cascade it forward — the core value proposition of a ` |
| `demoIntegrity` | `useMemo(() => verifyChain(demoEvents), [demoEvents]);  const tamperRecord = (seq) => { setDemoEvents(prev => prev.map(e => ( e.seq === seq ? { ...e, erResult: e.erResult + 999, description: e.description + ' [TAMPERED POST-HOC]' } : e )));` |
| `carsRaised` | `Math.floor(sr(idx * 37 + 7) * 5);` |
| `carsClosed` | `carsRaised > 0 ? Math.max(0, carsRaised - Math.floor(sr(idx * 41) * 2)) : 0;` |
| `cls` | `Math.floor(sr(idx * 43 + 9) * 3);` |
| `fars` | `Math.floor(sr(idx * 47 + 11) * 4);` |
| `opinion` | `sr(idx * 53) > 0.85 ? 'Qualified Positive' : 'Positive';` |
| `daysOpen` | `isResolved ? Math.round(3 + sr(idx * 7) * 12) : Math.round(5 + sr(idx * 11) * 60);` |
| `changeType` | `CHANGE_TYPES[Math.floor(sr(i * 19 + 3) * CHANGE_TYPES.length)];` |
| `status` | `sr(i * 23 + 7) > 0.2 ? 'Approved' : 'Pending';` |
| `recalc` | `changeType === 'Major' \|\| (changeType === 'Standard' && sr(i * 29) > 0.6);` |
| `erDiff` | `recalc ? Math.round((sr(i * 31) - 0.5) * 2000) : 0;` |
| `erImpact` | `recalcReq ? Math.round((sr(vi * 37) - 0.5) * 3000) : 0;` |
| `daysRem` | `Math.round(1 + sr(idx * 43 + 17) * 180);` |

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
| POST | `/api/v1/carbon/portfolios/{portfolio_id}/scenarios` | `create_scenario` | api/v1/routes/carbon.py |
| DELETE | `/api/v1/carbon/portfolios/{portfolio_id}/scenarios/{scenario_id}` | `delete_scenario` | api/v1/routes/carbon.py |
| POST | `/api/v1/carbon/calculate` | `run_calculation` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/calculations/{calculation_id}` | `get_calculation` | api/v1/routes/carbon.py |
| POST | `/api/v1/carbon/reports/generate` | `generate_report` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/reports/{report_id}/download` | `download_report` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/methodology-list` | `list_all_methodologies` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/methodology-list/{sector}` | `list_methodologies_by_sector` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/methodology-details/{methodology_code}` | `get_methodology_info` | api/v1/routes/carbon.py |
| POST | `/api/v1/carbon/calculate/methodology` | `calculate_methodology` | api/v1/routes/carbon.py |
| POST | `/api/v1/carbon/calculate/batch` | `calculate_batch` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/data/grid-emission-factor` | `get_grid_emission_factor` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/methodology-inputs/{methodology_code}` | `get_methodology_inputs` | api/v1/routes/carbon.py |

### 2.3 Engine `carbon_calculator` (services/carbon_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `CarbonCalculationEngine.calculate_project_risk` | project_type, country_code, quality_rating, custom_risks | Calculate risk factors for a single project. |
| `CarbonCalculationEngine.calculate_risk_adjusted_credits` | annual_credits, risk_breakdown | Calculate risk-adjusted credit amount. |
| `CarbonCalculationEngine.calculate_npv` | annual_credits, price_per_credit, years, discount_rate, price_growth_rate | Calculate Net Present Value of carbon credits over time. |
| `CarbonCalculationEngine.calculate_quality_score` | additionality_score, permanence_score, co_benefits_score, verification_status | Calculate overall quality score and rating for a project. |
| `CarbonCalculationEngine.generate_yearly_projections` | total_annual_credits, risk_adjusted_credits, years, optimistic_factor, pessimistic_factor | Generate yearly credit projections. |
| `CarbonCalculationEngine.run_monte_carlo` | projects, scenario, n_runs, random_seed | Run Monte Carlo simulation for portfolio. This is a GENUINE calibrated Monte Carlo: the risk and price adjustments are sampled from normal distributions whose parameters (permanence/delivery risk and price volatility) are supplied by the caller via ``scenario``. The returned figures are distributional statistics of that simulation, not fabricated point estimates. ``random_seed`` (optional, backwar |
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
| `AMS_II_D_BuildingEfficiency` | inputs | AMS-II.D: Energy Efficiency in Buildings |
| `AMS_II_E_TransportEfficiency` | inputs | AMS-II.E: Energy Efficiency in Transport |
| `AMS_II_G_IndustrialEfficiency` | inputs | AMS-II.G: Energy Efficiency in Industrial Processes |
| `AMS_III_AU_AgriculturalMethane` | inputs | AMS-III.AU: Methane Recovery in Agricultural Activities |
| `AMS_III_B_WastewaterMethane` | inputs | AMS-III.B: Methane Recovery from Wastewater |
| `AMS_III_C_WasteComposting` | inputs | AMS-III.C: Emission Reductions from Waste Composting |
| `AMS_III_D_SolidWasteMethane` | inputs | AMS-III.D: Methane Recovery from Solid Waste Disposal |
| `AM0012_NitricAcidN2O` | inputs | AM0012: N2O Abatement from Nitric Acid Production |
| `AM0036_SF6Reduction` | inputs | AM0036: SF6 Emission Reductions in Electrical Equipment |
| `AR_ACM0003_AfforestationReforestation` | inputs | AR-ACM0003: Large-scale Afforestation/Reforestation |
| `VM0008_WastewaterMethane` | inputs | VM0008: Methane Destruction at Wastewater Treatment Plants |
| `VM0022_AgriculturalN2O` | inputs | VM0022: N2O Emissions Reductions in Agricultural Crop Production |
| `VM0033_BlueCarbon` | inputs | VM0033: Tidal Wetland and Seagrass Restoration |
| `VM0042_AgriculturalLandManagement` | inputs | VM0042: Improved Agricultural Land Management |
| `VM0044_BiocharSoil` | inputs | VM0044: Biochar Utilization in Soil |
| `VM0047_ARR` | inputs | VM0047: Afforestation, Reforestation and Revegetation |
| `VM0048_REDD` | inputs | VM0048: REDD+ Methodology |
| `TPDDTEC_Cookstoves` | inputs | TPDDTEC v3.0: Clean Cookstoves - Household Sector |

**Engine `methodology_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `METHODOLOGY_CALCULATORS` | `{'ACM0001': ACM0001_LandfillGas, 'ACM0002': ACM0002_RenewableEnergy, 'ACM0003': ACM0003_BiomassSubstitution, 'ACM0005': ACM0005_WasteHeatRecovery, 'ACM0006': ACM0006_BiomassEnergy, 'ACM0007': ACM0007_FuelSwitch, 'ACM0008': ACM0008_CoalMineMethane, 'ACM0009': ACM0009_CoalToGas, 'ACM0010': ACM0010_Man` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`, `real-db`

**Database tables:** `Manure` *(shared)*, `Wind` *(shared)*, `database` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `projects` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `AUDIT_EVENTS`, `CALC_VERSIONS`, `CAR_ROOT_CAUSES`, `CHANGE_TYPES`, `EVENTS_BY_DATE`, `EVENT_SEVERITIES`, `EVENT_TYPES`, `ISO_REFS`, `METHODOLOGIES`, `PROJECT_NAMES`, `REG_REFS`, `SHA256_K`, `TABS`, `USERS`, `VVB_NAMES`

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

**GET /api/v1/carbon/methodology-inputs/{methodology_code}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/carbon/methodology-list** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['methodologies', 'total_count', 'sectors'], 'n_keys': 3}`

**GET /api/v1/carbon/methodology-list/{sector}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector', 'methodologies', 'message'], 'n_keys': 3}`

## 5 · Intermediate Transformation Logic
**Methodology:** Audit Trail Hash Chain
**Headline formula:** `Hash_n = SHA256(EventData_n + Hash_{n-1} + Timestamp_n); AuditIntegrity = all Hash_n match recomputed values; ISO14064_3_record = {Event, Evidence, Uncertainty, VVBopinion, Timestamp, Hash}`

SHA-256 hash chain ensures tamper-evidence — any modification breaks the chain; VVB audit findings classified as CAR (must resolve), CL (must clarify), or FAR (future monitoring); ISO 14064-3 requires complete chain of evidence

**Standards:** ['ISO 14064-3:2019 §6.7 — Record-Keeping Requirements', 'Verra VCS Standard v4.0 — Validation/Verification Requirements', 'CDM Validation and Verification Standard v2.0', 'ICVCM CCP Principle 3 — Transparent and Robust Independent Third-Party Validation and Verification']
**Reference documents:** ISO 14064-3:2019 Section 6.7 — Record Keeping and Retention of Evidence; Verra VCS Validation and Verification Requirements v4.0; CDM Validation and Verification Manual v2.0; ICVCM Core Carbon Principles — Principle 3 (Transparent Validation/Verification)

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
del_adj = sampler.normal(1 - delivery_risk, delivery_risk * 0.5)
simulated_credits = total_credits * perm_adj * del_adj
simulated_value = simulated_credits * base_price * price_adj
avg_quality = total_quality_weighted / total_credits
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
baseline_emissions = electricity_generated * grid_emission_factor
auxiliary_emissions = auxiliary_power * grid_emission_factor
emission_reductions = baseline_emissions - project_emissions
electricity_generation = biomass_quantity * electricity_yield
heat_generation = biomass_quantity * heat_yield
baseline_emissions_electricity = electricity_generation * grid_emission_factor
baseline_emissions_heat = heat_generation * heat_emission_factor
baseline_emissions = baseline_emissions_electricity + baseline_emissions_heat
project_emissions = biomass_quantity * biomass_ncv * biomass_ch4_ef * methane_gwp
emission_reductions = baseline_emissions - project_emissions
baseline_emissions = baseline_fuel_consumption * baseline_ncv * baseline_emission_factor / 1000
project_emissions = project_fuel_consumption * project_ncv * project_emission_factor / 1000
emission_reductions = baseline_emissions - project_emissions
total_methane = (ventilation_air_methane + captured_methane) * methane_density
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **67** other module(s).
**Shared engines (edits propagate!):** `carbon_calculator` (used by 21 modules), `methodology_engine` (used by 21 modules)

| Connected module | Shared via |
|---|---|
| `carbon-market-intelligence` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-integrity-mrv-analytics` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-institutions-taxonomy` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-footprint-intelligence` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-reduction-projects` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-aware-allocation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-forward-curve` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-project-lifecycle` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-removal-markets` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-adjusted-valuation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch.** The guide's core formula is `Hash_n = SHA256(EventData_n + Hash_{n-1} +
> Timestamp_n)` with real tamper-evidence ("any modification breaks the chain"). **The code does not
> compute SHA-256 or any cryptographic hash.** It uses `simHash`, explicitly commented
> *"Deterministic hash simulation (hex chars from sr())"* — a PRNG that emits random hex characters:
> `simHash(seed,len) = [HEX[floor(sr(seed·31 + i·7)·16)] for i in 0..len]`. There is no chaining of one
> event's hash into the next as a hash *of the previous hash* — `prevHash` is seeded independently, so
> the "chain" cannot detect tampering. The CAR/CL/FAR taxonomy, ISO 14064-3 references, and VVB workflow
> are real terminology, but the integrity mechanism is a visual mock. Sections below document the code.

### 7.1 What the module computes

A synthetic audit-event ledger: **30 projects × 20 events = 600 events**, each carrying a simulated event
hash, input/output hashes, severity, user, VVB, regulatory & ISO references, and an emission-reduction
result. Command-centre KPIs are counts and simple aggregates over the event list:

```js
openCARs      = count(CAR_RAISED) − count(CAR_RESOLVED)
verifCoverage = round(VERIF_EVENTS.length / 30 × 100)          // % of 30 projects verified
avgRes        = mean over CAR_RESOLVED of  (3 + sr·14) days     // synthetic resolution days
```

`EVENTS_BY_DATE` sorts by `daysAgo`; `UNIQUE_PROJECTS` rolls events up per project with CAR/CL/FAR
counts and a verification opinion.

### 7.2 Parameterisation

All event fields are `sr()`-seeded (provenance: **synthetic demo data**), drawn from real reference lists:

| List | Values (real terminology) |
|---|---|
| EVENT_TYPES | CALCULATION_CREATED, DATA_SUBMITTED, VALIDATION_STARTED, CAR_RAISED, CAR_RESOLVED, VERIFICATION_COMPLETED, ISSUANCE_APPROVED, METHODOLOGY_UPDATE, PARAMETER_AMENDED, REPORT_GENERATED |
| VVB_NAMES | SGS, DNV, Bureau Veritas, TÜV SÜD, RINA, SCS Global … (real accredited VVBs) |
| METHODOLOGIES | VM0007 REDD+, VM0015 Methane Capture, ACM0002 Grid, GS-TPDDTEC … (real Verra/CDM/GS codes) |
| REG_REFS | CDM Standard v8 §9, ISO 14064-3:2019 §6.7, VCS Standard v4 §4.2, CORSIA SARPs §3.6.2 … |
| EVENT_SEVERITIES | INFO, NOTICE, WARNING, CRITICAL |

Per-event synthetic quantities: `daysAgo = floor(sr·180)`, `erResult = 500 + sr·45000` tCO₂e,
`calcVer` from a real semver list, opinion = `sr>0.8 ? Qualified Positive : Positive`, CAR/CL/FAR counts
from `floor(sr·5)` etc. The reference *lists* are authentic; the *assignment* of them to events is random.

### 7.3 Calculation walkthrough

The nested loop builds 600 events; `prevHash` is initialised per project via `simHash(pi·1000, 8)` and a
new `simHash` is generated per event — but because each hash is an independent PRNG output rather than a
function of the previous hash + event payload, the ledger is a *display* of a chain, not a verifiable one.
KPIs then filter/count the events (open CARs, verification coverage, average resolution time). CAR/CL/FAR
management and audit-readiness panels are further seeded roll-ups.

### 7.4 Worked example (command-centre KPIs)

Suppose across 600 events there are 48 `CAR_RAISED` and 41 `CAR_RESOLVED`:
- `openCARs = 48 − 41 = 7` outstanding corrective actions.
- If 26 of 30 projects have at least one `VERIFICATION_COMPLETED`: `verifCoverage = round(26/30×100) =
  87%`.
- `avgRes` over the 41 resolved CARs, each `3 + sr·14` days, averages ≈ 10 days.

These are structurally correct KPIs — the numbers are simply generated rather than measured, and the
underlying "hash integrity" claim behind them is not enforced.

### 7.5 Data provenance & limitations

- **All 600 events are synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`); the VVB/methodology/ISO reference
  lists are real, their assignment is random.
- **The hash chain is a simulation, not cryptography** — no SHA-256, no genuine chaining, so the module
  cannot actually detect tampering despite the guide's claim.
- No serial-number registry integration, no evidence-file linkage — retirement "verification" is display
  only.

**Framework alignment:** ISO 14064-3:2019 §6.7 — record-keeping/evidence-chain requirements the ledger
mimics · Verra VCS v4 / CDM V&V Standard — the CAR (Corrective Action Request, must resolve before
positive opinion), CL (Clarification), and FAR (Forward Action Request, future-monitoring) taxonomy, all
correctly named · ICVCM CCP Principle 3 — independent third-party validation/verification, reflected in
the VVB opinion events. ICVCM's CCPs are assessed by the ICVCM at program and methodology-category level
against 10 Core Carbon Principles; Principle 3 specifically requires accredited VVB validation — the module
represents that verification event but does not score it. See §8 for a real integrity model.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's SHA-256 hash chain is simulated;
this specifies the real tamper-evident ledger.

### 8.1 Purpose & scope
Provide a verifiable, append-only audit trail for carbon-credit project lifecycle events (data → MRV →
CAR/CL/FAR → verification → issuance → retirement) such that any post-hoc modification is cryptographically
detectable, meeting ISO 14064-3 §6.7 record-keeping and supporting VVB and buyer due diligence.

### 8.2 Conceptual approach
A Merkle/hash-linked append-only log (the design behind Git, certificate-transparency logs, and permissioned
carbon registries such as Verra's and the Gold Standard Impact Registry). Each event commits to the prior
state, so the head hash certifies the entire history. Optionally anchored to a public chain for third-party
notarisation, per emerging digital-MRV practice (IETA/World Bank CAD Trust).

### 8.3 Mathematical specification

```
leaf_n     = SHA256( serialize(EventData_n) )
Hash_n     = SHA256( Hash_{n-1} ‖ leaf_n ‖ Timestamp_n ‖ Actor_n )      Hash_0 = SHA256(genesis)
head       = Hash_N
verify(k)  : recompute Hash_1..Hash_N; integrity ⇔ recomputed head == stored head
proof(n)   : Merkle inclusion path from leaf_n to a signed tree root (log size auditable)
sign       : VVB signs head with ECDSA/Ed25519 at each verification milestone
```

Tamper detection: altering `EventData_j` changes `leaf_j`, hence every `Hash_{≥j}` and the head — the
recomputation in `verify` fails.

| Parameter | Symbol | Source |
|---|---|---|
| Hash function | SHA-256 | FIPS 180-4 |
| Signature scheme | Ed25519 | RFC 8032 |
| Event schema | EventData | ISO 14064-3 §6.7 evidence fields |
| Genesis | Hash_0 | project registration record |

### 8.4 Data requirements
Per event: canonical serialised payload (event type, project id, actor, evidence-file digests, ER result,
methodology, reg/ISO reference, UTC timestamp). Existing platform fields already cover the payload schema;
missing: a real crypto library (SHA-256/Ed25519), evidence-file hashing, and an append-only store.

### 8.5 Validation & benchmarking plan
Property tests: any single-byte mutation of any historical event must flip the head hash and fail `verify`.
Merkle inclusion proofs verified independently. Reconcile serial numbers against Verra/Gold Standard public
registries. Benchmark against CAD Trust's data model for interoperability.

### 8.6 Limitations & model risk
A hash chain proves *integrity*, not *correctness* — garbage-in still hashes cleanly, so it must sit atop
VVB attestation, not replace it. Key management for VVB signatures is the principal operational risk;
conservative fallback anchors periodic head hashes to a public ledger so integrity survives internal key
compromise.

## 9 · Future Evolution

### 9.1 Evolution A — Persist the genuine hash chain over real project lifecycle events (analytics ladder: rung 1 → 3)

**What.** Unlike the platform's other audit modules, this one implements a **real SHA-256 hash chain in code** (`sha256Hex`, `verifyChain`, `recordHash = sha256(inputHash + outputHash + prevHash)`) with a working interactive tamper-test — a reviewer can mutate a record in the UI and watch verification detect the break and cascade forward, which is the actual value proposition. It also correctly models VVB workflows (CAR/CL/FAR tracking, ISO 14064-3 §6.7 uncertainty records). The gap: the event data is seeded (`simHash`, `sr()`-driven event types, ER results, users) and nothing persists — the hash chain protects synthetic data. Evolution A makes it a real audit trail.

**How.** (1) Persist events server-side in an append-only `carbon_credit_events` table, computing and storing the `recordHash` chain on write (the JS SHA-256 logic ports directly, or moves to a backend hash) — so the tamper-evidence claim covers real records. (2) Feed real project lifecycle events: issuance, verification, CAR/CL/FAR from the registered `carbon.py` project routes (`create_project`, verification workflows) rather than seeded generators. (3) The ISO 14064-3 §6.7 uncertainty records and VVB CAR/CL/FAR tracking wire to actual verification data. (4) Rung 3: a `GET /verify/{project}` endpoint that re-verifies the stored chain and returns the ISO-compliant audit documentation, making the "generate compliant documentation" claim real. Distinct from the generic `audit-trail` modules by its carbon-credit-lifecycle and VVB specialisation.

**Prerequisites.** An append-only events table + migration; real project/verification data flowing from `carbon.py`; retire the seeded event generators (the SHA-256 machinery stays — it's genuine). **Acceptance:** a stored event cannot be mutated without breaking chain verification; events derive from real project lifecycle actions; the ISO 14064-3 §6.7 documentation export re-verifies the chain.

### 9.2 Evolution B — Credit-verification audit copilot (LLM tier 2)

**What.** Project developers, corporate buyers (VCMI/SBTi claims), and VVBs ask "verify the audit chain for project PRJ-014", "what CARs are open and how long have they been unresolved?", "generate the ISO 14064-3 §6.7 audit pack for this vintage" — the copilot runs the Evolution-A chain-verification and CAR/CL/FAR tools, reports integrity status and open findings, and drafts the audit documentation, every event and hash from tool output.

**How.** Read-only tool schemas over the Evolution-A verification and event-query routes; grounding corpus is this Atlas record plus the ISO 14064-3 / VCS / CDM references. The chain-verify tool result is embedded in every audit pack so integrity is asserted by computation, not by the LLM — the same discipline as the platform audit modules, but here it's already backed by real SHA-256. The copilot's honesty duty: it reports verification status as the tool returned it, and a broken chain is surfaced prominently, never smoothed — tamper detection is the module's entire purpose.

**Prerequisites (hard).** Evolution A's persistence — a copilot verifying a chain over seeded events would attest integrity of fictional records, undermining the buyer/VVB trust the module exists to provide. **Acceptance:** every event, hash, and CAR status traces to a tool response; audit packs embed a chain-verification result; a tampered chain is reported as failed, never as clean.