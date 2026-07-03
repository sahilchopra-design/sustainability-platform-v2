# Api::Disclosure_Trends
**Module ID:** `api::disclosure_trends` · **Route:** `/api/v1/disclosure-trends` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/disclosure-trends/completeness` | `assess_completeness` | api/v1/routes/disclosure_trends.py |
| POST | `/api/v1/disclosure-trends/trends` | `analyse_trends` | api/v1/routes/disclosure_trends.py |
| GET | `/api/v1/disclosure-trends/ref/framework-requirements` | `ref_framework_requirements` | api/v1/routes/disclosure_trends.py |
| GET | `/api/v1/disclosure-trends/ref/framework-list` | `ref_framework_list` | api/v1/routes/disclosure_trends.py |
| GET | `/api/v1/disclosure-trends/ref/kpi-definitions` | `ref_kpi_definitions` | api/v1/routes/disclosure_trends.py |
| GET | `/api/v1/disclosure-trends/ref/peer-benchmarks` | `ref_peer_benchmarks` | api/v1/routes/disclosure_trends.py |
| GET | `/api/v1/disclosure-trends/ref/sectors` | `ref_sectors` | api/v1/routes/disclosure_trends.py |

### 2.3 Engine `disclosure_completeness` (services/disclosure_completeness.py)
| Function | Args | Purpose |
|---|---|---|
| `DisclosureCompletenessEngine.assess` | entity_name, provided_dps, frameworks, reporting_year | Assess disclosure completeness. |
| `DisclosureCompletenessEngine.get_framework_requirements` |  |  |
| `DisclosureCompletenessEngine.get_framework_list` |  |  |

### 2.3 Engine `trend_analytics` (services/trend_analytics.py)
| Function | Args | Purpose |
|---|---|---|
| `TrendAnalyticsEngine.analyse` | entity_name, kpi_series, sector, targets | Analyse multi-year KPI trends. |
| `TrendAnalyticsEngine.get_kpi_definitions` |  |  |
| `TrendAnalyticsEngine.get_peer_benchmarks` |  |  |
| `TrendAnalyticsEngine.get_sectors` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/disclosure-trends/ref/framework-list** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 9, 'item0_keys': ['id', 'framework', 'standard', 'total_dps']}`

**GET /api/v1/disclosure-trends/ref/framework-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ESRS_E1', 'ESRS_E2', 'ESRS_E3', 'ESRS_E4', 'ESRS_E5', 'ISSB_S1', 'ISSB_S2', 'TCFD', 'SFDR_PAI'], 'n_keys': 9}`

**GET /api/v1/disclosure-trends/ref/kpi-definitions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scope1_tco2e', 'scope2_tco2e', 'scope3_tco2e', 'total_ghg_tco2e', 'ghg_intensity_revenue', 'energy_consumption_mwh', 'renewable_share_pct', 'water_consumption_m3', 'waste_total_tonnes', 'wast`

**GET /api/v1/disclosure-trends/ref/peer-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['financial_institutions', 'energy', 'manufacturing', 'technology', 'real_estate'], 'n_keys': 5}`

**GET /api/v1/disclosure-trends/ref/sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 5, 'item0_keys': None}`

## 5 · Intermediate Transformation Logic

**Engine `disclosure_completeness` — extracted transformation lines:**
```python
pct = (provided_count / total * 100) if total > 0 else 0
overall_pct = (total_prov / total_req * 100) if total_req > 0 else 0
```

**Engine `trend_analytics` — extracted transformation lines:**
```python
latest = data_pts[-1].value
prev = data_pts[i - 1].value
change_abs = curr - prev
change_pct = ((curr - prev) / abs(prev) * 100) if prev != 0 else 0
years_span = data_pts[-1].year - data_pts[0].year
cagr = ((latest / earliest) ** (1 / years_span) - 1) * 100
vs_peer = round((latest - peer_val) / peer_val * 100, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).