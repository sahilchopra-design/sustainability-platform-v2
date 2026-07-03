# Api::Pcaf_Regulatory
**Module ID:** `api::pcaf_regulatory` · **Route:** `/api/v1` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pcaf/financed-emissions` | `calculate_financed_emissions` | api/v1/routes/pcaf_regulatory.py |
| POST | `/api/v1/sfdr/pai` | `calculate_sfdr_pai` | api/v1/routes/pcaf_regulatory.py |
| POST | `/api/v1/eu-taxonomy/alignment` | `assess_eu_taxonomy_alignment` | api/v1/routes/pcaf_regulatory.py |
| GET | `/api/v1/pcaf/portfolios` | `list_pcaf_portfolios` | api/v1/routes/pcaf_regulatory.py |
| GET | `/api/v1/pcaf/portfolios/{portfolio_id}` | `get_pcaf_portfolio` | api/v1/routes/pcaf_regulatory.py |
| GET | `/api/v1/sfdr/pai-disclosures` | `list_sfdr_disclosures` | api/v1/routes/pcaf_regulatory.py |
| GET | `/api/v1/sfdr/pai-disclosures/{disclosure_id}` | `get_sfdr_disclosure` | api/v1/routes/pcaf_regulatory.py |
| GET | `/api/v1/eu-taxonomy/assessments` | `list_eu_taxonomy_assessments` | api/v1/routes/pcaf_regulatory.py |
| GET | `/api/v1/eu-taxonomy/assessments/{assessment_id}` | `get_eu_taxonomy_assessment` | api/v1/routes/pcaf_regulatory.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `datetime` *(shared)*, `db` *(shared)*, `eu_taxonomy_activities`, `eu_taxonomy_assessments`, `exc` *(shared)*, `fastapi` *(shared)*, `mandatory`, `pcaf_investees` *(shared)*, `pcaf_portfolios` *(shared)*, `pydantic` *(shared)*, `sector` *(shared)*, `sfdr_pai_disclosures`, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/eu-taxonomy/assessments** — status `passed`, provenance ['real-db'], source tables: `eu_taxonomy_assessments`
Output: `{'type': 'array', 'len': 17, 'item0_keys': ['id', 'entity_name', 'reporting_year', 'taxonomy_eligible_turnover_pct', 'taxonomy_aligned_turnover_pct', 'taxonomy_eligible_capex_pct', 'taxonomy_aligned_capex_pct', 'status',`

**GET /api/v1/eu-taxonomy/assessments/{assessment_id}** — status `passed`, provenance ['real-db'], source tables: `eu_taxonomy_activities`, `eu_taxonomy_assessments`
Output: `{'type': 'object', 'keys': ['id', 'entity_id', 'entity_name', 'reporting_year', 'assessment_type', 'total_turnover_gbp', 'taxonomy_eligible_turnover_pct', 'taxonomy_aligned_turnover_pct', 'not_eligible_turnover_pct', 'to`

**GET /api/v1/pcaf/portfolios** — status `passed`, provenance ['real-db'], source tables: `pcaf_portfolios`
Output: `{'type': 'array', 'len': 2, 'item0_keys': ['id', 'entity_name', 'reporting_year', 'portfolio_type', 'total_financed_emissions_tco2e', 'waci_tco2e_per_mrevenue', 'carbon_footprint_tco2e_per_mgbp_invested', 'portfolio_temp`

**GET /api/v1/pcaf/portfolios/{portfolio_id}** — status `failed`, provenance ['db-empty'], source tables: `pcaf_portfolios`
Output: `None`

**GET /api/v1/sfdr/pai-disclosures** — status `passed`, provenance ['real-db'], source tables: `sfdr_pai_disclosures`
Output: `{'type': 'array', 'len': 14, 'item0_keys': ['id', 'entity_name', 'reporting_period_start', 'reporting_period_end', 'sfdr_article', 'pai_1_scope1_scope2_tco2e', 'pai_2_carbon_footprint', 'pai_4_fossil_fuel_exposure_pct', `

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).