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
| GET | `/api/v1/facilitated-emissions/reference/insurance-lob-factors` | `ref_lob_factors` | api/v1/routes/facilitated_emissions.py |

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

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `real-db`

**Database tables:** `DB` *(shared)*, `SET` *(shared)*, `__future__` *(shared)*, `db` *(shared)*, `facilitated_emissions_v2`, `fastapi` *(shared)*, `insurance_emissions`, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/facilitated-emissions/** — status `passed`, provenance ['real-db'], source tables: `facilitated_emissions_v2`, `insurance_emissions`
Output: `{'type': 'array', 'len': 8, 'item0_keys': ['record_type', 'ref', 'entity_name', 'deal_type', 'total_tco2e', 'pcaf_dqs', 'created_at']}`

**GET /api/v1/facilitated-emissions/deals** — status `passed`, provenance ['real-db'], source tables: `facilitated_emissions_v2`
Output: `{'type': 'array', 'len': 4, 'item0_keys': ['id', 'deal_id', 'deal_type', 'issuer_name', 'issuer_id', 'issuer_sector_gics', 'issuer_country_iso2', 'issuer_revenue_musd', 'underwritten_amount_musd', 'total_deal_size_musd', 'shares_placed_value_musd', 'market_cap_musd', 'tranche_held_musd', 'total_pool`

**GET /api/v1/facilitated-emissions/deals/summary** — status `passed`, provenance ['real-db'], source tables: `facilitated_emissions_v2`
Output: `{'type': 'object', 'keys': ['totals', 'by_deal_type', 'by_sector', 'methodology'], 'n_keys': 4}`

**GET /api/v1/facilitated-emissions/insurance** — status `passed`, provenance ['real-db'], source tables: `insurance_emissions`
Output: `{'type': 'array', 'len': 4, 'item0_keys': ['id', 'policy_id', 'line_of_business', 'policyholder_name', 'policyholder_id', 'policyholder_sector_gics', 'policyholder_country_iso2', 'gross_written_premium_musd', 'net_earned_premium_musd', 'claims_paid_musd', 'loss_ratio_pct', 'vehicle_count', 'fuel_typ`

**GET /api/v1/facilitated-emissions/insurance/summary** — status `passed`, provenance ['real-db'], source tables: `insurance_emissions`
Output: `{'type': 'object', 'keys': ['totals', 'by_line_of_business', 'methodology'], 'n_keys': 3}`

**GET /api/v1/facilitated-emissions/reference/building-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'], 'n_keys': 8}`

**GET /api/v1/facilitated-emissions/reference/deal-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 8, 'item0_keys': ['value', 'label']}`

**GET /api/v1/facilitated-emissions/reference/insurance-lob-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['motor_personal', 'motor_commercial', 'property_residential', 'property_commercial', 'commercial_liability', 'commercial_marine', 'commercial_energy', 'commercial_other', 'life', 'health'], 'n_keys': 10}`

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

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `facilitated_emissions_engine` (used by 1 modules)

| Connected module | Shared via |
|---|---|
| `api::pcaf_unified` | engine:facilitated_emissions_engine |

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded solely in
`backend/services/facilitated_emissions_engine.py` and
`backend/api/v1/routes/facilitated_emissions.py`.)*

### 7.1 What the domain computes

`FacilitatedEmissionsEngine` implements two PCAF accounting streams that sit *outside* classic
financed emissions:

**Part C — facilitated emissions** (capital-markets services). Per deal:

```
facilitated_tCO2e = AF × issuer_emissions          (per scope; scope 3 only if include_scope3)
```

with the attribution factor `AF` keyed to deal type (`_compute_attribution_factor`):

| Deal type | AF formula (from code) | ÷3 time factor? |
|---|---|---|
| bond / convertible underwriting | `underwritten / total_issuance × 1/3` | yes (`_PCAF_TIME_FACTOR = 0.333333`) |
| equity placement / IPO | `placed × (1 + overallotment%/100) / market_cap × 1/3` | yes (green-shoe grossed up) |
| securitisation | `tranche_held / total_pool` | **no** (method string: "no ÷3 time factor") |
| syndicated loan (arranger) | `arranged / total_facility` | no |
| advisory (M&A / restructuring) | `AF = 0` — disclosure-only per PCAF 2022 guidance | — |

**Part B — insurance-associated emissions.** Per policy, routed by line of business:

- **Motor:** `vehicles × annual_km × gCO₂/km ÷ 10⁶` → tCO₂e; scope split by fuel (BEV/H₂ → all
  scope 2; PHEV → 50/50; combustion → all scope 1). `vehicles = max(count, 1)`.
- **Property:** `area_m² × kgCO₂/m²(EPC) ÷ 1000`; split 40% scope 1 (heating) / 60% scope 2
  (electricity); premium-based LoB proxy fallback when area is missing.
- **Commercial:** `insured_revenue × sector_intensity`; split 60/40; premium×LoB-factor fallback.
- **Life/Health:** disclosure-only — `GWP × 5 tCO₂e/$M` proxy, split 30/70, with a warning.
- Any line with direct policyholder scope 1/2 data bypasses proxies (`AF = 1.0`).

The routes persist every calculated deal/policy to DB tables (created on demand via
`_ensure_tables`), so `GET /deals`, `GET /insurance` and the two `/summary` endpoints serve the
accumulated stored records, aggregated by `_aggregate_facilitated` / `_aggregate_insurance`
(totals by scope, by deal type / LoB, green-bond counts, average PCAF DQS).

### 7.2 Parameterisation

**Sector emission intensities** (tCO₂e/$M revenue, GICS): Energy 820, Utilities 950,
Materials 410, Industrials 180, Consumer Staples 110, Real Estate 95, Cons. Discretionary 85,
Health Care 55, IT 28, Comm. Services 22, Financials 12, Sovereign 320 (per $M GDP), Unknown 150.
Order-of-magnitude consistent with CDP/MSCI sector medians; no inline source citation —
treat as **platform calibration**.

**Vehicle factors** (gCO₂/km · default km/yr): petrol 170·12,000; diesel 155·18,000; hybrid
105·12,000; PHEV 60·12,000; BEV 0·12,000; LPG 145·15,000; CNG 135·15,000; H₂-FCEV 0.
**Building factors** by EPC (kgCO₂/m²·yr): A+ 8, A 15, B 30, C 50, D 75, E 100, F 135, G 180.
**Insurance LoB factors** (tCO₂e/$M premium): motor personal 42, motor commercial 85, property
resi 28 / comm 55, liability 35, marine 120, energy 450, other 65, life/health 5.

**DQS derivation** (`derive_dqs`): source map direct_measurement→1, audited_report→2,
self_reported→3, sector_average→4, estimated→5; upgraded to ≤2 when scope 1+2 present *and*
verified, ≤3 when present but unverified; explicit 1–5 override wins.

**Missing-emissions fallback:** when an issuer reports no scope 1/2, the engine estimates
`revenue × sector_intensity` and splits it 60% scope 1 / 40% scope 2 (code comment: "assume
60/40 split"), recording a warning.

### 7.3 Calculation walkthrough

`POST /deals` → Pydantic input → engine dataclass → (1) emissions default/estimate, (2) AF by
deal type with a formula-bearing `methodology_note`, (3) DQS, (4) per-scope multiplication,
(5) persistence; the response embeds the audit trail (warnings + method string). Batch variants
map the same path and return the portfolio summary object.

### 7.4 Worked example — bond underwriting

Bank underwrites $250M of a $1,000M corporate bond; issuer reports scope 1 = 1.2 MtCO₂e,
scope 2 = 0.3 MtCO₂e (audited, unverified flag), scope 3 excluded.

| Step | Computation | Result |
|---|---|---|
| AF | (250 / 1000) × 0.333333 | **0.083333** |
| Facilitated scope 1 | 0.083333 × 1,200,000 | 100,000 tCO₂e |
| Facilitated scope 2 | 0.083333 × 300,000 | 25,000 tCO₂e |
| Facilitated total | 0.083333 × 1,500,000 | **125,000 tCO₂e** |
| DQS | audited_report → 2 | 2 |

Insurance cross-check: a 10,000-vehicle diesel fleet policy → 10,000 × 18,000 km × 155 g/km =
2.79 × 10¹⁰ g = **27,900 tCO₂e**, all scope 1; with GWP $12M the reported intensity is
27,900/12 = 2,325 tCO₂e/$M premium.

### 7.5 Semantics of the reported "attribution factor"

For Part C the AF is a true ownership-share fraction. For Part B proxy paths the field is
**overloaded**: motor returns `gCO₂/km ÷ 1000` (kg/km), property returns `kgCO₂/m² ÷ 1000`
(t/m²), commercial/life return the intensity factor itself (tCO₂e/$M). Consumers should read
`attribution_method` rather than compare AF values across lines.

### 7.6 Data provenance & limitations

- No `sr(seed)` PRNG anywhere — data is either caller-supplied or deterministic reference
  constants; but every factor table (sector intensities, vehicle, EPC, LoB) is an uncited
  platform calibration ("synthetic demo values" in atlas terms), not an official PCAF Annex.
- The ÷3 factor is hardcoded `0.333333`: PCAF's 2023 Part C standard adopted a 33% weighting for
  facilitated emissions — the engine matches that consensus; note PCAF applies it to *all*
  capital-markets facilitation, whereas this engine skips it for securitisation and syndicated
  arrangement (treating held tranches/arranged share as balance-sheet-like).
- Scope splits (60/40 corporate, 40/60 property, 30/70 life, 50/50 PHEV) are stated assumptions,
  not measured; BEV scope-2 uses the same g/km "0.0" table entry — i.e. BEV fleets currently
  compute **zero** emissions despite the scope-2 comment, because gCO₂/km is 0 for BEV.
- Life/health proxy contradicts PCAF's disclosure-only stance by producing a number
  (flagged via warning).
- Insurance-associated emissions under the real PCAF standard attribute
  `customer emissions × (premium / customer revenue)`; the engine's premium-factor and
  physical-asset approaches are simplified proxies of that.

### 7.7 Framework alignment

- **PCAF Part C (Facilitated Emissions, 2023)** — attribution = share of issuance × 33%
  weighting factor, exactly the debt/equity formulas coded; advisory excluded from attribution,
  matching PCAF's disclosure-only treatment.
- **PCAF Part B / Insurance-Associated Emissions Standard (2022)** — LoB-specific attribution;
  in the real standard IAE = attribution factor (premium ÷ customer revenue) × customer
  emissions for commercial lines and premium-share of vehicle emissions for motor; the engine
  approximates with activity-based (km, m², revenue) and premium-factor proxies plus the PCAF
  DQS 1–5 ladder.
- **GHG Protocol** — scope 1/2/3 taxonomy underlies all outputs; scope 3 inclusion is opt-in.
- **SFDR Delegated Regulation 2022/1288** — cited in the engine header as the disclosure
  destination (PAI 1–4 GHG indicators) for the aggregated outputs.
- **EU Taxonomy / green-bond tagging** — deals carry `use_of_proceeds` and
  `eu_taxonomy_aligned_pct` pass-through fields for the green-vs-general split in the summary.

## 9 · Future Evolution

### 9.1 Evolution A — Real PCAF insurance attribution, fix BEV zeroing, and calibrated factors (analytics ladder: rung 2 → 3)

**What.** A PCAF Part C (facilitated) + Part B (insurance-associated) emissions engine — deal-type
attribution factors (the ÷3 33% weighting matching PCAF 2023), LoB-routed insurance emissions, DB
persistence, PCAF DQS. Real-db, harness-passing, no PRNG. §7.6 names the deepening targets and defects:
every factor table (sector intensities, vehicle, EPC, LoB) is an **uncited platform calibration**, not
an official PCAF Annex; **BEV fleets compute zero emissions** because the gCO₂/km table entry is 0
despite the scope-2 comment (a real defect — BEVs have scope-2 grid emissions); the life/health proxy
**produces a number contradicting PCAF's disclosure-only stance** (flagged via warning); and the
insurance attribution uses activity/premium **proxies** of the real PCAF formula (customer emissions ×
premium/customer-revenue). Evolution A implements the real PCAF insurance attribution, fixes the BEV
scope-2 zeroing (grid-EF based), and calibrates the factor tables.

**How.** `_calc_commercial` uses `customer_emissions × (premium / customer_revenue)` per the PCAF
Insurance-Associated Emissions Standard where customer data exists (falling back to the premium proxy
with a DQS penalty); motor BEV emissions compute scope 2 from the grid EF (from the ENTSO-E/EIA
ingesters) × km × kWh/km rather than the 0 gCO₂/km entry; life/health returns disclosure-only (no
fabricated number) unless the caller opts in. Rung 3: the sector-intensity, vehicle, EPC and LoB factor
tables are calibrated against published PCAF/CDP/MSCI values with citations.

**Prerequisites.** The engine is harness-passing; the work is fidelity and defect-fixing, not endpoint
repair. Fix the overloaded `attribution_factor` field semantics (§7.5 — it means different things per
LoB; consumers must read `attribution_method`) by reporting a typed factor. **Acceptance:** the §7.4
bond-underwriting worked example (AF 0.083333, 125,000 tCO₂e facilitated) reproduces; a BEV fleet policy
computes non-zero scope-2 emissions from the grid EF; commercial insurance uses the real PCAF
premium/revenue attribution where customer data exists; life/health returns disclosure-only by default.

### 9.2 Evolution B — Facilitated/insurance-emissions analyst with tool-called calculation (LLM tier 2)

**What.** A tool-calling analyst for capital-markets and insurance sustainability teams: "compute
facilitated emissions for this bond underwriting" (`/deals` → AF by deal type, per-scope facilitated
tCO₂e, DQS, methodology note), "run our deal book" (`/deals/batch` → summary by deal type/sector),
"compute insurance-associated emissions for this motor policy" (`/insurance` → LoB-routed emissions),
and "summarise our insurance portfolio" (`/insurance/summary`) — narrating real PCAF outputs and the
audit trail (warnings + method strings the engine already emits).

**How.** Tool schemas over the create/list/summary/reference endpoints; write actions (create deal/
policy) render a confirmation before persisting (audit-logged). The reference endpoints (deal types,
insurance LoBs, sector/vehicle/building/LoB factors) are exceptional RAG grounding for "what's the ÷3
factor for bond underwriting?" or "what's the EPC-C building factor?" questions. The no-fabrication
validator checks every tCO₂e, AF and DQS against tool output; the copilot surfaces the methodology note
per deal (the AF formula) and flags the uncited factor calibrations. Feeds `pcaf_unified` (shared
engine) and composes into a financed-emissions desk alongside `emissions_data` and `dme_dmi`.

**Prerequisites.** Evolution A's BEV/insurance-attribution fixes (so narrated emissions are correct);
Atlas + reference corpus embedded (roadmap D3); RBAC so writes run under the user's session.
**Acceptance:** every figure cited traces to an engine tool call; the facilitated emissions match
`/deals`; a BEV fleet no longer reports zero; the copilot surfaces the per-deal methodology note and
flags factor calibrations as platform values pending Evolution A.