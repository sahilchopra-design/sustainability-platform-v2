# Api::Cbam
**Module ID:** `api::cbam` · **Route:** `/api/v1/cbam` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/cbam/dashboard` | `dashboard` | api/v1/routes/cbam.py |
| POST | `/api/v1/cbam/seed` | `seed` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/products` | `list_products` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/products/{pid}` | `get_product` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/products/sectors/summary` | `product_sectors` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/suppliers` | `list_suppliers` | api/v1/routes/cbam.py |
| POST | `/api/v1/cbam/suppliers` | `create_supplier` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/suppliers/{sid}` | `get_supplier` | api/v1/routes/cbam.py |
| DELETE | `/api/v1/cbam/suppliers/{sid}` | `delete_supplier` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/suppliers/{sid}/projections` | `supplier_projections` | api/v1/routes/cbam.py |
| POST | `/api/v1/cbam/emissions` | `record_emissions` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/emissions` | `list_emissions` | api/v1/routes/cbam.py |
| POST | `/api/v1/cbam/calculate-cost` | `calc_cost` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/free-allocation-schedule` | `free_alloc_schedule` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/ets-price-scenarios` | `ets_scenarios` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/countries` | `list_countries` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/certificate-prices` | `cert_prices` | api/v1/routes/cbam.py |
| POST | `/api/v1/cbam/calculate-emissions` | `calculate_emissions` | api/v1/routes/cbam.py |
| POST | `/api/v1/cbam/project-costs` | `project_costs` | api/v1/routes/cbam.py |
| POST | `/api/v1/cbam/portfolio-exposure` | `portfolio_exposure` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/supplier-risk/{supplier_id}` | `supplier_risk_profile` | api/v1/routes/cbam.py |

### 2.3 Engine `cbam_calculator` (services/cbam_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `CBAMEmissionsCalculator.calculate_embedded_emissions` | supplier_id, product_category_id, production_volume_tonnes, direct_emissions_data, indirect_emissions_data, electricity_consumed_mwh, use_defaults | Calculate Specific Embedded Emissions (SEE) for CBAM goods. SEE = (direct attributed emissions + indirect attributed emissions) / production volume Returns calculation result with specific emissions per tonne of product. |
| `CBAMEmissionsCalculator._calculate_direct_from_data` | data | Calculate direct emissions from source stream data. Standard method: Sum of (activity data × emission factor) for each source stream. |
| `CBAMEmissionsCalculator._calculate_indirect_from_data` | data | Calculate indirect emissions from electricity/heat consumption data. |
| `CBAMEmissionsCalculator._get_grid_emission_factor` | country_code | Get grid emission factor for a country. Falls back to global average. |
| `CBAMCostProjector.project_supplier_costs` | supplier_id, start_year, end_year, scenario | Project CBAM costs for a supplier from start_year to end_year. Methodology: 1. Get latest emissions data for supplier 2. For each projection year: a. Get EU ETS price (from scenario or DB) b. Get free allocation percentage c. Get domestic carbon price credit d. Calculate: net_cost = (emissions × ETS_price) - domestic_credit - free_allocation_reduction |
| `CBAMCostProjector.calculate_portfolio_exposure` | supplier_ids, year, scenario | Calculate total CBAM exposure across multiple suppliers. |
| `CBAMCostProjector._interpolate_price` | prices, year | Interpolate ETS price for a given year. |
| `CBAMComplianceScorer.score_supplier_compliance` | supplier_id | Score a supplier's CBAM compliance readiness (0-100). Factors: - Verification status (30%) - Data completeness (30%) - Domestic carbon pricing (20%) - Country risk (20%) |
| `CBAMComplianceScorer._generate_recommendations` | scores | Generate actionable recommendations based on scores. |
| `CBAMTransitionParams.interpolate_price` | source, year, custom_prices | Return carbon price (EUR/tCO2e) for a given source + year via linear interpolation. |
| `get_cbam_carbon_exposure` | scope1_tco2e, scope2_tco2e, scope3_tco2e, carbon_price_source, pass_through_rate, scope3_inclusion, time_horizon, scenario | Compute forward-looking CBAM carbon exposure for use in transition risk assessment. Args: scope1_tco2e: Annual Scope 1 emissions (tCO2e) scope2_tco2e: Annual Scope 2 emissions (tCO2e) scope3_tco2e: Annual Scope 3 emissions (tCO2e) carbon_price_source: Key in CBAMTransitionParams.PRICE_SOURCES pass_through_rate: Fraction of carbon cost passed to counterparty (0-1) scope3_inclusion: Include Scope 3  |

### 2.3 Engine `cbam_service` (services/cbam_service.py)
| Function | Args | Purpose |
|---|---|---|
| `seed_cbam_data` | db | Seed product categories, country risk, and certificate prices. |
| `calculate_cbam_cost` | emissions_tco2, eu_ets_price, domestic_carbon_price, free_allocation_pct | Calculate net CBAM cost for a given emissions amount. |
| `project_supplier_costs` | db, supplier_id, scenarios | Project CBAM costs for a supplier across years and scenarios. |
| `get_cbam_dashboard` | db | Get CBAM dashboard overview. |

**Engine `cbam_service` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `ETS_PRICE_SCENARIOS` | `{'Current Trend': {2025: 70, 2026: 75, 2027: 80, 2028: 85, 2030: 95, 2035: 120, 2040: 150, 2050: 200}, 'Ambitious': {2025: 80, 2026: 90, 2027: 105, 2028: 120, 2030: 160, 2035: 250, 2040: 350, 2050: 500}, 'Conservative': {2025: 65, 2026: 68, 2027: 70, 2028: 72, 2030: 78, 2035: 90, 2040: 105, 2050: 13` |
| `PRODUCT_CATEGORIES` | `[{'cn_code': '25232100', 'hs_code': '252321', 'sector': 'Cement', 'product_name': 'Portland cement', 'default_direct': 0.525, 'default_indirect': 0.06, 'default_total': 0.585}, {'cn_code': '25232900', 'hs_code': '252329', 'sector': 'Cement', 'product_name': 'Other hydraulic cement', 'default_direct'` |
| `COUNTRY_RISK_DATA` | `[{'code': 'CN', 'name': 'China', 'carbon': True, 'price': 12, 'grid_ef': 0.555, 'risk': 0.7, 'cat': 'High'}, {'code': 'IN', 'name': 'India', 'carbon': False, 'price': 0, 'grid_ef': 0.708, 'risk': 0.85, 'cat': 'Very High'}, {'code': 'RU', 'name': 'Russia', 'carbon': False, 'price': 0, 'grid_ef': 0.33` |
| `FREE_ALLOC_SCHEDULE` | `{2026: 97.5, 2027: 95.0, 2028: 90.0, 2029: 77.5, 2030: 51.5, 2031: 39.0, 2032: 26.5, 2033: 14.0, 2034: 0.0}` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `country` *(shared)*, `db` *(shared)*, `decimal` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/cbam/certificate-prices** — status `passed`, provenance ['real-db'], source tables: `cbam_certificate_price`
Output: `{'type': 'array', 'len': 24, 'item0_keys': ['date', 'ets_price', 'cbam_price', 'scenario', 'is_projection']}`

**GET /api/v1/cbam/countries** — status `passed`, provenance ['real-db'], source tables: `cbam_country_risk`
Output: `{'type': 'array', 'len': 20, 'item0_keys': ['country_code', 'country_name', 'has_carbon_pricing', 'carbon_price_eur', 'grid_emission_factor', 'risk_score', 'risk_category']}`

**GET /api/v1/cbam/dashboard** — status `passed`, provenance ['real-db'], source tables: `cbam_country_risk`, `cbam_embedded_emissions`, `cbam_product_category`, `cbam_supplier`
Output: `{'type': 'object', 'keys': ['total_suppliers', 'total_products', 'total_countries', 'emissions_records', 'high_risk_suppliers', 'total_embedded_emissions_tco2', 'sector_breakdown'], 'n_keys': 7}`

**GET /api/v1/cbam/emissions** — status `passed`, provenance ['real-db'], source tables: `cbam_embedded_emissions`
Output: `{'type': 'array', 'len': 1, 'item0_keys': ['id', 'supplier_id', 'product_category_id', 'reporting_year', 'reporting_quarter', 'import_volume_tonnes', 'direct_emissions', 'indirect_emissions', 'specific_total', 'is_verified', 'uses_default_values']}`

**GET /api/v1/cbam/ets-price-scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['Current Trend', 'Ambitious', 'Conservative'], 'n_keys': 3}`

**GET /api/v1/cbam/free-allocation-schedule** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034], 'n_keys': 9}`

**GET /api/v1/cbam/products** — status `passed`, provenance ['real-db'], source tables: `cbam_product_category`
Output: `{'type': 'array', 'len': 15, 'item0_keys': ['id', 'cn_code', 'hs_code', 'sector', 'product_name', 'default_direct_emissions', 'default_indirect_emissions', 'default_total_emissions']}`

**GET /api/v1/cbam/products/sectors/summary** — status `passed`, provenance ['real-db'], source tables: `cbam_product_category`
Output: `{'type': 'array', 'len': 6, 'item0_keys': ['sector', 'product_count', 'avg_emissions']}`

## 5 · Intermediate Transformation Logic

**Engine `cbam_calculator` — extracted transformation lines:**
```python
SEE = (direct attributed emissions + indirect attributed emissions) / production volume
direct_attributed = see_direct * production_volume_tonnes
see_direct = direct_attributed / production_volume_tonnes
indirect_attributed = see_indirect * production_volume_tonnes
indirect_attributed = electricity_consumed_mwh * grid_ef
see_indirect = indirect_attributed / production_volume_tonnes
see_total = see_direct + see_indirect
total_embedded = see_total * production_volume_tonnes
specific_emissions = float(latest_emissions.direct_emissions or 0) / max(annual_volume, 1)
annual_emissions = annual_volume * specific_emissions
gross_cost = annual_emissions * ets_price
domestic_credit = annual_emissions * domestic_price
free_reduction = gross_cost * (free_pct / 100)
net_cost = max(0, gross_cost - domestic_credit - free_reduction)
frac = (year - prev_y) / (next_y - prev_y)
t = (year - y0) / (y1 - y0)
target_year = base_year + time_horizon
covered_emissions = scope1_tco2e + scope2_tco2e
annual_exposure = covered_emissions * price * pass_through_rate
cumulative = annual_exposure * time_horizon * (1 + (price / max(base_price, 1))) / 2
```

**Engine `cbam_service` — extracted transformation lines:**
```python
gross_cost = emissions_tco2 * eu_ets_price
domestic_credit = emissions_tco2 * domestic_carbon_price
free_reduction = gross_cost * (free_allocation_pct / 100)
net_cost = max(0, gross_cost - domestic_credit - free_reduction)
annual_emissions = annual_volume * specific_emissions if specific_emissions > 0 else (emissions.direct_emissions or 0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

Grounded in two DB-backed services — `backend/services/cbam_calculator.py` (embedded-emissions,
cost projection, compliance scoring) and `backend/services/cbam_service.py` (seed data + simple
cost helpers) — behind `api/v1/routes/cbam.py`. This is the EU Carbon Border Adjustment Mechanism
engine: it computes Specific Embedded Emissions, projects certificate costs under free-allocation
phase-out, and scores supplier compliance readiness.

### 7.1 What the domain computes

```
SEE = (direct_attributed + indirect_attributed) / production_volume       (Art. 7)
SEE_total = (SEE_direct + SEE_indirect) × (1 + default_markup)             (Art. 4 markup)
net_CBAM_cost = max(0, emissions×ETS_price − emissions×domestic_price − gross×free_alloc%)
```

- **`CBAMEmissionsCalculator`** — direct emissions = `Σ(activity × EF × oxidation) + process`;
  indirect = electricity × grid EF (country-specific or global 0.436 tCO₂/MWh); default-value
  markup 30% (both defaults) or 10% (partial) per Art. 4(3).
- **`CBAMCostProjector`** — year-by-year net cost using an ETS price scenario and the
  free-allocation phase-out schedule, with linear price interpolation.
- **`CBAMComplianceScorer`** — weighted 0–100 readiness score (verification 30% + data
  completeness 30% + domestic pricing 20% + country risk 20%).
- **`CBAMTransitionParams` / `get_cbam_carbon_exposure`** — a forward-looking NGFS/IEA-priced
  exposure used by the transition-risk engine.

### 7.2 Parameterisation (cited to CBAM Regulation 2023/956 + Implementing Reg)

**Free allocation phase-out** (% free, `CBAMCostProjector`): 2025 100% (transitional, reporting
only) → 2026 97.5 → 2027 95.0 → 2028 90.0 → 2029 77.5 → 2030 51.5 → 2031 39.0 → 2032 26.5 →
2033 14.0 → 2034 0. This matches the EU CBAM legislative schedule.

**ETS price scenarios** (EUR/tCO₂, sampled): current_trend 2025 €70 → 2050 €210; ambitious €80 →
€520; conservative €60 → €135. Constants: default markup full 0.30 / partial 0.10; CO₂/C ratio
3.664; global grid EF 0.436 (IEA 2023).

**Default product emissions** (`cbam_service.PRODUCT_CATEGORIES`, tCO₂/t): Portland cement
direct 0.525 / indirect 0.060; cement clinker 0.846; semi-finished steel 1.419/0.214; unwrought
aluminium 1.514/**6.800** (electricity-dominated); urea 1.578/0.180; hydrogen 9.000/2.500;
electricity 0.376. These are per-CN-code CBAM default values.

**Country risk seed** (20 countries): grid EF, domestic carbon price, risk score/category — e.g.
India (no carbon price, grid 0.708, Very High), Norway (€85, grid 0.017, Low), China (€12, 0.555,
High), Switzerland (€120, Low).

**Compliance sub-scores**: verification {verified 100, pending 50, unverified 10, expired 0};
data completeness = `(records − default_records)/records × 80 + 20`; carbon pricing 80/20;
country risk {Low 90, Medium 60, High 35, Very High 15}. Status: compliant ≥ 70, at_risk ≥ 40.

**Transition price paths** (`CBAMTransitionParams`, EUR/tCO₂): NGFS_Below2C 2025 €55 → 2050 €500;
NGFS_NZ2050 €65 → €600; NGFS_DelayedTrans €35 → €580; NGFS_CurrentPolicy €30 → €100; IEA_NZE €50
→ €400.

### 7.3 Calculation walkthrough

- **Embedded emissions:** if actual data supplied, direct = per-source-stream `Σ activity×EF×
  oxidation + process`, and indirect from electricity×grid-EF; else the product's default values
  are used and the Art. 4 markup (30% full / 10% partial) inflates SEE_total before multiplying
  by production volume.
- **Cost projection:** for each year, ETS price is interpolated from the scenario table; gross =
  emissions × ETS; domestic credit = emissions × supplier's domestic carbon price; free reduction
  = gross × free% ; net = max(0, gross − credit − free). Portfolio exposure sums per-supplier net
  costs for a single year.
- **Compliance scoring:** the four weighted sub-scores combine to the 0–100 readiness with
  targeted recommendations (verify data, replace defaults, source from carbon-priced countries,
  diversify supply chain).
- **Transition exposure:** covered = S1 + S2 (+ S3 if included); annual = covered × interpolated
  price × pass-through (default 0.85); cumulative = trapezoidal over the horizon using base and
  target prices.

### 7.4 Worked example (Indian steel supplier, 2030, current_trend)

100,000 t imports, specific total 1.767 tCO₂/t (flat-rolled default) → annual emissions 176,700
tCO₂. India domestic carbon price €0. 2030 ETS (current_trend) €95; free allocation 51.5%:

| Step | Computation | Result |
|---|---|---|
| Gross cost | 176,700 × 95 | €16.79M |
| Domestic credit | 176,700 × 0 | €0 |
| Free reduction | 16.79M × 0.515 | €8.65M |
| **Net CBAM cost** | max(0, 16.79M − 0 − 8.65M) | **≈ €8.14M** |

By 2034 (free allocation 0%) the same volume/price would cost the full gross — the phase-out is
the dominant cost driver. If the same supplier reported only default emission values, the SEE
would additionally carry a 30% Art. 4 markup, raising embedded emissions to ≈ 229,700 tCO₂.

### 7.5 Data provenance & limitations

- **Seeded reference data, not synthetic PRNG.** The product defaults, country-risk table and ETS
  scenarios are fixed seed data written to the DB by `seed_cbam_data`; supplier/emissions records
  are real operational rows queried at runtime. No `sr(seed)`/random fabrication anywhere.
- ETS price *scenarios* are illustrative trajectories, not live auction prices; the CBAM
  certificate price is modelled as equal to the ETS price (`cbam_certificate_price = eu_ets_price`),
  which matches the regulation's weekly-average design but not real-time settlement.
- Default emission values carry the regulatory markup, but the calculator does not model the
  Art. 9 domestic-carbon-price *rebate cap* or verification-status gating on default use.
- Grid emission factors are static country seeds (IEA-era), not year-varying.
- The transition-exposure cumulative uses a simple trapezoidal price average, not a full
  discounted year-by-year sum.

### 7.6 Framework alignment

- **EU CBAM Regulation (EU) 2023/956** — the mechanism itself: importers of cement, iron & steel,
  aluminium, fertilisers, electricity and hydrogen surrender certificates for embedded emissions.
- **Art. 7 (Specific Embedded Emissions)** — SEE = attributed direct + indirect emissions per
  tonne of product; implemented via source-stream `activity × EF × oxidation` + process emissions.
- **Art. 4 / Implementing Reg (EU) 2023/1773 (default values)** — default embedded-emission
  values with a 30% (full) / 10% (partial) markup when actual data is unavailable — implemented
  exactly as the markup constants.
- **Art. 21 (certificate cost)** — certificate price tied to the weekly average EU ETS auction
  price; here approximated by the ETS scenario price.
- **Art. 31 (free allocation phase-out)** — the 2026→2034 declining free-allocation schedule
  reduces the CBAM obligation in parallel with EU ETS free-allocation withdrawal; the schedule is
  reproduced exactly.
- **Art. 9 (domestic carbon price)** — a carbon price already paid in the country of production is
  credited against the CBAM liability (`domestic_credit`).
- **NGFS / IEA WEO** — the forward transition-price paths for the transition-risk integration.

## 9 · Future Evolution

### 9.1 Evolution A — Live ETS pricing, year-varying grids, and Art. 9 rebate cap (analytics ladder: rung 2 → 3)

**What.** A substantial DB-backed CBAM engine: Specific Embedded Emissions (Art. 7), certificate
cost projection under the free-allocation phase-out (reproduced exactly, 2026 97.5% → 2034 0%),
compliance scoring, and a forward transition-exposure feed — already rung 2 with three ETS price
scenarios and NGFS/IEA transition paths. §7.5 names the deepening targets: ETS price *scenarios* are
illustrative trajectories not live auction prices, and the CBAM certificate price is modelled as
equal to the ETS price (which matches the regulation's weekly-average design but not real
settlement); grid emission factors are **static country seeds** (IEA-era), not year-varying; and
the calculator does not model the Art. 9 domestic-carbon-price **rebate cap** or verification-status
gating on default-value use. Evolution A wires live EU ETS auction prices, year-varying grid factors,
and the Art. 9 rebate cap.

**How.** A market-data ingester feeds real EU ETS weekly-average prices into the certificate-price
path (the scenarios remain as forward projections); grid emission factors become year-indexed from
IEA/ENTSO-E ingested series (the platform already wires ENTSO-E); `calculate_cbam_cost` adds the
Art. 9 rebate cap and gates default-value use on verification status. Rung 3: validate SEE outputs
against actual CBAM declarations and calibrate the transition-exposure trapezoidal approximation to
a discounted year-by-year sum.

**Prerequisites.** The engine is largely harness-passing (real-db across products/countries/
emissions) — the main work is data freshness, not endpoint repair; preserve the seeded reference
tables (product defaults, country risk) as the labelled fallback. **Acceptance:** the §7.4 worked
example (Indian steel supplier, ≈€8.14M net cost at 2030 51.5% free allocation) reproduces at legacy
prices; a live ETS price moves the certificate cost; a supplier in a country with a domestic carbon
price above the CBAM liability is correctly capped per Art. 9.

### 9.2 Evolution B — CBAM compliance analyst with tool-called cost projection (LLM tier 2)

**What.** A tool-calling analyst for importers and supply-chain teams: "calculate embedded emissions
for this steel product" (`/calculate-emissions`), "project our CBAM costs to 2034 under the ambitious
scenario" (`/project-costs`), "what's our portfolio CBAM exposure this year?" (`/portfolio-exposure`),
"score this supplier's compliance readiness" (`/supplier-risk/{id}`), and "record verified emissions"
(`/emissions`) — narrating the engine's real outputs including the free-allocation phase-out's
dominant cost effect and the Art. 4 default-value markup.

**How.** Tool schemas from the ~21 endpoints; read-only queries (dashboard, products, countries,
cost projection) auto-execute, while mutating actions (create supplier, record emissions, seed)
render a confirmation. The reference endpoints (ETS scenarios, free-allocation schedule, certificate
prices, country risk) are ideal RAG grounding for "what's the 2030 free-allocation percentage?"
questions. The no-fabrication validator checks every €, tCO₂ and score against tool output; the
copilot must flag when SEE uses default values (carrying the 30% markup) versus verified actuals.

**Prerequisites.** Evolution A's live pricing (so projected costs are current); Atlas + reference
corpus embedded (roadmap D3); RBAC so mutating actions run under the user's session. **Acceptance:**
every figure in an answer traces to an engine tool call; a cost projection matches `/project-costs`
exactly; a default-value-based SEE is flagged as carrying the Art. 4 markup, not presented as
verified; a "record emissions" action requires confirmation before writing.