# Api::Pcaf_Unified
**Module ID:** `api::pcaf_unified` · **Route:** `/api/v1/pcaf-module` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pcaf-module/calculate` | `calculate_portfolio` | api/v1/routes/pcaf_unified.py |
| POST | `/api/v1/pcaf-module/calculate/{asset_class}` | `calculate_asset_class` | api/v1/routes/pcaf_unified.py |
| POST | `/api/v1/pcaf-module/insurance` | `calculate_insurance` | api/v1/routes/pcaf_unified.py |
| POST | `/api/v1/pcaf-module/facilitated` | `calculate_facilitated` | api/v1/routes/pcaf_unified.py |
| POST | `/api/v1/pcaf-module/portfolio-summary` | `portfolio_summary` | api/v1/routes/pcaf_unified.py |
| POST | `/api/v1/pcaf-module/regulatory-disclosures` | `regulatory_disclosures` | api/v1/routes/pcaf_unified.py |
| POST | `/api/v1/pcaf-module/dqs-assessment` | `dqs_assessment` | api/v1/routes/pcaf_unified.py |
| POST | `/api/v1/pcaf-module/improvement-roadmap` | `improvement_roadmap` | api/v1/routes/pcaf_unified.py |
| POST | `/api/v1/pcaf-module/bridge/ecl` | `bridge_ecl` | api/v1/routes/pcaf_unified.py |
| POST | `/api/v1/pcaf-module/bridge/scenario` | `bridge_scenario` | api/v1/routes/pcaf_unified.py |
| GET | `/api/v1/pcaf-module/ref/asset-classes` | `ref_asset_classes` | api/v1/routes/pcaf_unified.py |
| GET | `/api/v1/pcaf-module/ref/emission-factors` | `ref_emission_factors` | api/v1/routes/pcaf_unified.py |
| GET | `/api/v1/pcaf-module/ref/dqs-framework` | `ref_dqs_framework` | api/v1/routes/pcaf_unified.py |
| GET | `/api/v1/pcaf-module/ref/regulatory-mappings` | `ref_regulatory_mappings` | api/v1/routes/pcaf_unified.py |
| GET | `/api/v1/pcaf-module/ref/insurance-lobs` | `ref_insurance_lobs` | api/v1/routes/pcaf_unified.py |
| GET | `/api/v1/pcaf-module/ref/deal-types` | `ref_deal_types` | api/v1/routes/pcaf_unified.py |

### 2.3 Engine `facilitated_emissions_engine` (services/facilitated_emissions_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `IssuerEmissions.total_scope12` |  |  |
| `IssuerEmissions.total_all_scopes` |  |  |
| `derive_dqs` | data_source, override, has_scope1, has_scope2, verified | Derive PCAF Data Quality Score from available information. |
| `FacilitatedEmissionsEngine.calculate_facilitated` | deal | Calculate facilitated emissions for a single deal. |
| `FacilitatedEmissionsEngine.calculate_facilitated_batch` | deals | Calculate facilitated emissions for multiple deals and produce summary. |
| `FacilitatedEmissionsEngine.calculate_insurance` | policy | Calculate insurance-associated emissions for a single policy. |
| `FacilitatedEmissionsEngine.calculate_insurance_batch` | policies | Calculate insurance emissions for multiple policies and produce summary. |
| `FacilitatedEmissionsEngine.get_sector_intensities` |  | Return the full sector emission intensity registry. |
| `FacilitatedEmissionsEngine.get_vehicle_factors` |  |  |
| `FacilitatedEmissionsEngine.get_building_factors` |  |  |
| `FacilitatedEmissionsEngine.get_insurance_lob_factors` |  |  |
| `FacilitatedEmissionsEngine.get_deal_types` |  |  |
| `FacilitatedEmissionsEngine.get_insurance_lobs` |  |  |
| `FacilitatedEmissionsEngine._compute_attribution_factor` | deal, warnings | Compute AF based on deal type per PCAF Part C methodology. |
| `FacilitatedEmissionsEngine._get_bank_participation` | deal | Return the bank's $ participation in the deal. |
| `FacilitatedEmissionsEngine._calc_motor` | p, warnings | Motor insurance emissions — vehicle-count × km × gCO2/km. |
| `FacilitatedEmissionsEngine._calc_property` | p, warnings | Property insurance emissions — area × kgCO2/m². |
| `FacilitatedEmissionsEngine._calc_commercial` | p, warnings | Commercial lines — sector-based revenue intensity or premium proxy. |
| `FacilitatedEmissionsEngine._aggregate_facilitated` | results | Aggregate deal-level results into portfolio summary. |
| `FacilitatedEmissionsEngine._aggregate_insurance` | results | Aggregate policy-level results into portfolio summary. |

**Engine `facilitated_emissions_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_DQS_SOURCE_MAP` | `{'direct_measurement': 1, 'audited_report': 2, 'self_reported': 3, 'sector_average': 4, 'estimated': 5}` |

### 2.3 Engine `pcaf_unified_engine` (services/pcaf_unified_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_emission_factor_fallback` | reported_s1, reported_s2, verified, sector, revenue_eur, outstanding_eur | PCAF emission factor fallback hierarchy: 1. Verified reported data (DQS 1) 2. Unverified reported data (DQS 2) 3. Sector-average intensity x revenue (DQS 4) 4. Sector proxy x outstanding (DQS 5) Returns (scope1, scope2, scope3_est, dqs, source_description). |
| `derive_dqs_auto` | has_verified_emissions, has_reported_emissions, has_physical_activity, has_revenue, has_sector_only, asset_class | Derive PCAF DQS per the asset-class-specific tables (5.1-5.8). Hierarchy: DQS 1: Verified Scope 1+2+3 emissions (audited, ISAE 3410 / ISO 14064-3) DQS 2: Unverified reported Scope 1+2 emissions DQS 3: Physical activity data (kWh, litres, tonnes) + emission factors DQS 4: Economic activity (revenue) + sector emission factors DQS 5: Sector-average proxy from outstanding/assets |
| `PCAFUnifiedEngine.calculate_listed_equity` | holding | Listed Equity & Corporate Bonds: EVIC attribution (PCAF Table 5.1). |
| `PCAFUnifiedEngine.calculate_corporate_bonds` | holding | Corporate Bonds: EVIC attribution (PCAF Table 5.1). |
| `PCAFUnifiedEngine.calculate_business_loans` | holding | Business Loans & SME Loans: balance sheet attribution (PCAF Table 5.2). |
| `PCAFUnifiedEngine.calculate_project_finance` | holding | Project Finance: project cost attribution (PCAF Table 5.3). |
| `PCAFUnifiedEngine.calculate_commercial_re` | holding | Commercial Real Estate: property value, LTV-adjusted (PCAF Table 5.4). |
| `PCAFUnifiedEngine.calculate_mortgages` | holding | Residential Mortgages: property value, EPC-weighted (PCAF Table 5.5). |
| `PCAFUnifiedEngine.calculate_vehicle_loans` | holding | Motor Vehicle Loans: vehicle value, fuel type EF (PCAF Table 5.6). |
| `PCAFUnifiedEngine.calculate_sovereign_bonds` | holding | Sovereign Bonds: GDP-proportional, production-based (PCAF Table 5.7). |
| `PCAFUnifiedEngine.calculate_unlisted_equity` | holding | Unlisted Equity: EVIC proxy with size premium (PCAF Table 5.8). |
| `PCAFUnifiedEngine.calculate_infrastructure` | holding | Infrastructure Finance: project lifecycle attribution. |
| `PCAFUnifiedEngine.calculate_green_bonds` | holding | Green Bonds: use-of-proceeds allocation. |
| `PCAFUnifiedEngine.calculate_insurance` | policies | Calculate insurance-associated emissions for all lines of business. Supports: motor, property, commercial, life/health, marine, energy, liability, reinsurance. |
| `PCAFUnifiedEngine._calculate_insurance_policy` | p | Route to the correct LoB calculation method. |
| `PCAFUnifiedEngine._ins_motor` | p, w | Motor: fleet emissions = vehicles x km x gCO2/km. |
| `PCAFUnifiedEngine._ins_property` | p, w | Property: area x kgCO2/m2 by EPC rating. |
| `PCAFUnifiedEngine._ins_commercial` | p, w | Commercial: sector-revenue intensity or premium proxy. |
| `PCAFUnifiedEngine._ins_marine` | p, w | Marine Insurance: vessel emissions (IMO DCS data x fleet composition). |
| `PCAFUnifiedEngine._ins_energy` | p, w | Energy Insurance: asset-level generation emissions. |
| `PCAFUnifiedEngine._ins_life_health` | p, w | Life & Health: disclosure-only per PCAF (no insured emissions). |
| `PCAFUnifiedEngine._ins_reinsurance` | p, w | Reinsurance: proportional/non-proportional cedant aggregation. |
| `PCAFUnifiedEngine._ins_liability` | p, w | Liability Insurance: sector-revenue proxy. |
| `PCAFUnifiedEngine.calculate_facilitated` | deals | Delegate to existing FacilitatedEmissionsEngine. |
| `PCAFUnifiedEngine.calculate_portfolio` | holdings, insurance_policies, facilitated_deals, prior_year_emissions | Run all asset classes, aggregate, and produce comprehensive portfolio metrics. Parameters ---------- holdings : list[dict] Part A holdings. Each dict must include asset_class plus class-specific fields. insurance_policies : list[InsuranceHoldingInput], optional Part B insurance policies. facilitated_deals : list[FacilitatedDealInput], optional Part C capital markets deals. prior_year_emissions : f |
| `PCAFUnifiedEngine.generate_regulatory_disclosures` | portfolio | Produce disclosure-ready outputs for 7 regulatory/voluntary frameworks. Returns a RegulatoryDisclosurePackage with SFDR PAI, EU Taxonomy Art. 8, TCFD, CSRD ESRS E1, ISSB S2, GRI 305, and NZBA sections. |
| `PCAFUnifiedEngine.assess_data_quality` | holdings | Portfolio-level DQS assessment with uncertainty estimation. For each holding, derives DQS from available data characteristics. Produces exposure-weighted portfolio DQS, distribution, and confidence bands. |
| `PCAFUnifiedEngine.generate_improvement_roadmap` | holdings | Generate per-holding DQS gap closure actions. Prioritises holdings by exposure-weighted DQS improvement potential. |
| `PCAFUnifiedEngine.estimate_uncertainty` | portfolio_dqs, total_emissions | Estimate confidence bands from portfolio DQS. Uses PCAF's indicative uncertainty ranges: DQS 1: +/- 5% DQS 2: +/- 15% DQS 3: +/- 30% DQS 4: +/- 45% DQS 5: +/- 60% |
| `PCAFUnifiedEngine.bridge_to_ecl` | holdings, portfolio_temperature_c | Wire PCAF financed emissions data into the ECL Climate Overlay engine. Converts holdings to PCAFInvesteeProfile and delegates to pcaf_ecl_bridge. |
| `PCAFUnifiedEngine.bridge_to_scenario_analysis` | portfolio | Emit climate scenario overlays from PCAF portfolio metrics. Maps PCAF emissions to NGFS scenario impact pathways for downstream scenario analysis and stress testing. |
| `PCAFUnifiedEngine.feed_to_entity360` | holdings | Supply entity-level PCAF metrics for Entity 360 profiles. Returns a list of entity-level PCAF summaries for integration with the entity 360 counterparty master. |
| `PCAFUnifiedEngine.feed_to_regulatory_compiler` | portfolio | Supply disclosure-ready data for the regulatory report compiler. Returns a structured dict keyed by framework with all PCAF-sourced datapoints needed for CSRD, SFDR, ISSB, TCFD, GRI compilation. |
| `PCAFUnifiedEngine._get_asset_class_calculator` | asset_class | Return the calculation method for a given asset class. |
| `PCAFUnifiedEngine._calculate_standard_asset_class` | holding, asset_class | Standard calculation for EVIC/balance-sheet asset classes. Uses the emission factor fallback hierarchy and returns a normalised result dict. |
| `PCAFUnifiedEngine._apply_af_and_emissions` | holding, af, asset_class, method_note | Helper: apply AF to emissions using fallback hierarchy. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `PCAF` *(shared)*, `__future__` *(shared)*, `credit`, `dataclasses` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/pcaf-module/ref/asset-classes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 11, 'item0_keys': ['id', 'label', 'pcaf_part', 'attribution_method', 'formula', 'dqs_table_ref', 'scope_coverage']}`

**GET /api/v1/pcaf-module/ref/deal-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 8, 'item0_keys': ['deal_type', 'label', 'attribution_note', 'pcaf_reference']}`

**GET /api/v1/pcaf-module/ref/dqs-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dqs_levels', 'quality_dimensions', 'improvement_paths', 'confidence_weights', 'benchmarks'], 'n_keys': 5}`

**GET /api/v1/pcaf-module/ref/emission-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_intensities_gics', 'nace_emission_factors', 'vehicle_factors', 'building_factors_epc', 'mortgage_epc_factors', 'sovereign_production_mtco2e', 'infrastructure_lifecycle_ef', 'marine_vessel_ef', 'energy_asset_ef', 'green_bond_uop_ef', 'insurance_lob_factors'], 'n_ke`

**GET /api/v1/pcaf-module/ref/insurance-lobs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 10, 'item0_keys': ['lob', 'label', 'default_ef_tco2e_per_m_premium', 'calculation_method']}`

**GET /api/v1/pcaf-module/ref/regulatory-mappings** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 10, 'item0_keys': ['mapping_id', 'pcaf_metric', 'target_framework', 'target_reference', 'description', 'data_flow']}`

**POST /api/v1/pcaf-module/bridge/ecl** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/pcaf-module/bridge/scenario** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `facilitated_emissions_engine` — extracted transformation lines:**
```python
estimated_total = deal.issuer_revenue_musd * intensity
emissions.scope1_tco2e = estimated_total * 0.6  # assume 60/40 split
emissions.scope2_tco2e = estimated_total * 0.4
s1_fac = round(af * emissions.scope1_tco2e, 4)
s2_fac = round(af * emissions.scope2_tco2e, 4)
s3_fac = round(af * emissions.scope3_tco2e, 4)
total_ins = round(gwp * factor, 4) if gwp > 0 else 0.0
s1_ins = round(total_ins * 0.3, 4)
s2_ins = round(total_ins * 0.7, 4)
intensity = round(total_ins / policy.gross_written_premium_musd, 4)
af = (deal.underwritten_amount_musd / deal.total_deal_size_musd) * float(_PCAF_TIME_FACTOR)
effective_placed = placed * (1 + deal.overallotment_pct / 100.0)
af = (effective_placed / mcap) * float(_PCAF_TIME_FACTOR)
af = deal.tranche_held_musd / deal.total_pool_musd
af = deal.arranged_amount_musd / deal.total_facility_musd
total = s1 + s2
total_gco2 = vehicles * annual_km * gco2_km
total_tco2e = total_gco2 / 1_000_000  # g → t
s1 = round(total_tco2e * 0.5, 4)
s2 = round(total_tco2e * 0.5, 4)
total = round(s1 + s2, 4)
af = gco2_km / 1000.0  # effective factor per km
total = s1 + s2
total = round(p.gross_written_premium_musd * factor, 4)
s1 = round(total * 0.4, 4)  # heating/gas
s2 = round(total * 0.6, 4)  # electricity
total_kgco2 = area * kgco2_m2
total_tco2e = total_kgco2 / 1000.0
```

**Engine `pcaf_unified_engine` — extracted transformation lines:**
```python
s3_est = (s1 + s2) * 2.0
rev_m = revenue_eur / 1_000_000.0
total_est = rev_m * intensity
s1 = total_est * 0.6
s2 = total_est * 0.4
s3_est = total_est * 1.5
out_m = outstanding_eur / 1_000_000.0
total_est = out_m * proxy_intensity
s1 = total_est * 0.6
s2 = total_est * 0.4
s3_est = total_est * 1.5
af = min(outstanding / property_value, 1.0) if property_value > 0 else 1.0
annual_tco2e = (floor_area * kgco2_m2) / 1000.0
s1 = annual_tco2e * 0.4  # gas heating
s2 = annual_tco2e * 0.6  # electricity
financed_s1 = round(af * s1, 4)
financed_s2 = round(af * s2, 4)
financed_total = round(financed_s1 + financed_s2, 4)
af = min(outstanding / vehicle_value, 1.0) if vehicle_value > 0 else 1.0
annual_tco2e = (km * gco2_km) / 1_000_000.0
s1 = annual_tco2e * 0.5
s2 = annual_tco2e * 0.5
financed_s1 = round(af * s1, 4)
financed_s2 = round(af * s2, 4)
financed_total = round(financed_s1 + financed_s2, 4)
af = min(outstanding / gdp_f, 1.0) if gdp_f > 0 else 0.0
production_tco2 = production_mtco2 * 1_000_000.0
financed_tco2e = round(af * production_tco2, 4)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `api::facilitated_emissions` | engine:facilitated_emissions_engine |

## 7 · Methodology Deep Dive

The `pcaf_unified` domain (`/api/v1/pcaf-module`) is the **master PCAF orchestrator**
(`pcaf_unified_engine.py`) covering PCAF v2.0 Parts A, B and C in one engine, plus the
insurance/facilitated logic in `facilitated_emissions_engine.py`. It delegates to the WACI,
quality and facilitated engines and adds unified portfolio calculation, seven-framework
disclosure, and ECL/scenario bridges.

### 7.1 What the module computes

Per asset class it computes attribution × emissions with class-specific formulas; per portfolio
it rolls up financed + facilitated + insurance-associated emissions, DQS, WACI and regulatory
disclosures. The generic identity is `financed = attribution_factor × entity_emissions`, with
attribution keyed on EVIC, balance sheet, property/vehicle value, or project cost by class.

### 7.2 Parameterisation / scoring rubric

**Mortgage EPC factors** (`MORTGAGE_EPC_FACTORS`, kgCO₂/m²/yr): A+ 5 → G 160. **Vehicle
factors** (`VEHICLE_EMISSION_FACTORS`, gCO₂/km): petrol 170, diesel 155, hybrid 105, PHEV 60,
BEV 0. **Building factors** (`BUILDING_EMISSION_FACTORS`, EPC A+ 8 → G 180 kgCO₂/m²).
**Insurance LoB factors** (`INSURANCE_LOB_FACTORS`, tCO₂e/€M premium): commercial energy 450,
marine 120, motor commercial 85, life/health 5 (disclosure-only). **Sector intensities**
(`SECTOR_EMISSION_INTENSITIES`): Utilities 950, Energy 820, Financials 12.

**Facilitated attribution** (`facilitated_emissions_engine`, PCAF Part C): debt underwriting
`AF = underwritten/(total_issuance × 3)`; equity `shares/(market_cap × 3)`; the **÷3 time-in-
year factor** (`_PCAF_TIME_FACTOR ≈ 0.333`) is PCAF's capital-markets weighting; M&A advisory
`AF = 0` (disclosure-only).

**Green-bond use-of-proceeds** (`GREEN_BOND_UOP_FACTORS`, tCO₂e avoided/€M): renewables 320,
energy efficiency 180, clean transport 140. **Infrastructure EF** (`INFRASTRUCTURE_EF`):
coal 950, gas CCGT 380, solar 25, wind 12, nuclear 8.

**Provenance:** PCAF v2.0 tables, EU EPBD/CRREM (EPC), EU 2019/631/ICCT (vehicles), IEA/EDGAR
(sovereign) — public constants.

### 7.3 Calculation walkthrough

`calculate_mortgages`: `af = min(outstanding/property_value, 1.0)`; annual building emissions
`= floor_area × kgCO₂/m² / 1000`, split **40% Scope 1 (gas) / 60% Scope 2 (electricity)`;
financed = af × split; DQS auto-derived from EPC/floor-area availability. `calculate_vehicle_
loans`: `af = min(outstanding/vehicle_value, 1.0)`; `annual = km × gCO₂/km / 1e6`; BEV/FCEV
put emissions in Scope 2 (grid), PHEV splits 50/50. `calculate_portfolio` aggregates every
class + insurance + facilitated into portfolio totals, WACI, DQS distribution and disclosures.

### 7.4 Worked example

Residential mortgage: `outstanding = €200,000`, `property_value = €300,000`, EPC C
(42 kgCO₂/m²), floor area 100 m².

- **Attribution:** `af = min(200,000/300,000, 1.0) = 0.667`.
- **Annual building emissions:** `100 × 42 / 1000 = 4.2 tCO₂e`.
- **Split:** Scope 1 `4.2·0.4 = 1.68`; Scope 2 `4.2·0.6 = 2.52`.
- **Financed:** Scope 1 `0.667·1.68 = 1.12`; Scope 2 `1.68`; **total ≈ 2.80 tCO₂e**.

A €10M debt underwriting of a €200M issuance with issuer emissions 500,000 tCO₂e:
`AF = 10/(200×3) = 0.0167`; facilitated `= 0.0167 × 500,000 = 8,333 tCO₂e`.

### 7.5 Bridges & disclosures

`generate_regulatory_disclosures` emits seven-framework outputs (SFDR PAI, CSRD ESRS E1, IFRS
S2, GRI 305, EU Taxonomy, TCFD, NZBA). `bridge_to_ecl` and `bridge_to_scenario_analysis` hand
PCAF outputs to the ECL climate overlay and scenario engine (see `pcaf_ecl_bridge`).
`generate_improvement_roadmap` sequences DQS 5→1 transitions.

### 7.6 Data provenance & limitations

- All emission factors are **cited public reference tables** as constants; no `sr()` PRNG.
- Missing data is handled by class-specific defaults (e.g. 80 m² floor area, petrol EF) and
  DQS auto-derivation, not random fabrication — but defaults can bias small samples.
- The 40/60 mortgage Scope split and the Part C ÷3 factor are PCAF-consistent simplifications
  of full building energy modelling / time-weighted attribution.

**Framework alignment:** **PCAF v2.0 Part A** (7+3 asset-class attribution, Tables 5.1-5.6),
**Part B** (insurance-associated emissions by line of business), **Part C** (capital-markets
facilitated emissions with the ÷3 factor and advisory-disclosure-only rule). Portfolio
disclosures map to **SFDR PAI**, **CSRD ESRS E1-6**, **IFRS S2**, **GRI 305-3**, **EU Taxonomy
GAR**, **TCFD** and **NZBA** exactly as documented in the cross-framework map.