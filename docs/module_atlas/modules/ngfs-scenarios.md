# NGFS Scenarios
**Module ID:** `ngfs-scenarios` · **Route:** `/ngfs-scenarios` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides an interactive exploration and application tool for the full Network for Greening the Financial System scenario suite, covering macro-financial variables, carbon price paths, and physical risk indicators across all six scenarios.

> **Business value:** Delivers a comprehensive NGFS scenario workbench enabling financial institutions to explore, compare, and apply all six canonical climate scenarios to portfolio risk and regulatory stress testing workflows.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `CAT_COLORS`, `MiniBar`, `Stat`, `TABS`, `Tab1`, `Tab2`, `Tab3`, `Tab4`, `Tab5`, `Tab6`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `chartData` | `NGFS_PHASE4.map(s => ({` |
| `years` | `CARBON_PRICE_PATHS.map(r => r.year);` |
| `sorted` | `[...SECTOR_PD_UPLIFT].sort((a, b) => (b[activeSid] \|\| 0) - (a[activeSid] \|\| 0));` |
| `chartData` | `sorted.map(r => ({ sector: r.sector.length > 16 ? r.sector.slice(0, 14) + '…' : r.sector, uplift: r[activeSid] \|\| 0 }));` |
| `maxUplift` | `Math.max(...SECTOR_PD_UPLIFT.map(r => r[activeSid] \|\| 0));` |
| `avgUplift` | `Math.round(SECTOR_PD_UPLIFT.reduce((a, r) => a + (r[activeSid] \|\| 0), 0) / SECTOR_PD_UPLIFT.length);` |
| `spreadData` | `NGFS_PHASE4.map(s => ({ name: s.name.replace('Net Zero 2050', 'NZ2050').replace('Low Energy Demand', 'LED').replace('Below 2°C', 'B2C').replace('Delay` |
| `vals` | `selScens.map(s => Math.abs(s[key]));` |
| `coverageData` | `frameworks.map(f => ({ name: f.name.split(' ').slice(0, 2).join(' '), count: f.ngfsCount }));` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/ngfs-scenarios` | `list_scenarios` | api/v1/routes/ngfs_v2.py |
| GET | `/api/v1/ngfs-scenarios/phases` | `get_phases` | api/v1/routes/ngfs_v2.py |
| GET | `/api/v1/ngfs-scenarios/temperature-ranges` | `get_temperature_ranges` | api/v1/routes/ngfs_v2.py |
| GET | `/api/v1/ngfs-scenarios/filter` | `filter_scenarios` | api/v1/routes/ngfs_v2.py |
| POST | `/api/v1/ngfs-scenarios/search` | `search_scenarios` | api/v1/routes/ngfs_v2.py |
| GET | `/api/v1/ngfs-scenarios/{scenario_id}` | `get_scenario` | api/v1/routes/ngfs_v2.py |
| GET | `/api/v1/ngfs-scenarios/{scenario_id}/parameters` | `get_parameters` | api/v1/routes/ngfs_v2.py |
| GET | `/api/v1/ngfs-scenarios/{scenario_id}/time-series` | `get_time_series` | api/v1/routes/ngfs_v2.py |
| POST | `/api/v1/ngfs-scenarios/compare` | `compare_scenarios` | api/v1/routes/ngfs_v2.py |
| POST | `/api/v1/ngfs-scenarios/seed` | `seed_scenarios` | api/v1/routes/ngfs_v2.py |

### 2.3 Engine `ngfs_seeder` (services/ngfs_seeder.py)
| Function | Args | Purpose |
|---|---|---|
| `seed_ngfs_scenarios` | db | Seed all 24 NGFS scenarios with parameters and time series. |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NGFS Scenarios | — | NGFS 2023 | Current canonical set: Net Zero 2050, Below 2°C, Delayed Transition, Divergent Net Zero, Nationally Determined |
| Carbon Price Range (2030, across scenarios) | — | NGFS Phase IV 2023 | Span of modelled carbon prices across NGFS scenarios by 2030, illustrating the width of policy ambition uncert |
- **NGFS scenario data portal via IIASA, REMIND and MESSAGEix IAM outputs** → Variable path ingestion, scenario comparison computation, portfolio loss estimation → **Interactive scenario explorer, sector loss tables, regulatory stress test outputs**

## 5 · Intermediate Transformation Logic
**Methodology:** Scenario Divergence Index
**Headline formula:** `SDI = Σ |Variableₜ(ScenarioA) – Variableₜ(ScenarioB)| / Baselineₜ`
**Standards:** ['NGFS Phase IV Technical Documentation 2023']

**Engine `ngfs_seeder` — extracted transformation lines:**
```python
frac = (year - prev_y) / (next_y - prev_y)
val = ts_data[str(prev_y)] + frac * (ts_data[str(next_y)] - ts_data[str(prev_y)])
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **63** other module(s).

| Connected module | Shared via |
|---|---|
| `carbon-aware-allocation` | table:datetime, table:db, table:sqlalchemy |
| `carbon-capture-finance` | table:datetime, table:db, table:sqlalchemy |
| `carbon-credit-audit-trail` | table:datetime, table:db, table:sqlalchemy |
| `carbon-wallet` | table:datetime, table:db, table:sqlalchemy |
| `insurance-climate-hub` | table:datetime, table:db, table:sqlalchemy |
| `insurance-transition` | table:datetime, table:db, table:sqlalchemy |
| `supply-chain-map` | table:datetime, table:db, table:sqlalchemy |
| `carbon-adjusted-valuation` | table:datetime, table:db, table:sqlalchemy |
| `supply-chain-network-viz` | table:datetime, table:db, table:sqlalchemy |
| `carbon-storage-geology` | table:datetime, table:db, table:sqlalchemy |