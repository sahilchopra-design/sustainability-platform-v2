# Api::Portfolio_Reporting
**Module ID:** `api::portfolio_reporting` · **Route:** `/api` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/pcaf/financed-emissions` | `calculate_financed_emissions` | api/v1/routes/portfolio_reporting.py |
| POST | `/api/sfdr/pai/portfolio` | `sfdr_pai_portfolio` | api/v1/routes/portfolio_reporting.py |
| POST | `/api/ecl/portfolio-stress` | `ecl_portfolio_stress` | api/v1/routes/portfolio_reporting.py |
| GET | `/api/eu-taxonomy/portfolio-alignment` | `eu_taxonomy_portfolio_alignment` | api/v1/routes/portfolio_reporting.py |
| POST | `/api/paris-alignment/portfolio` | `paris_alignment_portfolio` | api/v1/routes/portfolio_reporting.py |
| GET | `/api/reports/sfdr-rts` | `sfdr_rts_report` | api/v1/routes/portfolio_reporting.py |
| POST | `/api/csrd/portfolio-materiality` | `portfolio_materiality` | api/v1/routes/portfolio_reporting.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `real-db`

**Database tables:** `CSRD` *(shared)*, `ESRS`, `ITR`, `MSCI` *(shared)*, `__future__` *(shared)*, `available`, `csrd_entity_registry` *(shared)*, `csrd_gap_tracker` *(shared)*, `csrd_kpi_values` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `holdings`, `numeric`, `pydantic` *(shared)*, `renewable` *(shared)*, `sector` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/eu-taxonomy/portfolio-alignment** — status `passed`, provenance ['real-db'], source tables: `csrd_entity_registry`, `csrd_kpi_values`
Output: `{'type': 'object', 'keys': ['portfolio_taxonomy_alignment_pct', 'portfolio_capex_alignment_pct', 'benchmark_pct', 'vs_benchmark_pp', 'by_entity', 'data_coverage_pct'], 'n_keys': 6}`

**GET /api/reports/sfdr-rts** — status `passed`, provenance ['real-db'], source tables: `csrd_entity_registry`, `csrd_gap_tracker`, `csrd_kpi_values`
Output: `{'type': 'object', 'keys': ['fund_id', 'reporting_year', 'generated_at', 'entity_count', 'sfdr_classification', 'outputs', 'filing_notes'], 'n_keys': 7}`

**POST /api/csrd/portfolio-materiality** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/ecl/portfolio-stress** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/paris-alignment/portfolio** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).