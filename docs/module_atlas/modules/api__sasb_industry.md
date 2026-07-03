# Api::Sasb_Industry
**Module ID:** `api::sasb_industry` · **Route:** `/api/v1/sasb` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sasb/assess-industry` | `assess_industry` | api/v1/routes/sasb_industry.py |
| POST | `/api/v1/sasb/assess-materiality` | `assess_materiality` | api/v1/routes/sasb_industry.py |
| POST | `/api/v1/sasb/compare-peers` | `compare_peers` | api/v1/routes/sasb_industry.py |
| GET | `/api/v1/sasb/ref/sics-sectors` | `ref_sics_sectors` | api/v1/routes/sasb_industry.py |
| GET | `/api/v1/sasb/ref/industry-codes` | `ref_industry_codes` | api/v1/routes/sasb_industry.py |
| GET | `/api/v1/sasb/ref/materiality-map/{code}` | `ref_materiality_map` | api/v1/routes/sasb_industry.py |
| GET | `/api/v1/sasb/ref/issb-s2-mapping` | `ref_issb_s2_mapping` | api/v1/routes/sasb_industry.py |
| GET | `/api/v1/sasb/ref/gri-mapping` | `ref_gri_mapping` | api/v1/routes/sasb_industry.py |
| GET | `/api/v1/sasb/ref/esrs-mapping` | `ref_esrs_mapping` | api/v1/routes/sasb_industry.py |
| GET | `/api/v1/sasb/ref/sector-benchmarks` | `ref_sector_benchmarks` | api/v1/routes/sasb_industry.py |

### 2.3 Engine `sasb_industry_engine` (services/sasb_industry_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SASBIndustryEngine.assess_industry` | entity_name, sasb_industry_code, reporting_year, reported_metrics | Full SASB industry assessment for an entity. |
| `SASBIndustryEngine.assess_materiality` | entity_name, sasb_industry_code, reporting_year, entity_overrides | SASB materiality assessment for a specific industry. |
| `SASBIndustryEngine.compare_to_peers` | entity_name, sasb_industry_code, reporting_year, entity_metrics | Peer comparison for SASB metrics against sector medians. |
| `SASBIndustryEngine._get_industry_info` | code | Look up industry info from SICS registry. |
| `SASBIndustryEngine._get_sics_sector` | code | Get SICS sector label for an industry code. |
| `SASBIndustryEngine._compute_peer_summary` | code, reported, completeness | Quick peer summary for the industry assessment. |
| `SASBIndustryEngine.get_sics_sectors` |  | Full SICS sector and industry registry. |
| `SASBIndustryEngine.get_industry_codes` |  | Flat list of all SASB industry codes for UI dropdowns. |
| `SASBIndustryEngine.get_materiality_map` | sasb_industry_code | Materiality map for a specific industry. |
| `SASBIndustryEngine.get_issb_s2_mapping` |  | SASB-to-ISSB S2 cross-framework mapping. |
| `SASBIndustryEngine.get_gri_mapping` |  | SASB topic-to-GRI disclosure mapping. |
| `SASBIndustryEngine.get_esrs_mapping` |  | SASB topic-to-ESRS standard mapping. |
| `SASBIndustryEngine.get_sector_benchmarks` |  | Sector median benchmarks for peer comparison. |
| `asdict_safe` | obj | Convert dataclass or dict to dict. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sasb/ref/esrs-mapping** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['esrs_mapping'], 'n_keys': 1}`

**GET /api/v1/sasb/ref/gri-mapping** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['gri_mapping'], 'n_keys': 1}`

**GET /api/v1/sasb/ref/industry-codes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['industry_codes'], 'n_keys': 1}`

**GET /api/v1/sasb/ref/issb-s2-mapping** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['issb_s2_mapping'], 'n_keys': 1}`

**GET /api/v1/sasb/ref/materiality-map/{code}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sasb_industry_code', 'materiality_map'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic

**Engine `sasb_industry_engine` — extracted transformation lines:**
```python
ratio = val_num / bv
bench_pctl = min(max((1.0 - ratio) * 50 + 50, 0), 100)
completeness_pct = (reported_count / total_applicable * 100) if total_applicable > 0 else 0.0
materiality_coverage = (material_reported / len(material_topics) * 100) if material_topics else 0.0
avg_dqs = (dqs_sum / dqs_count) if dqs_count > 0 else 5.0
total_omitted_metrics=total_applicable - reported_count,
issb_alignment = (total_material / max(len(topics), 1)) * 100
pct_diff = ((bench_val - entity_val) / bench_val * 100) if bench_val != 0 else 0
pct_diff = ((entity_val - bench_val) / bench_val * 100) if bench_val != 0 else 0
total_compared = above + below + at_median
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).