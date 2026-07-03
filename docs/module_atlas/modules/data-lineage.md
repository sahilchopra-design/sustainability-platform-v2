# Data Lineage Tracker
**Module ID:** `data-lineage` · **Route:** `/data-lineage` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides end-to-end data lineage mapping from raw source data through transformation pipelines to disclosed sustainability metrics, enabling full traceability for regulatory assurance, audit purposes, and data quality root-cause analysis. Visualises lineage as an interactive directed acyclic graph.

> **Business value:** Enables sustainability teams and external assurers to trace any disclosed metric back to its original source, fulfilling CSRD limited assurance requirements and providing the audit trail needed for regulatory inspection and data quality root-cause investigations.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `Card`, `DATA_LINEAGE_FIELDS`, `FX_RATES`, `IMPACT_MAP`, `LS_AUDIT`, `LS_PORTFOLIO`, `MANUAL_OVERRIDES`, `PRIORITY_MATRIX`, `SOURCE_NAMES`, `SortIcon`, `TRANSFORMATIONS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `baseDate` | `new Date('2025-03-25T12:00:00Z');` |
| `field` | `fields[Math.floor(sr(_sc++)*fields.length)];` |
| `prevVal` | `(sr(_sc++)*80+10).toFixed(1);` |
| `newVal` | `(parseFloat(prevVal) + (sr(_sc++)-0.5)*20).toFixed(1);` |
| `categories` | `useMemo(() => ['All', ...new Set(DATA_LINEAGE_FIELDS.map(f => f.category))], []);` |
| `avgQuality` | `Math.round(DATA_LINEAGE_FIELDS.reduce((s,f) => s + f.quality, 0) / DATA_LINEAGE_FIELDS.length);` |
| `avgAge` | `Math.round(DATA_LINEAGE_FIELDS.reduce((s,f) => s + f.age_hours, 0) / DATA_LINEAGE_FIELDS.length);` |
| `lineageCoverage` | `Math.round(DATA_LINEAGE_FIELDS.filter(f => f.sources.length > 0 && f.downstream.length > 0).length / DATA_LINEAGE_FIELDS.length * 100);` |
| `freshnessData` | `useMemo(() => DATA_LINEAGE_FIELDS.map(f => ({ field:f.label.length > 14 ? f.label.slice(0,12)+'...' : f.label, hours:f.age_hours, fullLabel:f.label })` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => { const v = r[k]; return `"${Array.isArray(v) ? v.join('; ') : (v ?? '')}"`; }).join(','))].join('\n')` |
| `blob` | `new Blob([csv], { type:'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });` |
| `catAvgQuality` | `Math.round(catFields.reduce((s,f) => s + f.quality, 0) / catFields.length);` |
| `catAvgAge` | `Math.round(catFields.reduce((s,f) => s + f.age_hours, 0) / catFields.length);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/lineage/trace` | `trace_lineage` | api/v1/routes/data_lineage.py |
| GET | `/api/v1/lineage/gaps` | `find_gaps` | api/v1/routes/data_lineage.py |
| GET | `/api/v1/lineage/module-graph` | `module_graph` | api/v1/routes/data_lineage.py |
| POST | `/api/v1/lineage/quality` | `propagate_quality` | api/v1/routes/data_lineage.py |
| GET | `/api/v1/lineage/signatures` | `module_signatures` | api/v1/routes/data_lineage.py |
| GET | `/api/v1/lineage/dependencies` | `module_dependencies` | api/v1/routes/data_lineage.py |
| GET | `/api/v1/lineage/reference-data` | `reference_data` | api/v1/routes/data_lineage.py |
| GET | `/api/v1/lineage/platform-health` | `platform_health` | api/v1/routes/data_lineage.py |
| GET | `/api/v1/lineage/reference-data-gaps` | `reference_data_gaps` | api/v1/routes/data_lineage.py |
| GET | `/api/v1/lineage/bridge-health` | `bridge_health` | api/v1/routes/data_lineage.py |
| POST | `/api/v1/lineage/impact-analysis` | `impact_analysis` | api/v1/routes/data_lineage.py |
| POST | `/api/v1/lineage/dqs-quality` | `dqs_quality` | api/v1/routes/data_lineage.py |
| GET | `/api/v1/lineage/regulatory-lineage/{framework}` | `regulatory_lineage` | api/v1/routes/data_lineage.py |
| GET | `/api/v1/lineage/module-coverage` | `module_coverage` | api/v1/routes/data_lineage.py |
| GET | `/api/v1/lineage/reference-data-inventory` | `reference_data_inventory` | api/v1/routes/data_lineage.py |

### 2.3 Engine `data_lineage_service` (services/data_lineage_service.py)
| Function | Args | Purpose |
|---|---|---|
| `DataLineageEngine._build_graph` |  | Build adjacency lists from dependency edges. |
| `DataLineageEngine.trace_lineage` | target_module, entity_id, module_quality | Trace the full upstream lineage for a target module. |
| `DataLineageEngine.find_gaps` |  | Scan all dependency edges for lineage gaps across the platform. |
| `DataLineageEngine.get_module_graph` |  | Build the full module dependency graph. |
| `DataLineageEngine.propagate_quality` | entity_id, module_quality | Propagate data quality scores through the dependency graph. |
| `DataLineageEngine.get_all_reference_data` |  | Get all reference data dependencies across all modules. |
| `DataLineageEngine.get_module_signatures` |  | Get all module I/O signatures. |
| `DataLineageEngine.get_dependencies` |  | Get all module dependency edges. |
| `DataLineageEngine._quality_label` | score |  |
| `_register_climate_risk_modules` | service_instance | Register all Climate Risk Engine modules in the DataLineageService |
| `_register_e_series_modules` | service_instance | Register E6–E10 engine-series modules + E8 IORP II in data lineage. |
| `_register_e11_modules` | service_instance | Register E11 UK SDR engine in the data lineage graph. |
| `_register_e12_e15_modules` | service_instance | Register E12-E15 engines in the data lineage graph. |
| `_register_e16_e19_modules` | service_instance | Register E16-E19 engines in the data lineage graph. |
| `_register_e20_e23_modules` | service_instance | Register E20-E23 engines in the data lineage graph. |
| `_register_e24_e27_modules` | service_instance | Register E24-E27 engines in the data lineage graph. |
| `_register_e28_e31_modules` | service_instance | Register E28-E31 engines in the data lineage graph. |
| `_register_e32_e35_modules` | service_instance | Register E32-E35 engines in the data lineage graph. |

### 2.3 Engine `lineage_orchestrator` (services/lineage_orchestrator.py)
| Function | Args | Purpose |
|---|---|---|
| `LineageOrchestrator.engine` |  | Access the underlying DataLineageEngine. |
| `LineageOrchestrator.analyse_reference_data_gaps` |  | Analyse all reference data dependencies across the platform. |
| `LineageOrchestrator.check_bridge_health` |  | Verify all cross-module bridges are correctly wired. |
| `LineageOrchestrator.analyse_module_impact` | module_id, degradation_factor | What-if analysis: what happens if a module's quality degrades? |
| `LineageOrchestrator.get_platform_health` |  | Comprehensive platform-wide lineage health dashboard. |
| `LineageOrchestrator.propagate_dqs_quality` | entity_id, module_dqs | Propagate quality using PCAF Data Quality Score (DQS 1-5). |
| `LineageOrchestrator.trace_regulatory_lineage` | disclosure_framework | Trace the complete data lineage chain feeding a regulatory disclosure. |
| `LineageOrchestrator.get_module_coverage` |  | Summary of all registered modules grouped by category. |
| `LineageOrchestrator._emit_audit` | event_type, module_id, entity_id, details, severity | Emit a lineage audit event (in-memory; can be wired to audit_log table). |
| `LineageOrchestrator.get_audit_events` | limit, severity | Retrieve lineage audit events. |
| `LineageOrchestrator.get_reference_data_inventory` |  | Complete inventory of all reference data: embedded + missing + partial. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `DATA_LINEAGE_FIELDS`, `FX_RATES`, `MANUAL_OVERRIDES`, `SOURCE_NAMES`, `TRANSFORMATIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Lineage Coverage | — | Lineage tracker | Proportion of disclosed metrics with complete documented lineage from source to output |
| Lineage Hops (avg) | — | DAG analysis | Average number of transformation steps between raw source and disclosed metric |
| Undocumented Transformations | — | Gap analysis | Number of transformation steps lacking documented logic, requiring steward annotation |
| Cross-System Lineage Links | — | Integration mapping | Number of system-to-system data flow links documented in the lineage graph |
| Assurance-Ready Metrics | — | External assurance criteria | Proportion of key disclosed metrics meeting full lineage documentation for limited assurance |
- **Source system metadata and API logs** → Extract record identifiers and ingestion timestamps, link to source systems → **Source node registry in lineage graph**
- **ETL pipeline transformation logs** → Document transformation logic, intermediate outputs, and quality checks per step → **Transformation node documentation**
- **Disclosure metric register** → Map each metric to contributing pipeline outputs and aggregation logic → **Full source-to-disclosure lineage chain**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/lineage/audit-events** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/lineage/bridge-health** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_bridges', 'wired_bridges', 'broken_bridges', 'total_field_mappings', 'bridges', 'recommendations'], 'n_keys': 6}`

**GET /api/v1/lineage/dependencies** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 228, 'item0_keys': ['source', 'target', 'field_map', 'description']}`

**GET /api/v1/lineage/gaps** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_edges', 'complete_edges', 'broken_edges', 'completeness_pct', 'gaps', 'critical_gaps', 'reference_data_missing', 'recommendations'], 'n_keys': 8}`

**GET /api/v1/lineage/module-coverage** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_modules', 'total_categories', 'categories'], 'n_keys': 3}`

## 5 · Intermediate Transformation Logic
**Methodology:** Lineage Coverage Score
**Headline formula:** `Lineage_coverage = Metrics_with_full_lineage / Total_disclosed_metrics × 100%`
**Standards:** ['CSRD Assurance Requirements', 'DAMA DMBOK2 Data Lineage', 'ISO 19650 Information Management']

**Engine `data_lineage_service` — extracted transformation lines:**
```python
missing = mapped_fields - src_outputs
orphans = set(self._signatures.keys()) - all_in_deps
pct = (complete / total * 100) if total > 0 else 0
root_mods = sorted(sources - targets)  # No upstream
leaf_mods = sorted(targets - sources)  # No downstream
orphans = sorted(set(self._signatures.keys()) - all_connected)
roots = sources_set - targets_set
overall = sum(scores.values()) / len(scores) if scores else 0
```

**Engine `lineage_orchestrator` — extracted transformation lines:**
```python
embedded = total_catalogued - len(missing) - len(partial)
pct = (embedded / total_catalogued * 100) if total_catalogued > 0 else 0
quality_impact[dm] = round(original - new_quality, 2)
completeness_score = gap_analysis.completeness_pct  # 0-100
ref_score = ref_gaps.completeness_pct  # 0-100
quality_score = quality.overall_quality * 100  # 0-100
bridge_score = (bridge_health.wired_bridges / max(bridge_health.total_bridges, 1)) * 100
events = events[-limit:]
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).