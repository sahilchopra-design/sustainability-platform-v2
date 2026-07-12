# Api::Green_Premium_Tenant
**Module ID:** `api::green_premium_tenant` · **Route:** `/api/v1/green-premium` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/green-premium/assess` | `assess_green_premium` | api/v1/routes/green_premium_tenant.py |
| POST | `/api/v1/green-premium/tenant-esg` | `assess_tenant_esg` | api/v1/routes/green_premium_tenant.py |
| GET | `/api/v1/green-premium/reference-data` | `get_reference_data` | api/v1/routes/green_premium_tenant.py |

### 2.3 Engine `green_premium_engine` (services/green_premium_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `GreenPremiumEngine.assess_property` | prop | Assess green premium / brown discount for a single property. |
| `GreenPremiumEngine.assess_portfolio` | properties | Assess green premium / brown discount across a portfolio. |

### 2.3 Engine `tenant_esg_tracker` (services/tenant_esg_tracker.py)
| Function | Args | Purpose |
|---|---|---|
| `TenantESGTracker.assess_tenant` | tenant | Assess a single tenant's ESG profile. |
| `TenantESGTracker.assess_property` | prop | Assess tenant ESG at property level. |
| `TenantESGTracker.assess_portfolio` | properties | Assess tenant ESG across a portfolio. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/green-premium/reference-data** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['green_rent_premium_by_certification', 'epc_cap_rate_adjustment_bps', 'epc_rent_discount_pct', 'green_lease_clauses', 'green_lease_clause_weights', 'sector_carbon_benchmarks_tco2e_per_employee'], 'n_keys': 6}`

**POST /api/v1/green-premium/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/green-premium/tenant-esg** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `green_premium_engine` — extracted transformation lines:**
```python
prem_m2 = prop.base_rent_per_m2 * prem_pct / 100.0
annual = prem_m2 * prop.floor_area_m2
best_cert_m2 = prop.base_rent_per_m2 * best_cert_pct / 100.0
net_rent_pct = best_cert_pct + epc_rent_pct
green_adjusted_rent = prop.base_rent_per_m2 * (1 + net_rent_pct / 100.0)
adjusted_cap_rate = prop.base_cap_rate_pct + cap_bps / 100.0
green_adjusted_value = prop.noi / (adjusted_cap_rate / 100.0)
value_impact = green_adjusted_value - prop.market_value
value_impact_pct = (value_impact / prop.market_value * 100) if prop.market_value > 0 else 0.0
monthly_rent = prop.base_rent_per_m2 * prop.floor_area_m2 / 12.0
void_cost = void_months * monthly_rent
neutral_count = n - green_count - brown_count
total_base_rent = sum(p.base_rent_per_m2 * p.floor_area_m2 for p in properties)
rent_uplift = ((total_adj_rent - total_base_rent) / total_base_rent * 100
value_impact = total_adj_value - total_base_value
value_pct = (value_impact / total_base_value * 100) if total_base_value > 0 else 0.0
green_pct=round(green_count / n * 100, 1),
brown_pct=round(brown_count / n * 100, 1),
```

**Engine `tenant_esg_tracker` — extracted transformation lines:**
```python
total_carbon = tenant.scope1_tco2e + tenant.scope2_tco2e
carbon_per_emp = (total_carbon / tenant.headcount
carbon_per_m2 = (total_carbon / tenant.leased_area_m2
vs_bench = ((carbon_per_emp - benchmark) / benchmark * 100
carbon_score = max(0, min(100, 50 - vs_bench))  # Better than benchmark = higher
occ_rate = (occupied / prop.total_lettable_area_m2 * 100
gl_coverage = (gl_area / occupied * 100) if occupied > 0 else 0.0
avg_gl = (sum(p.green_lease_score * t.leased_area_m2
clause_cov[c.value] = round(area_with / occupied * 100 if occupied > 0 else 0.0, 1)
total_emissions = total_s1 + total_s2
carbon_int = total_emissions / occupied if occupied > 0 else 0.0
energy_pct = energy_rpt / occupied * 100 if occupied > 0 else 0.0
sbt_pct = sbt_area / occupied * 100 if occupied > 0 else 0.0
nz_pct = nz_area / occupied * 100 if occupied > 0 else 0.0
prop_score = (sum(p.tenant_esg_score * t.leased_area_m2
avg_occ = sum(r.occupancy_rate_pct for r in results) / n
gl_cov = (sum(r.green_lease_coverage_pct * r.occupied_area_m2 for r in results)
avg_gl = (sum(r.avg_green_lease_score * r.occupied_area_m2 for r in results)
carbon_int = total_emissions / total_occ if total_occ > 0 else 0.0
energy_pct = (sum(r.energy_data_reporting_pct * r.occupied_area_m2 for r in results)
sbt_pct = (sum(r.sbt_coverage_pct * r.occupied_area_m2 for r in results)
nz_pct = (sum(r.net_zero_coverage_pct * r.occupied_area_m2 for r in results)
port_score = (sum(r.property_tenant_esg_score * r.occupied_area_m2 for r in results)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded in
`backend/services/green_premium_engine.py`, `backend/services/tenant_esg_tracker.py`, and
`backend/api/v1/routes/green_premium_tenant.py`.)*

### 7.1 What the domain computes

Two real-estate ESG engines behind three endpoints:

**1. `GreenPremiumEngine` (`POST /assess`)** — green premium / brown discount per property and
portfolio:

```
best_cert_pct        = max over certifications (NOT additive — "avoid double counting")
net_rent_change_pct  = best_cert_pct + EPC_rent_adjustment_pct
adjusted_rent        = base_rent × (1 + net_rent_change_pct/100)
adjusted_cap_rate    = base_cap_rate + EPC_cap_bps/100
adjusted_value       = NOI / (adjusted_cap_rate/100)          (income capitalisation)
value_impact         = adjusted_value − market_value
annual_void_cost     = brown_vacancy_months × (base_rent × area / 12)
```

Green = EPC A+/A/B; brown = E/F/G; C/D neutral. Portfolio roll-up sums rents/values and reports
floor-area-weighted averages of certification premium, EPC adjustment, and cap-rate shift.

**2. `TenantESGTracker` (`POST /tenant-esg`)** — tenant → property → portfolio ESG cascade:

```
tenant composite = 0.30 × green_lease_score + 0.30 × carbon_score
                 + 0.20 × commitment_score + 0.20 × transparency_score
carbon_score     = clamp(50 − vs_benchmark_pct, 0, 100)     (at benchmark → 50)
commitment_score = 50·SBT + 50·NetZero ;  transparency = 100 if energy data reported
```

Property and portfolio levels aggregate by **leased area**: occupancy rate, green-lease coverage
(% of area with ≥ 1 clause), per-clause coverage, tenant scope 1+2 totals, tCO₂e/m², SBT and
net-zero area coverage, and area-weighted composite scores.
`GET /reference-data` exposes all rubric tables.

### 7.2 Parameterisation

**Certification rent premiums (%)** — code header cites Eichholtz/Kok/Quigley (2010), RICS 2023,
MSCI Green Premium Tracker, JLL 2024:

| Scheme | Top tier | … | Bottom tier |
|---|---|---|---|
| LEED | Platinum 12.0 | Gold 8.0 / Silver 4.0 | Certified 2.0 |
| BREEAM | Outstanding 10.0 | Excellent 7.0 / Very Good 4.0 / Good 2.0 | Pass 0.5 |
| NABERS | 6 Star 12.0 | 5 Star 8.0 / 4 Star 5.0 | 3 Star 2.0 |
| GRESB | 5 Star 6.0 | 4/3/2 Star 4/2/1 | 1 Star 0.0 |

**EPC adjustments:** cap-rate bps A+ −30, A −20, B −10, C 0, D +15, E +40, F +60, G +80;
rent discount D −2%, E −5%, F −8%, G −12% (A+…C 0%); brown vacancy months D 0.5, E 1, F 2, G 3.

**Green-lease clause weights** (sum = 1.0; scaled ×100 into the 0–100 lease score): energy data
sharing 0.25, fit-out standards 0.20, waste management 0.15, renewable energy 0.15, water
efficiency 0.10, transport plan 0.10, biodiversity 0.05 — a BBP Green Lease Toolkit-style clause
taxonomy with platform-assigned weights.

**Tenant sector benchmarks** (tCO₂e/employee/yr): manufacturing 25, healthcare 12, hospitality
10, retail 8, other 6, government 4.5, financial services 4, technology/education 3.5,
professional services 3 — uncited calibrations.

### 7.3 Calculation walkthrough

`/assess` maps each request property through `assess_property`: all certifications are priced
individually (for display) but only the **maximum** premium enters the rent adjustment; the EPC
discount then adds (so a LEED-Gold building with EPC E nets 8 − 5 = +3%). Value impact comes
solely from the cap-rate channel (NOI capitalisation), independent of the rent adjustment — the
two channels are **not** compounded. `/tenant-esg` runs the tenant cascade; note
`vs_benchmark_pct` is 0 when a tenant reports no emissions, which awards the neutral
carbon_score of 50 rather than penalising missing data.

### 7.4 Worked example — office, EPC F, BREEAM Excellent

Inputs: rent €300/m², 10,000 m², market value €80M, cap rate 5.0%, NOI €4.0M.

| Step | Computation | Result |
|---|---|---|
| Best cert premium | BREEAM Excellent | +7.0% |
| EPC F rent discount | table | −8.0% |
| Net rent change | 7 − 8 | **−1.0%** → adjusted rent €297/m² |
| Cap-rate shift | +60 bps → 5.60% | |
| Adjusted value | 4.0M / 0.056 | **€71.43M** |
| Value impact | 71.43 − 80.0 | **−€8.57M (−10.7%)** |
| Void cost | 2 months × (300×10,000/12) | **€500,000/yr** |

Tenant cross-check: a tech tenant (500 staff, 620 tCO₂e S1+S2 → 1.24 t/employee vs benchmark 3.5
→ −64.6%) with clauses {energy_data_sharing, fitout_standards} (lease score 45), SBT ✓, no NZ
pledge, reporting ✓: composite = 45×0.3 + min(100, 50+64.6)×0.3 + 50×0.2 + 100×0.2 =
13.5 + 30 + 10 + 20 = **73.5**.

### 7.5 Portfolio aggregation semantics

- Green premium roll-up weights financial totals by actual rents/values but *averages* the
  percentage metrics by **floor area** — a small high-premium asset moves the wavg little.
- Tenant portfolio metrics are occupied-area-weighted at every level, so vacant space dilutes
  nothing (it is excluded from the denominator); occupancy rate is reported separately and
  `avg_occupancy_rate_pct` is a simple (unweighted) mean across properties.

### 7.6 Data provenance & limitations

- No synthetic PRNG; fully deterministic over request payloads. All rubric tables are
  hand-calibrated point estimates anchored to the cited literature (the Eichholtz-Kok-Quigley
  study found ≈3% rent / ≈16% price premiums for certified US offices; the code's 2–12% ladder
  is a stylised generalisation, not a fitted model — the header's "hedonic value differential
  (regression-based)" is aspirational; no regression exists in code).
- Rent and value channels are disconnected: the adjusted value ignores the adjusted rent (NOI is
  a fixed input), so a G-rated building's −12% rent and 3-month void do not flow into the
  capitalised value — the cap-rate expansion is assumed to embody them.
- Only the best certification counts (conservative vs additive stacking); GRESB (an entity/fund
  benchmark) is treated as a building certification for rent purposes — a category blur.
- Tenant carbon_score gives missing-emissions tenants the benchmark-neutral 50; sector
  benchmarks per *employee* make low-headcount tenants look extreme either way.
- No country/market differentiation despite `country` fields; EPC semantics are UK/EU-style.

### 7.7 Framework alignment

- **RICS valuation guidance (2023)** — sustainability characteristics as explicit valuation
  inputs; the engine operationalises this as EPC-keyed cap-rate and rent adjustments plus void
  assumptions, the same levers RICS tells valuers to evidence.
- **EU EPBD / UK MEES trajectory** — the brown-discount ladder mirrors regulatory risk on E–G
  ratings (UK MEES already bars letting F/G commercial property — the 2–3 month void and −8/−12%
  rent assumptions encode that unlettability risk).
- **LEED / BREEAM / NABERS** — real certification tier ladders; premium magnitudes are
  literature-inspired calibrations (academic consensus: certified buildings earn single-digit
  rent premiums and low-double-digit value premiums).
- **GRESB Real Estate Assessment — Tenant Engagement** — the tenant tracker's green-lease
  clause coverage, energy-data sharing, and engagement KPIs map onto GRESB's tenant-engagement
  indicators (GRESB scores management + performance components ~30/70 for standing investments).
- **BBP Green Lease Toolkit (2024)** — source of the clause taxonomy (data sharing, fit-out,
  waste, renewables…); weights are the platform's own.
- **SBTi / net-zero commitments** — binary flags feeding the 20% commitment component; SBTi
  validation status is self-declared input here, not verified against the SBTi registry.

## 9 · Future Evolution

### 9.1 Evolution A — Market-calibrated greenium curves and EPC transition costing (analytics ladder: rung 2 → 3)

**What.** Two deterministic real-estate engines behind three endpoints:
`GreenPremiumEngine` (`POST /assess`) computes green premium / brown discount via income
capitalisation (`adjusted_value = NOI / (adjusted_cap_rate/100)`), and `TenantESGTracker`
(`POST /tenant-esg`) cascades tenant scope 1+2 carbon into a property/portfolio ESG
score. The premium magnitudes come entirely from static reference tables
(`green_rent_premium_by_certification`, `epc_cap_rate_adjustment_bps`,
`sector_carbon_benchmarks_tco2e_per_employee` — all returned by `/reference-data`).
Evolution A calibrates these against real market and EPC data and adds retrofit costing.

**How.** (1) Replace the static certification-premium and cap-rate-bps tables with
values fit from the platform's ingested UK EPC dataset (`uk_epc` module) and any
transacted rent/yield evidence, versioned with a provenance date. (2) Add a
retrofit-to-green module: cost of moving an EPC E/F/G asset to B, netted against the
avoided `annual_void_cost` and the value uplift the engine already computes — turning a
static premium into a decision (rung 3 with a payback metric). (3) The §5 note that
`best_cert_pct = max (NOT additive)` is a good anti-double-count guard — preserve and
bench-pin it. (4) Pin `/assess` and `/tenant-esg` in bench_quant.

**Prerequisites.** UK EPC data wired in (module exists); transacted rent/yield reference
for greenium calibration (thin — may remain literature-sourced with honest labelling).
**Acceptance:** `/reference-data` returns calibration date and source per premium row;
a retrofit scenario returns a payback period; bench pin reproduces `adjusted_value` and
portfolio roll-up.

### 9.2 Evolution B — Real-estate ESG advisory copilot (LLM tier 2)

**What.** A copilot on the green-premium page that answers "what's this asset worth if
we take it from EPC D to A?" by re-calling `/assess` with the amended certification and
narrating the value_impact and rent uplift, and "which tenants drag our portfolio carbon
score?" by reading the `/tenant-esg` cascade and citing per-tenant
`carbon_per_emp vs benchmark`.

**How.** Three endpoints (two POST engines + `/reference-data`) form the tool set;
`/reference-data`'s six keyed tables are the grounding corpus so the copilot explains
*where* a premium number comes from. What-ifs are cheap — both engines are stateless, so
the copilot mutates the property/tenant payload and re-runs. The income-capitalisation
identity from §7.1 lets it explain sensitivity ("value moves inversely with cap rate").

**Prerequisites.** Two POST endpoints trace as **failed** in §4.2 (validation/payload
issues under the harness) — these must be confirmed working before a copilot invokes
them, or every what-if errors. **Acceptance:** every value/rent figure quoted traces to
an `/assess` or `/tenant-esg` tool response; the copilot presents premiums as
model-based estimates citing the (currently uncalibrated) reference source, and refuses
to state a guaranteed valuation.