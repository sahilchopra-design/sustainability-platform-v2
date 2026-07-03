# Api::Fund_Management
**Module ID:** `api::fund_management` · **Route:** `/api/v1/fund-management` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/fund-management/analyse` | `analyse_fund` | api/v1/routes/fund_management.py |
| GET | `/api/v1/fund-management/sfdr-summary` | `get_sfdr_summary` | api/v1/routes/fund_management.py |

### 2.3 Engine `fund_structure_engine` (services/fund_structure_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `FundStructureEngine.analyse_fund` | fund | Run full fund analytics. |
| `FundStructureEngine._calculate_active_share` | holdings, bench | Active share = 0.5 * sum(/w_p - w_b/) across all securities. |
| `FundStructureEngine._estimate_tracking_error` | holdings, bench | Simplified tracking error estimate based on active weights. |
| `FundStructureEngine._sector_allocation` | holdings, bench | Compute sector-level allocation and carbon comparison. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/fund-management/sfdr-summary** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['classifications', 'esg_strategies'], 'n_keys': 2}`

**POST /api/v1/fund-management/analyse** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `fund_structure_engine` — extracted transformation lines:**
```python
h.weight_pct = h.weight_pct / total_weight * 100.0
waci = sum(h.weight_pct / 100.0 * h.carbon_intensity for h in holdings)
carbon_fp = total_fe / aum * 1_000_000 if aum > 0 else 0.0
avg_esg = sum(h.weight_pct / 100.0 * h.esg_score for h in holdings)
tax_aligned = sum(h.weight_pct / 100.0 * h.taxonomy_aligned_pct for h in holdings)
bench_waci = sum(b.weight_pct / 100.0 * b.carbon_intensity for b in bench) if bench else 0.0
waci_vs = ((waci - bench_waci) / bench_waci * 100) if bench_waci > 0 else 0.0
bench_esg = sum(b.weight_pct / 100.0 * b.esg_score for b in bench) if bench else 0.0
esg_delta = avg_esg - bench_esg
dpi = total_dist / total_called if total_called > 0 else 0.0
tvpi = (total_dist + total_nav_inv) / total_called if total_called > 0 else 0.0
active_weight_pct=round(pw - bw, 2),
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).