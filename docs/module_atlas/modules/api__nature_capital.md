# Api::Nature_Capital
**Module ID:** `api::nature_capital` · **Route:** `/api/v1/nature-capital` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/nature-capital/disclosure-score` | `disclosure_score_endpoint` | api/v1/routes/nature_capital.py |
| GET | `/api/v1/nature-capital/ref/ecosystem-types` | `get_ecosystem_types` | api/v1/routes/nature_capital.py |
| GET | `/api/v1/nature-capital/ref/seea-accounts` | `get_seea_accounts` | api/v1/routes/nature_capital.py |
| GET | `/api/v1/nature-capital/ref/encore-services` | `get_encore_services` | api/v1/routes/nature_capital.py |
| GET | `/api/v1/nature-capital/ref/tnfd-disclosures` | `get_tnfd_disclosures` | api/v1/routes/nature_capital.py |
| GET | `/api/v1/nature-capital/ref/biome-values` | `get_biome_values` | api/v1/routes/nature_capital.py |

### 2.3 Engine `nature_capital_engine` (services/nature_capital_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_bool_evidence_score` | items | Fraction of items marked True, scored ONLY over items with evidence. |
| `_weighted_present_mean` | pairs | Weighted mean over (value, weight) pairs, skipping None values. |
| `assess_natural_capital` | entity_id, asset_name, ecosystem_type, extent_ha, location_country, condition_score | Assess natural capital for an ecosystem asset. |
| `valuate_ecosystem_services` | entity_id, ecosystem_type, extent_ha, services_list, condition_multiplier | Valuate ecosystem services via benefit transfer from TEEB/IPBES biome values. |
| `calculate_dependency_score` | entity_id, sector, operations_description, revenue_usd, substitutability_score, operations_in_sensitive_areas | Calculate sector nature-dependency score from the ENCORE sector matrix. |
| `score_natural_capital_disclosure` | entity_id, reporting_standard, disclosure_evidence | Score natural-capital disclosure completeness from caller-supplied evidence. |
| `generate_nature_balance_sheet` | entity_id, assets, restoration_investment_usd | Generate a SEEA EA 2021 natural-capital balance sheet from reported assets. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `nature`, `primary`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/nature-capital/ref/biome-values** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['methodology', 'price_year', 'currency', 'caveat', 'biome_count', 'biomes'], 'n_keys': 6}`

**GET /api/v1/nature-capital/ref/ecosystem-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'ecosystem_count', 'ecosystems'], 'n_keys': 3}`

**GET /api/v1/nature-capital/ref/encore-services** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'version', 'total_services', 'categories'], 'n_keys': 4}`

**GET /api/v1/nature-capital/ref/seea-accounts** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'adopted_by_un', 'accounts_count', 'accounts'], 'n_keys': 4}`

**GET /api/v1/nature-capital/ref/tnfd-disclosures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'version', 'published', 'total_disclosures', 'pillars', 'all_disclosures', 'leap_approach'], 'n_keys': 7}`

## 5 · Intermediate Transformation Logic

**Engine `nature_capital_engine` — extracted transformation lines:**
```python
unit_value = (cat_unit_value / n_in_cat) * condition_multiplier
annual_flow = unit_value * extent_ha
dep_gt = (dep_score or 0)  # null-safe threshold comparisons below
pillars_status[p] = round(sum(vals) / len(vals), 3) if vals else None
extent_change = close_extent - open_extent
value_change = close_value - open_value
net_change = closing_stock_usd - opening_stock_usd
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).