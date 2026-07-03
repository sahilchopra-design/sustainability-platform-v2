# Api::Blue_Economy
**Module ID:** `api::blue_economy` · **Route:** `/api/v1/blue-economy` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/blue-economy/screen-bond` | `screen_bond_endpoint` | api/v1/routes/blue_economy.py |
| POST | `/api/v1/blue-economy/blue-carbon` | `blue_carbon_endpoint` | api/v1/routes/blue_economy.py |
| POST | `/api/v1/blue-economy/bbnj-compliance` | `bbnj_compliance_endpoint` | api/v1/routes/blue_economy.py |
| POST | `/api/v1/blue-economy/ocean-acidification` | `ocean_acidification_endpoint` | api/v1/routes/blue_economy.py |
| POST | `/api/v1/blue-economy/ocean-portfolio` | `ocean_portfolio_endpoint` | api/v1/routes/blue_economy.py |
| POST | `/api/v1/blue-economy/sof-assessment` | `sof_assessment_endpoint` | api/v1/routes/blue_economy.py |
| GET | `/api/v1/blue-economy/ref/ecosystems` | `ref_ecosystems` | api/v1/routes/blue_economy.py |
| GET | `/api/v1/blue-economy/ref/use-of-proceeds` | `ref_use_of_proceeds` | api/v1/routes/blue_economy.py |
| GET | `/api/v1/blue-economy/ref/bbnj-articles` | `ref_bbnj_articles` | api/v1/routes/blue_economy.py |
| GET | `/api/v1/blue-economy/ref/sof-pillars` | `ref_sof_pillars` | api/v1/routes/blue_economy.py |
| GET | `/api/v1/blue-economy/ref/ocean-markets` | `ref_ocean_markets` | api/v1/routes/blue_economy.py |

### 2.3 Engine `blue_economy_engine` (services/blue_economy_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `screen_blue_bond` | bond_data | Screen a bond against ICMA Blue Bond Principles 2023 and SOF framework. |
| `assess_blue_carbon` | project_data | Calculate blue carbon sequestration, additionality, permanence, and credit economics. |
| `assess_bbnj_compliance` | entity_data | Assess compliance with the High Seas Treaty BBNJ 2023 across 5 key article areas. |
| `assess_ocean_acidification_risk` | portfolio_data | Assess portfolio exposure to ocean acidification under IPCC AR6 RCP scenarios. |
| `aggregate_ocean_portfolio` | portfolio_data | Aggregate portfolio-level SOF score, blue bond allocation, and ocean risk metrics. |
| `assess_sof_alignment` | entity_data | Comprehensive UNEP-FI Sustainable Ocean Finance alignment assessment. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `force` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/blue-economy/ref/bbnj-articles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['articles', 'treaty_name', 'adoption_date', 'signatory_threshold_for_entry_into_force', 'note'], 'n_keys': 5}`

**GET /api/v1/blue-economy/ref/ecosystems** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ecosystems', 'total_sequestration_potential_bn_tco2', 'source', 'note'], 'n_keys': 4}`

**GET /api/v1/blue-economy/ref/ocean-markets** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['global_ocean_economy_gdp_bn_usd', 'ocean_economy_potential_2030_bn_usd', 'sdg14_annual_financing_gap_bn_usd', 'blue_bond_issuance_2023_bn_usd', 'blue_carbon_market_2023_mn_usd', 'offshore_win`

**GET /api/v1/blue-economy/ref/sof-pillars** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pillars', 'framework', 'total_pillars', 'sdg_alignment'], 'n_keys': 4}`

**GET /api/v1/blue-economy/ref/use-of-proceeds** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['categories', 'standard', 'total_categories', 'external_review_required_threshold_usd'], 'n_keys': 4}`

## 5 · Intermediate Transformation Logic

**Engine `blue_economy_engine` — extracted transformation lines:**
```python
sof_pillar_coverage = {k: round(v / total_pillar, 3) for k, v in sof_pillar_coverage.items()}
use_of_proceeds_breakdown = {k: round(v / total_alloc * 100, 1) for k, v in use_of_proceeds_breakdown.items()}
total_annual = area_ha * seq_rate
total_lifetime = total_annual * lifetime_years
permanence_score = round((eco_stability * 0.5 + float(governance_score) * 0.5), 4)
risk_buffer_pct = round(max(10.0, min(30.0, (1 - permanence_score) * 60)), 1)
net_sequestration = total_annual * (1 - risk_buffer_pct / 100)
carbon_credit_value_usd = round(net_sequestration * float(carbon_price_usd_tco2), 2)
net_revenue = round(carbon_credit_value_usd - (monitoring_cost or 0.0), 2)
key=lambda x: x[1] * x[2]
fisheries_exposure = total_ocean_economy_exposure * fisheries_pct
coral_reef_exposure = total_ocean_economy_exposure * coral_reef_pct
aquaculture_exposure = total_ocean_economy_exposure * aquaculture_pct
coral_at_risk = coral_reef_exposure * coral_mortality_factor
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).