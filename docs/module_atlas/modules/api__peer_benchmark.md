# Api::Peer_Benchmark
**Module ID:** `api::peer_benchmark` · **Route:** `/api/v1/peer-benchmark` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/peer-benchmark/institutions` | `list_institutions` | api/v1/routes/peer_benchmark.py |
| GET | `/api/v1/peer-benchmark/institution/{slug}` | `get_institution` | api/v1/routes/peer_benchmark.py |
| GET | `/api/v1/peer-benchmark/institution/{slug}/top-gaps` | `get_top_gaps` | api/v1/routes/peer_benchmark.py |
| GET | `/api/v1/peer-benchmark/comparison` | `get_comparison` | api/v1/routes/peer_benchmark.py |
| GET | `/api/v1/peer-benchmark/regional-averages` | `get_regional_averages` | api/v1/routes/peer_benchmark.py |
| GET | `/api/v1/peer-benchmark/framework-coverage` | `get_framework_coverage` | api/v1/routes/peer_benchmark.py |
| GET | `/api/v1/peer-benchmark/categories` | `get_categories` | api/v1/routes/peer_benchmark.py |
| GET | `/api/v1/peer-benchmark/processed-reports` | `get_processed_reports` | api/v1/routes/peer_benchmark.py |
| POST | `/api/v1/peer-benchmark/compute` | `compute_benchmarks` | api/v1/routes/peer_benchmark.py |
| GET | `/api/v1/peer-benchmark/saved-benchmarks` | `get_saved_benchmarks` | api/v1/routes/peer_benchmark.py |

### 2.3 Engine `peer_benchmark_engine` (services/peer_benchmark_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `score_to_rag` | score |  |
| `PeerBenchmarkEngine._weighted_score` | scores |  |
| `PeerBenchmarkEngine._group_scores` | scores |  |
| `PeerBenchmarkEngine.get_all_institutions` |  |  |
| `PeerBenchmarkEngine.get_institution` | slug |  |
| `PeerBenchmarkEngine.get_comparison_table` | slugs, region, institution_type |  |
| `PeerBenchmarkEngine.get_heatmap` | slugs |  |
| `PeerBenchmarkEngine.get_regional_averages` |  |  |
| `PeerBenchmarkEngine.get_framework_coverage` |  | Which institutions have which mandatory / voluntary frameworks. |
| `PeerBenchmarkEngine.get_top_gaps` | slug, top_n |  |
| `PeerBenchmarkEngine._to_summary` | inst |  |
| `PeerBenchmarkEngine._to_comparison_row` | inst |  |
| `PeerBenchmarkEngine._to_detail` | inst |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `DB` *(shared)*, `SET` *(shared)*, `__future__` *(shared)*, `csrd_entity_registry` *(shared)*, `csrd_kpi_values` *(shared)*, `csrd_peer_benchmarks`, `csrd_report_uploads`, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `processed` *(shared)*, `reports`, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/peer-benchmark/categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['categories'], 'n_keys': 1}`

**GET /api/v1/peer-benchmark/comparison** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['comparison'], 'n_keys': 1}`

**GET /api/v1/peer-benchmark/framework-coverage** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework_coverage'], 'n_keys': 1}`

**GET /api/v1/peer-benchmark/heatmap** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['rows', 'categories'], 'n_keys': 2}`

**GET /api/v1/peer-benchmark/institution/{slug}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `peer_benchmark_engine` — extracted transformation lines:**
```python
avg_scores[cat_key] = round(sum(vals) / len(vals), 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `peer_benchmark_engine` (used by 1 modules)

| Connected module | Shared via |
|---|---|
| `api::company_profiles` | engine:peer_benchmark_engine |