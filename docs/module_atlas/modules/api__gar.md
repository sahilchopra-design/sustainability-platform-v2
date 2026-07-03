# Api::Gar
**Module ID:** `api::gar` · **Route:** `/api/v1/gar` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/gar/calculate` | `calculate_gar` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/objectives` | `get_objectives` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/nace-mapping` | `get_nace_mapping` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/excluded-types` | `get_excluded_types` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/kpi-types` | `get_kpi_types` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/alignment-classifications` | `get_alignment_classifications` | api/v1/routes/gar.py |
| POST | `/api/v1/gar/counterparty/score` | `score_counterparty` | api/v1/routes/gar.py |
| POST | `/api/v1/gar/counterparty/batch` | `score_counterparty_batch` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/counterparty/sector-risk` | `get_sector_risk` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/counterparty/rating-scale` | `get_rating_scale` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/counterparty/weights` | `get_scoring_weights` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/auto-calculate/{entity_id}` | `auto_calculate_gar` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/auto-calculate/by-lei/{lei}` | `auto_calculate_gar_by_lei` | api/v1/routes/gar.py |

### 2.3 Engine `counterparty_climate_scorer` (services/counterparty_climate_scorer.py)
| Function | Args | Purpose |
|---|---|---|
| `CounterpartyClimateScorer.score` | inp | Calculate composite climate score for a single counterparty. |
| `CounterpartyClimateScorer.score_batch` | inputs | Score multiple counterparties. |
| `CounterpartyClimateScorer._score_transition_risk` | inp, notes | Score transition risk.  All sub-scores are 0-100 (100 = best). |
| `CounterpartyClimateScorer._score_physical_risk` | inp, notes | Score physical risk. |
| `CounterpartyClimateScorer._score_alignment` | inp, notes | Score climate alignment. |
| `CounterpartyClimateScorer._score_data_quality` | inp, notes | Score data quality. |
| `CounterpartyClimateScorer._score_to_rating` | score | Map composite score (0-100, higher=better) to rating and label. |
| `CounterpartyClimateScorer.get_rating_scale` |  | Return the full rating scale. |
| `CounterpartyClimateScorer.get_sector_risk_levels` |  | Return sector-level transition risk classifications. |
| `CounterpartyClimateScorer.get_default_weights` |  | Return default scoring weights. |

### 2.3 Engine `gar_calculator` (services/gar_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `get_eligible_objectives` | nace_code | Return list of eligible EU Taxonomy environmental objectives for a NACE code. |
| `GARCalculator.calculate` | exposures, flow_exposures | Calculate Green Asset Ratio from a set of exposures. |
| `GARCalculator._resolve_classification` | exp | Resolve the taxonomy classification for an exposure. |
| `GARCalculator.get_taxonomy_objectives` |  | Return the 6 EU Taxonomy environmental objectives. |
| `GARCalculator.get_excluded_asset_types` |  | Return asset types excluded from the GAR denominator. |
| `GARCalculator.get_nace_taxonomy_map` |  | Return NACE code to taxonomy objective mapping. |
| `GARCalculator.get_kpi_types` |  | Return CRR2 ITS KPI types. |
| `GARCalculator.get_alignment_classifications` |  | Return possible alignment classification values. |

### 2.3 Engine `gar_db_service` (services/gar_db_service.py)
| Function | Args | Purpose |
|---|---|---|
| `GARDBService.calculate_gar_for_entity` | entity_id, reporting_year, persist | Auto-calculate GAR for an FI entity from DB data. |
| `GARDBService.calculate_gar_by_lei` | lei, reporting_year, persist | Auto-calculate GAR by LEI (resolves to fi_entities + regulatory_entities). |
| `GARDBService._get_entity` | conn, entity_id |  |
| `GARDBService._get_taxonomy_data` | conn, entity_name, year | Get taxonomy assessment + activities for entity (matched by name). |
| `GARDBService._get_loan_book` | conn, entity_id, year | Get loan book sector breakdown. |
| `GARDBService._build_exposures` | entity, assessment, activities, loan_book | Build GARExposure list from DB data. |
| `GARDBService._activity_to_exposure` | act, entity_name, assessment | Convert a single eu_taxonomy_activities row to GARExposure. |
| `GARDBService._sector_to_exposure` | sector_row, entity_name, assessment | Convert a loan book sector_breakdown JSONB entry to GARExposure. |
| `GARDBService._denormalized_loan_book_to_exposures` | loan_book, entity_name, assessment | Build exposures from denormalized fi_loan_books columns. |
| `GARDBService._persist_result` | conn, entity_id, reporting_year, result, assessment | Write GAR results to fi_eu_taxonomy_kpis. |
| `GARDBService._serialise` | result, entity, reporting_year, activity_count | Serialise GARResult + metadata for API response. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `DB` *(shared)*, `GAR`, `__future__` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/gar/alignment-classifications** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['classifications'], 'n_keys': 1}`

**GET /api/v1/gar/auto-calculate/by-lei/{lei}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/gar/auto-calculate/{entity_id}** — status `passed`, provenance ['db-empty'], source tables: `fi_entities`
Output: `{'type': 'object', 'keys': ['error'], 'n_keys': 1}`

**GET /api/v1/gar/counterparty/rating-scale** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['rating_scale'], 'n_keys': 1}`

**GET /api/v1/gar/counterparty/sector-risk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_risk_levels'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `counterparty_climate_scorer` — extracted transformation lines:**
```python
weighted = round(raw * w, 2)
weighted = round(raw * w, 2)
tax_pts = float(np.clip(inp.taxonomy_aligned_pct, 0, 100)) / 100.0 * 40.0
tp_pts = (tp - 1) / 4.0 * 40.0  # 1->0, 2->10, 3->20, 4->30, 5->40
weighted = round(raw * w, 2)
weighted = round(raw * w, 2)
```

**Engine `gar_calculator` — extracted transformation lines:**
```python
gar_ratio = aligned_assets / covered_assets if covered_assets > 0 else 0.0
gar_eligible_ratio = eligible_assets / covered_assets if covered_assets > 0 else 0.0
gar_flow = flow_aligned / flow_covered if flow_covered > 0 else 0.0
ne = max(covered_assets - e, 0.0)
aligned_pct=round(a / covered_assets * 100, 2) if covered_assets > 0 else 0.0,
eligible_pct=round(e / covered_assets * 100, 2) if covered_assets > 0 else 0.0,
gar_ratio=round(a / covered_assets, 6) if covered_assets > 0 else 0.0,
alignment_ratio=round(a / total, 4) if total > 0 else 0.0,
```

**Engine `gar_db_service` — extracted transformation lines:**
```python
ead = float(val) * 1_000_000  # MEUR → EUR
turnover_aligned=ead * aligned_pct if has_eligible_nace else 0,
turnover_eligible=ead * aligned_pct * 1.5 if has_eligible_nace else 0,
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).