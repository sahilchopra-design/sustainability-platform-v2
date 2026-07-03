# Comprehensive Reporting Suite
**Module ID:** `comprehensive-reporting` · **Route:** `/comprehensive-reporting` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Generates end-to-end sustainability reports across CSRD/ESRS, TCFD, ISSB S1/S2, and GRI standards from a single data model, ensuring cross-framework consistency and traceability. Supports double materiality assessment outputs, quantitative KPI tables, and XBRL-tagged digital disclosure packages.

> **Business value:** Enables sustainability reporting teams to produce consistent, audit-ready multi-framework reports from a single data entry workflow, eliminating reconciliation gaps and ensuring compliance with CSRD digital filing requirements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `DATAPOINT_MAP`, `FRAMEWORKS`, `FW_DATA`, `Kpi`, `PIE_C`, `Row`, `SUBMISSIONS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Multi-Framework Dashboard','Datapoint Mapper','Report Builder','Submission Tracker'];` |
| `generateFrameworkData` | `()=>FRAMEWORKS.map((fw,fi)=>{` |
| `coverage` | `Math.round(30+sr(fi*7)*60);` |
| `gapCount` | `Math.round(fw.totalDatapoints*(100-coverage)/100);` |
| `sections` | `Array.from({length:5+Math.floor(sr(fi*11)*5)},(_,si)=>{` |
| `names` | `sectionNames[fw.id]\|\|[`Section ${si+1}`];` |
| `filled` | `Math.round(dp*coverage/100+sr(fi*50+si*17)*dp*0.1);` |
| `alignedWith` | `FRAMEWORKS.filter((_,ofi)=>ofi!==fi&&sr(fi*100+di*50+ofi*7)>0.4).map(f=>f.id);` |
| `SUBMISSIONS` | `FRAMEWORKS.map((fw,fi)=>({` |
| `exportCSV` | `(rows,fn)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].j` |
| `avgCoverage` | `Math.round(FW_DATA.reduce((a,f)=>a+f.coverage,0)/FW_DATA.length);` |
| `totalDatapoints` | `FRAMEWORKS.reduce((a,f)=>a+f.totalDatapoints,0);` |
| `totalGaps` | `FW_DATA.reduce((a,f)=>a+f.gapCount,0);` |
| `coverageData` | `FW_DATA.map(f=>({name:f.name,coverage:f.coverage,gaps:100-f.coverage}));` |
| `radarData` | `FW_DATA.map(f=>({framework:f.name,coverage:f.coverage,quality:f.qualityScore,automation:f.automationPct}));` |
| `overlapPct` | `Math.round(overlapCount/fw1Points.length*100);` |
| `totalDp` | `selectedSections.reduce((a,s)=>a+s.datapoints,0);` |
| `filledDp` | `selectedSections.reduce((a,s)=>a+s.filled,0);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/comprehensive-reporting/compile` | `compile_report` | api/v1/routes/comprehensive_reporting.py |
| POST | `/api/v1/comprehensive-reporting/esrs-report` | `generate_esrs_report` | api/v1/routes/comprehensive_reporting.py |
| POST | `/api/v1/comprehensive-reporting/xbrl-tag` | `generate_xbrl_tagging` | api/v1/routes/comprehensive_reporting.py |
| POST | `/api/v1/comprehensive-reporting/consistency-check` | `check_cross_framework_consistency` | api/v1/routes/comprehensive_reporting.py |
| POST | `/api/v1/comprehensive-reporting/readiness-score` | `calculate_readiness_score` | api/v1/routes/comprehensive_reporting.py |
| GET | `/api/v1/comprehensive-reporting/ref/framework-mapping` | `get_framework_mapping` | api/v1/routes/comprehensive_reporting.py |
| GET | `/api/v1/comprehensive-reporting/ref/esrs-checklist` | `get_esrs_checklist` | api/v1/routes/comprehensive_reporting.py |
| GET | `/api/v1/comprehensive-reporting/ref/xbrl-concepts` | `get_xbrl_concepts` | api/v1/routes/comprehensive_reporting.py |
| GET | `/api/v1/comprehensive-reporting/ref/consistency-rules` | `get_consistency_rules` | api/v1/routes/comprehensive_reporting.py |

### 2.3 Engine `comprehensive_reporting_engine` (services/comprehensive_reporting_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ComprehensiveReportingEngine.compile_report` | entity_id, frameworks, engine_outputs, reporting_year | Full multi-framework report with completeness, consistency, and assurance readiness. |
| `ComprehensiveReportingEngine.generate_esrs_report` | entity_id, engine_outputs, wave, reporting_year | Full ESRS disclosure set with DP completeness, gap analysis, and priority actions. |
| `ComprehensiveReportingEngine.generate_xbrl_tagging` | entity_id, quantitative_dps | Generate XBRL instance document structure (EFRAG ESRS-XBRL-2024-01-01). |
| `ComprehensiveReportingEngine.check_cross_framework_consistency` | entity_id, multi_framework_data | Evaluate 20 consistency rules across frameworks. |
| `ComprehensiveReportingEngine.calculate_readiness_score` | entity_id, frameworks, engine_outputs, wave | Calculate overall reporting readiness with blocking vs advisory gap classification. |
| `ComprehensiveReportingEngine._build_framework_sections` | framework, engine_outputs, reporting_year | Build report sections for a given framework based on engine outputs. |
| `ComprehensiveReportingEngine._calculate_topic_completeness` | engine_outputs | Per-ESRS standard completeness score. |
| `ComprehensiveReportingEngine._calculate_assurance_pct` | completeness, consistency | Proxy assurance readiness from completeness and consistency scores. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `EFRAG`, `__future__` *(shared)*, `all`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*, `upstream`
**Frontend seed datasets:** `FRAMEWORKS`, `PIE_C`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Framework Coverage | — | Platform mapping | Active reporting frameworks covered in unified data model and report generation |
| Data Point Coverage | — | ESRS/ISSB requirement register | Percentage of required disclosure data points populated with primary or estimated data |
| Cross-Framework Consistency | — | Internal reconciliation | Agreement rate between same metrics reported under different frameworks in the same period |
| XBRL Tag Coverage | — | ESRS Taxonomy | Proportion of quantitative disclosures with valid ESRS XBRL taxonomy tags applied |
| Double Materiality Topics | — | ESRS 1 methodology | Number of ESRS topics assessed as material under impact or financial materiality criteria |
- **Platform ESG data model** → Map metrics to all active framework data point requirements → **Cross-framework disclosure matrix**
- **Double materiality assessment outputs** → Gate topic disclosure requirements, apply omission justifications → **Topic materiality flags**
- **ESRS XBRL taxonomy** → Match quantitative disclosures to taxonomy elements, generate tagged output → **iXBRL digital filing package**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/comprehensive-reporting/ref/consistency-rules** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'total_rules', 'blocking_rules', 'advisory_rules', 'frameworks_covered', 'filter_applied', 'ifrs_s1_s2_checklist_count', 'rules'], 'n_keys': 8}`

**GET /api/v1/comprehensive-reporting/ref/esrs-checklist** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'total_dps_in_checklist', 'mandatory_dps', 'phase_in_relief_dps', 'standards_summary', 'csrd_waves', 'checklist'], 'n_keys': 7}`

**GET /api/v1/comprehensive-reporting/ref/framework-mapping** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'total_dp_mappings', 'mandatory_dps', 'frameworks_covered', 'source_engines_referenced', 'filter_applied', 'mappings'], 'n_keys': 7}`

**GET /api/v1/comprehensive-reporting/ref/xbrl-concepts** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['taxonomy_version', 'taxonomy_ref', 'source', 'esap_mandate', 'concept_count', 'data_type_distribution', 'filter_applied', 'concepts'], 'n_keys': 8}`

**POST /api/v1/comprehensive-reporting/compile** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Cross-Framework Data Harmonisation
**Headline formula:** `Disclosure_coverage = Σ(Mapped_datapoints) / Σ(Required_datapoints)`
**Standards:** ['CSRD/ESRS 2023', 'ISSB IFRS S1/S2', 'GRI Universal 2021', 'TCFD 2021']

**Engine `comprehensive_reporting_engine` — extracted transformation lines:**
```python
fw_completeness[fw] = round(provided / max(total, 1) * 100, 1)
overall = round(sum(fw_completeness.values()) / max(len(fw_completeness), 1), 1)
provided_mandatory_dps=len(provided_hard) + len(provided_phase_in),
deviation_pct = (max_v - min_v) / max_v * 100
consistency_score = round(rules_passed / max(rules_evaluated, 1) * 100, 1)
rules_failed=rules_evaluated - rules_passed,
overall = round(sum(fw_readiness.values()) / max(len(fw_readiness), 1), 1)
gap = max(0, 90 - overall)
weeks = int(math.ceil(gap / 10 * 2))
completeness = round(provided / max(required, 1) * 100, 1)
raw = completeness * 0.6 + consistency * 0.4
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).