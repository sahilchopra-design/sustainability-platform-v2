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
Output: `{'type': 'object', 'keys': ['green_rent_premium_by_certification', 'epc_cap_rate_adjustment_bps', 'epc_rent_discount_pct', 'green_lease_clauses', 'green_lease_clause_weights', 'sector_carbon_benchmarks_tco2e_per_employee`

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
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).