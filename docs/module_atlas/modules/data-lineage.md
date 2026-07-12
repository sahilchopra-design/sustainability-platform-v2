# Data Lineage Tracker
**Module ID:** `data-lineage` · **Route:** `/data-lineage` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides end-to-end data lineage mapping from raw source data through transformation pipelines to disclosed sustainability metrics, enabling full traceability for regulatory assurance, audit purposes, and data quality root-cause analysis. Visualises lineage as an interactive directed acyclic graph.

> **Business value:** Enables sustainability teams and external assurers to trace any disclosed metric back to its original source, fulfilling CSRD limited assurance requirements and providing the audit trail needed for regulatory inspection and data quality root-cause investigations.

**How an analyst works this module:**
- Overview tab shows lineage coverage score by data domain and disclosed metric category
- Interactive DAG Viewer visualises full lineage graph with clickable nodes for each transformation
- Gap Finder identifies metrics with incomplete lineage and assigns annotation tasks to stewards
- Transformation Annotator allows stewards to document transformation logic in each pipeline step
- Assurance Readiness tab flags metrics meeting full lineage requirements vs gaps
- Export Lineage Package generates PDF lineage maps and JSON for external assurance teams

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `Card`, `DATA_LINEAGE_FIELDS`, `FX_RATES`, `IMPACT_MAP`, `LS_AUDIT`, `LS_PORTFOLIO`, `MANUAL_OVERRIDES`, `PRIORITY_MATRIX`, `SOURCE_NAMES`, `SortIcon`, `TRANSFORMATIONS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DATA_LINEAGE_FIELDS` | 19 | `label`, `sources`, `priority`, `transformation`, `downstream`, `quality`, `age_hours`, `category` |
| `TRANSFORMATIONS` | 13 | `name`, `description`, `input`, `output`, `formula`, `category` |
| `FX_RATES` | 14 | `to`, `rate`, `multiplier`, `source`, `updated` |
| `MANUAL_OVERRIDES` | 7 | `field`, `original`, `override`, `reason`, `user`, `date`, `source_key` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `baseDate` | `new Date('2025-03-25T12:00:00Z');` |
| `field` | `fields[Math.floor(sr(_sc++)*fields.length)];` |
| `prevVal` | `(sr(_sc++)*80+10).toFixed(1);` |
| `newVal` | `(parseFloat(prevVal) + (sr(_sc++)-0.5)*20).toFixed(1);` |
| `selectedLineage` | `useMemo(() => DATA_LINEAGE_FIELDS.find(f => f.field === selField) \|\| DATA_LINEAGE_FIELDS[0], [selField]);  /* Impact analysis field */ const [impactField, setImpactField] = useState('scope1_mt');` |
| `impactTargets` | `useMemo(() => IMPACT_MAP[impactField] \|\| [], [impactField]);  /* Audit trail (persisted) */ const [auditTrail, setAuditTrail] = useState(() => loadLS(LS_AUDIT) \|\| generateAuditEntries());` |
| `categories` | `useMemo(() => ['All', ...new Set(DATA_LINEAGE_FIELDS.map(f => f.category))], []);` |
| `avgQuality` | `Math.round(DATA_LINEAGE_FIELDS.reduce((s,f) => s + f.quality, 0) / DATA_LINEAGE_FIELDS.length);` |
| `avgAge` | `Math.round(DATA_LINEAGE_FIELDS.reduce((s,f) => s + f.age_hours, 0) / DATA_LINEAGE_FIELDS.length);` |
| `lineageCoverage` | `Math.round(DATA_LINEAGE_FIELDS.filter(f => f.sources.length > 0 && f.downstream.length > 0).length / DATA_LINEAGE_FIELDS.length * 100);` |
| `freshnessData` | `useMemo(() => DATA_LINEAGE_FIELDS.map(f => ({ field:f.label.length > 14 ? f.label.slice(0,12)+'...' : f.label, hours:f.age_hours, fullLabel:f.label })), []);` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => { const v = r[k]; return `"${Array.isArray(v) ? v.join('; ') : (v ?? '')}"`; }).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type:'text/csv' });` |
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
| GET | `/api/v1/lineage/audit-events` | `audit_events` | api/v1/routes/data_lineage.py |

### 2.3 Engine `data_lineage_service` (services/data_lineage_service.py)
| Function | Args | Purpose |
|---|---|---|
| `DataLineageEngine._build_graph` |  | Build adjacency lists from dependency edges. |
| `DataLineageEngine.trace_lineage` | target_module, entity_id, module_quality | Trace the full upstream lineage for a target module. Performs reverse BFS from target_module, following all upstream dependencies to root sources. Computes quality propagation at each node. Parameters: target_module: Module to trace lineage for entity_id: Entity context (for quality lookup) module_quality: Override quality scores {module_id: 0.0-1.0} Returns: LineageChain with full node list, qual |
| `DataLineageEngine.find_gaps` |  | Scan all dependency edges for lineage gaps across the platform. Identifies: - Broken field mappings (source doesn't produce mapped field) - Missing module signatures (referenced but not registered) - Missing reference data (needed but not cataloged) Returns: PlatformGapAnalysis with all gaps, severity, and remediation |
| `DataLineageEngine.get_module_graph` |  | Build the full module dependency graph. Returns: ModuleGraphResult with all modules, edges, and topology analysis |
| `DataLineageEngine.propagate_quality` | entity_id, module_quality | Propagate data quality scores through the dependency graph. Starting from source modules (with given quality scores), propagates downstream using weakest-link principle: downstream quality cannot exceed the minimum quality of its upstream sources. Parameters: entity_id: Entity identifier module_quality: {module_id: quality_score (0.0-1.0)} Returns: QualityPropagationResult with per-module scores a |
| `DataLineageEngine.get_all_reference_data` |  | Get all reference data dependencies across all modules. |
| `DataLineageEngine.get_module_signatures` |  | Get all module I/O signatures. |
| `DataLineageEngine.get_dependencies` |  | Get all module dependency edges. |
| `DataLineageEngine._quality_label` | score |  |
| `_register_climate_risk_modules` | service_instance | Register all Climate Risk Engine modules in the DataLineageService module signatures registry and add dependency edges. Call once at application startup or after service initialisation. |
| `_register_e_series_modules` | service_instance | Register E6–E10 engine-series modules + E8 IORP II in data lineage. |
| `_register_e11_modules` | service_instance | Register E11 UK SDR engine in the data lineage graph. |
| `_register_e12_e15_modules` | service_instance | Register E12-E15 engines in the data lineage graph. |
| `_register_e16_e19_modules` | service_instance | Register E16-E19 engines in the data lineage graph. |
| `_register_e20_e23_modules` | service_instance | Register E20-E23 engines in the data lineage graph. |
| `_register_e24_e27_modules` | service_instance | Register E24-E27 engines in the data lineage graph. |
| `_register_e28_e31_modules` | service_instance | Register E28-E31 engines in the data lineage graph. |
| `_register_e32_e35_modules` | service_instance | Register E32-E35 engines in the data lineage graph. |
| `_register_e36_e39_modules` | service_instance | Register E36-E39 engines in the data lineage graph. |
| `_register_e40_e43_modules` | service_instance | Register E40-E43 engines in the data lineage graph. |
| `_register_e44_e47_modules` | service_instance | Register E44-E47 engines in the data lineage graph. |
| `_register_e48_e51_modules` | service_instance | Register E48-E51 engines in the data lineage graph. |
| `_register_e52_e55_modules` | service_instance | Register E52-E55 engines in the data lineage graph. |
| `_register_e56_e59_modules` | service_instance | Register E56-E59 engines in the data lineage graph. |
| `_register_e60_e63_modules` | service_instance | Register E60-E63 engines in the data lineage graph. |
| `_register_e64_e67_modules` | service_instance | Register E64-E67 engines in the data lineage graph. |
| `_register_e68_e71_modules` | service_instance | Register E68-E71 engines: Blue Economy, Sovereign Debt Climate, Loss & Damage, Carbon Price ETS. |
| `_register_e76_e79_sprint29_modules` | service_instance |  |
| `_register_e72_e75_modules` | service_instance | Register E72-E75 engines in the data lineage graph. |
| `_register_e76_e79_modules` | service_instance | Register E76-E79 dependency edges: Crypto Climate, AI Governance, Carbon Accounting AI, Climate Insurance. |
| `_register_e80_e83_modules` | service_instance | Register E80-E83 dependency edges: Corporate Nature Strategy, Green Securitisation, Digital Product Passport, Adaptation Finance. |
| `_register_e84_e87_modules` | service_instance | Register E84-E87 dependency edges: Internal Carbon Pricing, Social Bond, Climate Financial Statements, EM Climate Risk. |
| `_register_e88_e91_modules` | service_instance | Register E88-E91 dependency edges: Biodiversity Credits, Just Transition, Carbon Removal, Climate Litigation. |
| `_register_e92_e95_modules` | service_instance | Register E92-E95 dependency edges: Water Risk, Critical Minerals, NbS Finance, SFDR Art 9. |
| `_register_e96_e99_modules` | service_instance | Register E96-E99 dependency edges: VCM Integrity, Social Taxonomy, Green Hydrogen, Transition Finance. |
| `_register_e100_e103_modules` | service_instance | Register E100-E103 dependency edges: Stress Test Orchestrator, SSCF, Double Materiality, Temperature Alignment. |

**Engine `data_lineage_service` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `QUALITY_THRESHOLDS` | `{'high': 0.7, 'medium': 0.4, 'low': 0.0}` |

### 2.3 Engine `lineage_orchestrator` (services/lineage_orchestrator.py)
| Function | Args | Purpose |
|---|---|---|
| `LineageOrchestrator.engine` |  | Access the underlying DataLineageEngine. |
| `LineageOrchestrator.analyse_reference_data_gaps` |  | Analyse all reference data dependencies across the platform. Cross-references MODULE_SIGNATURES reference_data fields with the REFERENCE_DATA_GAP_REGISTRY to identify: - Embedded datasets (available) - Missing datasets (blocking lineage chains) - Partial datasets (incomplete coverage) Returns: ReferenceDataGapReport with prioritised gap list |
| `LineageOrchestrator.check_bridge_health` |  | Verify all cross-module bridges are correctly wired. Cross-references BRIDGE_REGISTRY with actual MODULE_DEPENDENCIES to confirm each bridge has corresponding dependency edges. Returns: BridgeHealthReport with per-bridge status |
| `LineageOrchestrator.analyse_module_impact` | module_id, degradation_factor | What-if analysis: what happens if a module's quality degrades? Traces all downstream consumers of the given module and computes the quality impact at each node using weakest-link propagation. Parameters: module_id: Module to simulate degradation for degradation_factor: New quality score (0.0 = complete failure) Returns: ModuleImpactAnalysis with downstream impact map |
| `LineageOrchestrator.get_platform_health` |  | Comprehensive platform-wide lineage health dashboard. Aggregates: - Module graph topology - Gap analysis - Bridge health - Reference data gaps - Quality propagation (all modules at default quality) - BCBS 239 compliance estimate Returns: PlatformHealthDashboard with all metrics |
| `LineageOrchestrator.propagate_dqs_quality` | entity_id, module_dqs | Propagate quality using PCAF Data Quality Score (DQS 1-5). Converts DQS scores to confidence weights using DQS_TO_CONFIDENCE mapping, then delegates to DataLineageEngine quality propagation. Parameters: entity_id: Entity identifier module_dqs: {module_id: DQS score (1-5)} Returns: QualityPropagationResult dict with DQS-weighted scores |
| `LineageOrchestrator.trace_regulatory_lineage` | disclosure_framework | Trace the complete data lineage chain feeding a regulatory disclosure. Supported frameworks: CSRD, SFDR, EU_TAXONOMY, ISSB, CBAM Parameters: disclosure_framework: One of the supported frameworks Returns: Dict with lineage chain, feeding modules, quality, and gaps |
| `LineageOrchestrator.get_module_coverage` |  | Summary of all registered modules grouped by category. Returns: Dict with category breakdown, counts, and coverage metrics |
| `LineageOrchestrator._emit_audit` | event_type, module_id, entity_id, details, severity | Emit a lineage audit event (in-memory; can be wired to audit_log table). |
| `LineageOrchestrator.get_audit_events` | limit, severity | Retrieve lineage audit events. Parameters: limit: Max events to return severity: Filter by severity (info/warning/critical) Returns: List of audit event dicts, newest first |
| `LineageOrchestrator.get_reference_data_inventory` |  | Complete inventory of all reference data: embedded + missing + partial. Returns: Dict with embedded data from signatures plus gap registry |

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

**GET /api/v1/lineage/module-graph** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/lineage/platform-health** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/lineage/reference-data** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Lineage Coverage Score
**Headline formula:** `Lineage_coverage = Metrics_with_full_lineage / Total_disclosed_metrics × 100%`

Full lineage requires documentation of: (1) original source system and record identifier, (2) all transformation steps with logic descriptions, (3) quality checks applied, (4) aggregation methodology, and (5) final disclosure mapping with period and unit. Partial lineage flags metrics where any stage is undocumented. Lineage completeness is a key external assurance readiness indicator under CSRD limited assurance requirements.

**Standards:** ['CSRD Assurance Requirements', 'DAMA DMBOK2 Data Lineage', 'ISO 19650 Information Management']
**Reference documents:** CSRD Delegated Regulation â€” Assurance Requirements (Art. 34); DAMA DMBOK2 Chapter 7 â€” Data Lineage and Impact Analysis; ISO 19650:2018 Information Management Using BIM â€” Part 1; EFRAG Implementation Guidance â€” Data Quality and Estimation

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

## 7 · Methodology Deep Dive

The guide matches the code: a **lineage-coverage tracker** (`Lineage_coverage =
Metrics_with_full_lineage / Total_disclosed_metrics × 100%`). The module is a genuine, richly-specified
data-lineage documentation artefact — 19 tracked fields each with real source priority, transformation
logic, downstream-consumer lists, quality scores and freshness — plus an impact-analysis map and a
persisted audit trail. The lineage *content* is real and hand-authored (not seeded); only the generated
audit-trail entries and their before/after values use the PRNG.

### 7.1 What the module computes

```js
avgQuality      = round(Σ fields.quality / n)                        // real field quality scores
avgAge          = round(Σ fields.age_hours / n)                      // real freshness
lineageCoverage = round(#{fields with sources>0 AND downstream>0} / n · 100)
// audit-trail generation (seeded)
prevVal = (sr()·80 + 10).toFixed(1) ; newVal = (prevVal + (sr()−0.5)·20).toFixed(1)
```
Coverage is a real completeness ratio over the lineage register; per-category quality/age are real
averages of authored values.

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| Lineage fields | 19 (esg_score, scope1/2/3_mt, revenue, market_cap, evic, …) | **real** hand-authored register |
| Source priority | e.g. scope1 "Reported > BRSR > Estimate" | **real** substitution logic |
| Transformation | e.g. revenue "FX conversion to USD Mn (13 currencies)" | **real** documented logic |
| Downstream consumers | e.g. scope1 → GHG Tracker, WACI, PCAF, Carbon Budget, ITR | **real** dependency map |
| Field quality | esg 82, scope1 75, scope3 48, revenue 94, market_cap 96 | authored (plausible, PCAF-aligned) |
| Age (hours) | esg 12, scope3 72, market_cap 6 | authored freshness |
| Transformations catalogue | 13 named transforms with formulas | **real** |
| FX rates | 14 currencies with rate/multiplier/source | curated reference |
| Manual overrides | 7 (field, original, override, reason, user, date) | curated audit examples |
| Audit-trail values | `sr()`-generated prev/new | synthetic seeded |

### 7.3 Calculation walkthrough

`DATA_LINEAGE_FIELDS` register → `avgQuality`, `avgAge`, `lineageCoverage` computed → per-category
averages (`catAvgQuality`, `catAvgAge`) → freshness bar chart. Field selector shows the chosen field's
full lineage (sources → transformation → downstream). Impact-analysis picks a field and lists its
`IMPACT_MAP` downstream targets. Audit trail (persisted to `localStorage`) is generated with seeded
before/after values. CSV export flattens the register.

### 7.4 Worked example (lineage coverage)

Of 19 fields, suppose 17 have both a non-empty `sources` list and a non-empty `downstream` list (two
newly-added fields lack documented downstream):
```
lineageCoverage = round(17/19 · 100) = round(89.5) = 89%
avgQuality      = round((82+75+72+48+94+96+88+…)/19)   # mean of authored quality scores
```
Coverage is a genuine completeness metric — it drops precisely when a field's lineage documentation is
incomplete, which is exactly the CSRD assurance-readiness signal the guide describes.

### 7.5 Data provenance & limitations

- **The lineage register is real and hand-authored** — source priorities, transformation formulas and
  downstream-consumer maps are genuine platform documentation, one of the atlas's most authentic
  artefacts.
- Field quality/age values are authored (plausible) rather than sensed from live pipelines.
- **Audit-trail before/after values are `sr()`-seeded**; the trail is illustrative, not a real change log.

**Framework alignment:** CSRD assurance requirements (Art 34 — lineage underpins limited assurance) ·
DAMA DMBOK2 Ch 7 data lineage & impact analysis · ISO 19650 information management. Full lineage per the
guide requires source ID + transformation steps + quality checks + aggregation + disclosure mapping —
the register captures the first four for each field; coverage measures how many fields are fully
documented. This is a faithful lineage-documentation module.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Lineage is hand-authored (not auto-harvested
from pipelines) and the audit trail is seeded.

**8.1 Purpose & scope.** Auto-generate and maintain an end-to-end lineage DAG from source systems through
transformations to disclosed metrics, with impact analysis and assurance-readiness scoring.

**8.2 Conceptual approach.** **Automated lineage harvesting** from pipeline metadata (OpenLineage /
column-level lineage) rather than manual authoring — the pattern used by DataHub, Collibra and Alation;
coverage/assurance follows CSRD Art 34 evidence sufficiency.

**8.3 Mathematical specification.**
```
FullLineage(metric) = has(source_id) ∧ has(transform_log) ∧ has(quality_check)
                       ∧ has(aggregation) ∧ has(disclosure_map)
Coverage = |{m : FullLineage(m)}| / |disclosed metrics|
ImpactSet(field) = transitive closure of downstream edges in DAG
Hops(metric) = shortest path length source → disclosed metric
AssuranceReady = |{full-lineage key metrics}| / |key metrics|
```

| Parameter | Source |
|---|---|
| Pipeline lineage | OpenLineage / dbt / Airflow metadata |
| Transformation logs | ETL job metadata |
| Quality checks | data-quality-monitor |
| Disclosure map | csrd/tcfd reporting modules |

**8.4 Data requirements.** Column-level lineage events, transformation metadata, quality-check
associations, disclosure-metric registry. Sources: pipeline orchestrator, DQ monitor. The manual
register is the seed; auto-harvest replaces authoring.

**8.5 Validation & benchmarking.** Reconcile harvested lineage to the manual register; verify impact
sets against known dependencies; benchmark coverage against auditor lineage requirements.

**8.6 Limitations & model risk.** Auto-harvest misses non-instrumented transforms (manual Excel steps);
column-level lineage is heavy to maintain. Fallback: hybrid — auto-harvest plus manual annotation for
the gaps the register already documents.

## 9 · Future Evolution

### 9.1 Evolution A — Auto-harvest lineage from the platform's own harness (analytics ladder: rung 2 → 3)

**What.** §7 rates the 19-field lineage register "one of the atlas's most authentic
artefacts" — real source priorities, documented transformations, genuine
downstream-consumer maps — with three scoped gaps: the register is hand-authored
rather than harvested (§8 says so explicitly), quality/age values are authored
rather than sensed, and the audit trail's before/after values are `sr()`-seeded.
Meanwhile the platform *runs* an E2E lineage harness (`backend/lineage/`, 2,528
endpoints swept, `ledger.jsonl` + per-domain traces) whose output this module never
consumes, and three of its own endpoints fail the harness (`/module-graph`,
`/platform-health`, `/reference-data`). Evolution A connects the documentation
module to the measurement system.

**How.** (1) Fix the three failed GETs. (2) Harvest: generate register entries from
the lineage harness's trace output — source tables, provenance classes, and
call-chain transformations per endpoint are already captured in
`lineage_output/traces/`; hand-authored entries become the curated overlay
(transformation *descriptions*, source-priority logic) on harvested structure.
(3) Sense freshness and quality: `age_hours` from actual table update timestamps,
quality from the capture/validation telemetry — replacing authored plausibility
with measurement. (4) Audit trail from AuditMiddleware events (the module's own
`GET /audit-events` already passes the harness) — deleting the seeded before/after
generator. (5) Coverage then means something stronger: fields with harvested,
verified lineage vs documented-only, badged distinctly — the CSRD Art. 34
assurance distinction.

**Prerequisites.** Lineage harness output as a scheduled artifact (currently
run-on-demand); the three endpoint fixes. **Acceptance:** a new module's endpoints
appear in the register after a harness sweep without hand-authoring; freshness
reflects a real table update within the snapshot interval; zero `sr()` calls in the
audit trail.

### 9.2 Evolution B — Assurance-walkthrough copilot for auditors (LLM tier 2)

**What.** The module's stated customer — external assurers tracing disclosed
metrics to sources under CSRD limited assurance — does this work as interview plus
document request. Evolution B compresses it: "walk me through Scope 3 for entity X"
drives tool calls across the register (`POST /lineage/trace`), the harvested
call-chains, and the audit events, producing the walkthrough narrative: source
system and priority logic, each transformation with its documented formula, quality
checks applied, and the downstream disclosure mapping — with every step citing a
register entry or trace record, and gaps stated as gaps (the Gap Finder's output in
prose).

**How.** Tier-2 read-only tools over the module's 16 operations (13 already pass
the harness); grounding corpus is the register's documented transformation logic —
the copilot explains recorded lineage, never infers undocumented steps, which is
precisely the assurance boundary. Impact-analysis questions ("what breaks if this
source lags?") call `POST /impact-analysis` and narrate the dependency map.
Exported walkthroughs join the Export Lineage Package.

**Prerequisites.** Evolution A's harvested register (walkthroughs over hand-
authored-only lineage carry a disclosure); the failed-endpoint fixes.
**Acceptance:** a walkthrough for a fully-documented field cites every stage from
the register; a partially-documented field's walkthrough terminates at the gap with
the Gap Finder's task reference; no step appears that lacks a register or trace
record.