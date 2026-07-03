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

### 2.3 Engine `pcaf_unified_engine` (services/pcaf_unified_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_emission_factor_fallback` | reported_s1, reported_s2, verified, sector, revenue_eur, outstanding_eur | PCAF emission factor fallback hierarchy: |
| `derive_dqs_auto` | has_verified_emissions, has_reported_emissions, has_physical_activity, has_revenue, has_sector_only, asset_class | Derive PCAF DQS per the asset-class-specific tables (5.1-5.8). |
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
| `PCAFUnifiedEngine.calculate_insurance` | policies | Calculate insurance-associated emissions for all lines of business. |
| `PCAFUnifiedEngine._calculate_insurance_policy` | p | Route to the correct LoB calculation method. |
| `PCAFUnifiedEngine._ins_motor` | p, w | Motor: fleet emissions = vehicles x km x gCO2/km. |
| `PCAFUnifiedEngine._ins_property` | p, w | Property: area x kgCO2/m2 by EPC rating. |
| `PCAFUnifiedEngine._ins_commercial` | p, w | Commercial: sector-revenue intensity or premium proxy. |

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
Output: `{'type': 'object', 'keys': ['sector_intensities_gics', 'nace_emission_factors', 'vehicle_factors', 'building_factors_epc', 'mortgage_epc_factors', 'sovereign_production_mtco2e', 'infrastructure_lifecycle_ef', 'marine_ves`

**GET /api/v1/pcaf-module/ref/insurance-lobs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 10, 'item0_keys': ['lob', 'label', 'default_ef_tco2e_per_m_premium', 'calculation_method']}`

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
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `api::facilitated_emissions` | engine:facilitated_emissions_engine |