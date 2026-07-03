# Api::Dme_Factor_Registry
**Module ID:** `api::dme_factor_registry` · **Route:** `/api/v1/dme-factor-registry` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/dme-factor-registry/factors` | `list_factors` | api/v1/routes/dme_factor_registry.py |
| GET | `/api/v1/dme-factor-registry/factors/{factor_id}` | `get_factor` | api/v1/routes/dme_factor_registry.py |
| POST | `/api/v1/dme-factor-registry/search` | `search_factors` | api/v1/routes/dme_factor_registry.py |
| GET | `/api/v1/dme-factor-registry/stats` | `get_stats` | api/v1/routes/dme_factor_registry.py |
| GET | `/api/v1/dme-factor-registry/overlay-mapping` | `get_overlay_mapping` | api/v1/routes/dme_factor_registry.py |
| POST | `/api/v1/dme-factor-registry/compare` | `compare_factor` | api/v1/routes/dme_factor_registry.py |
| GET | `/api/v1/dme-factor-registry/ref/pillars` | `get_pillars` | api/v1/routes/dme_factor_registry.py |
| GET | `/api/v1/dme-factor-registry/ref/dme-topics` | `get_dme_topics` | api/v1/routes/dme_factor_registry.py |

### 2.3 Engine `dme_factor_registry` (services/dme_factor_registry.py)
| Function | Args | Purpose |
|---|---|---|
| `FactorRegistryEngine._build_registry` |  |  |
| `FactorRegistryEngine.get_all_factors` | limit, offset |  |
| `FactorRegistryEngine.get_factor` | factor_id |  |
| `FactorRegistryEngine.search_factors` | req |  |
| `FactorRegistryEngine.get_stats` |  |  |
| `FactorRegistryEngine.get_overlay_mapping` |  | Return the 31 overlay→factor mappings. |
| `FactorRegistryEngine.get_pillars` |  |  |
| `FactorRegistryEngine.get_dme_topics` |  | Return base topic list per pillar (209 topics). |
| `FactorRegistryEngine.compare_factor` | dme_factor_id | Find the closest overlay registry match for a DME factor, |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `services` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/dme-factor-registry/factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 50, 'item0_keys': ['factor_id', 'factor_name', 'pillar', 'topic', 'sub_topic', 'materiality_dimension', 'source', 'data_frequency', 'velocity_method', 'ewma_alpha', 'signal_decay', 'alert_watch',`

**GET /api/v1/dme-factor-registry/factors/{factor_id}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['error'], 'n_keys': 1}`

**GET /api/v1/dme-factor-registry/overlay-mapping** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 31, 'item0_keys': ['factor_id', 'factor_name', 'pillar', 'topic', 'materiality_dimension', 'source', 'overlay_registry_key', 'data_frequency', 'velocity_method', 'unit', 'signal_decay', 'regulato`

**GET /api/v1/dme-factor-registry/ref/dme-topics** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['environmental', 'social', 'governance', 'technology', 'sectoralStructure'], 'n_keys': 5}`

**GET /api/v1/dme-factor-registry/ref/pillars** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pillars', 'materiality_dimensions', 'velocity_methods', 'data_frequencies', 'signal_decay_categories', 'sources'], 'n_keys': 6}`

## 5 · Intermediate Transformation Logic

**Engine `dme_factor_registry` — extracted transformation lines:**
```python
page = results[req.offset:req.offset + req.limit]
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).