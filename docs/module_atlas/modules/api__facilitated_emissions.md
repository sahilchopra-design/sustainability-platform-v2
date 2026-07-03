# Api::Facilitated_Emissions
**Module ID:** `api::facilitated_emissions` · **Route:** `/api/v1/facilitated-emissions` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/facilitated-emissions/deals` | `create_facilitated_deal` | api/v1/routes/facilitated_emissions.py |
| POST | `/api/v1/facilitated-emissions/deals/batch` | `create_facilitated_batch` | api/v1/routes/facilitated_emissions.py |
| GET | `/api/v1/facilitated-emissions/deals` | `list_facilitated_deals` | api/v1/routes/facilitated_emissions.py |
| GET | `/api/v1/facilitated-emissions/deals/summary` | `facilitated_summary` | api/v1/routes/facilitated_emissions.py |
| DELETE | `/api/v1/facilitated-emissions/deals/{record_id}` | `delete_facilitated_deal` | api/v1/routes/facilitated_emissions.py |
| POST | `/api/v1/facilitated-emissions/insurance` | `create_insurance_emission` | api/v1/routes/facilitated_emissions.py |
| POST | `/api/v1/facilitated-emissions/insurance/batch` | `create_insurance_batch` | api/v1/routes/facilitated_emissions.py |
| GET | `/api/v1/facilitated-emissions/insurance` | `list_insurance_emissions` | api/v1/routes/facilitated_emissions.py |
| GET | `/api/v1/facilitated-emissions/insurance/summary` | `insurance_summary` | api/v1/routes/facilitated_emissions.py |
| DELETE | `/api/v1/facilitated-emissions/insurance/{record_id}` | `delete_insurance_emission` | api/v1/routes/facilitated_emissions.py |
| GET | `/api/v1/facilitated-emissions/reference/deal-types` | `ref_deal_types` | api/v1/routes/facilitated_emissions.py |
| GET | `/api/v1/facilitated-emissions/reference/insurance-lobs` | `ref_insurance_lobs` | api/v1/routes/facilitated_emissions.py |
| GET | `/api/v1/facilitated-emissions/reference/sector-intensities` | `ref_sector_intensities` | api/v1/routes/facilitated_emissions.py |
| GET | `/api/v1/facilitated-emissions/reference/vehicle-factors` | `ref_vehicle_factors` | api/v1/routes/facilitated_emissions.py |
| GET | `/api/v1/facilitated-emissions/reference/building-factors` | `ref_building_factors` | api/v1/routes/facilitated_emissions.py |

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

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `real-db`

**Database tables:** `DB` *(shared)*, `SET` *(shared)*, `__future__` *(shared)*, `db` *(shared)*, `facilitated_emissions_v2`, `fastapi` *(shared)*, `insurance_emissions`, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/facilitated-emissions/** — status `passed`, provenance ['real-db'], source tables: `facilitated_emissions_v2`, `insurance_emissions`
Output: `{'type': 'array', 'len': 8, 'item0_keys': ['record_type', 'ref', 'entity_name', 'deal_type', 'total_tco2e', 'pcaf_dqs', 'created_at']}`

**GET /api/v1/facilitated-emissions/deals** — status `passed`, provenance ['real-db'], source tables: `facilitated_emissions_v2`
Output: `{'type': 'array', 'len': 4, 'item0_keys': ['id', 'deal_id', 'deal_type', 'issuer_name', 'issuer_id', 'issuer_sector_gics', 'issuer_country_iso2', 'issuer_revenue_musd', 'underwritten_amount_musd', 'total_deal_size_musd',`

**GET /api/v1/facilitated-emissions/deals/summary** — status `passed`, provenance ['real-db'], source tables: `facilitated_emissions_v2`
Output: `{'type': 'object', 'keys': ['totals', 'by_deal_type', 'by_sector', 'methodology'], 'n_keys': 4}`

**GET /api/v1/facilitated-emissions/insurance** — status `passed`, provenance ['real-db'], source tables: `insurance_emissions`
Output: `{'type': 'array', 'len': 4, 'item0_keys': ['id', 'policy_id', 'line_of_business', 'policyholder_name', 'policyholder_id', 'policyholder_sector_gics', 'policyholder_country_iso2', 'gross_written_premium_musd', 'net_earned`

**GET /api/v1/facilitated-emissions/insurance/summary** — status `passed`, provenance ['real-db'], source tables: `insurance_emissions`
Output: `{'type': 'object', 'keys': ['totals', 'by_line_of_business', 'methodology'], 'n_keys': 3}`

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

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `api::pcaf_unified` | engine:facilitated_emissions_engine |