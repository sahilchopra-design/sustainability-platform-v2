# XBRL Export Wizard
**Module ID:** `xbrl-export-wizard` · **Route:** `/xbrl-export-wizard` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESRS and SEC XBRL tagging and export workflow; maps ESG disclosure data to the ESRS XBRL taxonomy and SEC climate disclosure taxonomy, validates tags and generates iXBRL-formatted submission files.

> **Business value:** CSRD requires iXBRL tagging of all ESRS disclosures from 2025; ESMA estimates 50,000+ companies must comply; automated XBRL tooling reduces tagging time from weeks to hours and eliminates manual error.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DataMapping`, `ExportPreview`, `TaxonomyBrowser`, `VALIDATION_RULES`, `ValidationReport`, `XBRL_CONCEPTS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pill` | `(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color` |
| `byEsrs` | `['E1','E2','E3','E4','G1','S1'].map(e=>({esrs:e,count:XBRL_CONCEPTS.filter(c=>c.esrs===e).length,tagged:XBRL_CONCEPTS.filter(c=>c.esrs===e&&c.status==` |
| `entity` | `{name:'Apex Sustainability Corp SE',lei:'LEI-9FGHIJ0KLMNO1234PQ56',period:'2024-01-01/2024-12-31',currency:'EUR'};` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/xbrl/export` | `xbrl_export` | api/v1/routes/xbrl_export.py |
| POST | `/api/v1/xbrl/ingest` | `xbrl_ingest` | api/v1/routes/xbrl_export.py |
| POST | `/api/v1/xbrl/ingest/ixbrl` | `xbrl_ingest_ixbrl` | api/v1/routes/xbrl_export.py |
| POST | `/api/v1/xbrl/ingest/xbrl-xml` | `xbrl_ingest_xml` | api/v1/routes/xbrl_export.py |
| GET | `/api/v1/xbrl/ref/taxonomy` | `ref_taxonomy` | api/v1/routes/xbrl_export.py |
| GET | `/api/v1/xbrl/ref/validation-rules` | `ref_validation_rules` | api/v1/routes/xbrl_export.py |
| GET | `/api/v1/xbrl/ref/supported-standards` | `ref_supported_standards` | api/v1/routes/xbrl_export.py |
| GET | `/api/v1/xbrl/ref/supported-schemas` | `ref_supported_schemas` | api/v1/routes/xbrl_export.py |
| GET | `/api/v1/xbrl/ref/concept-mappings` | `ref_concept_mappings` | api/v1/routes/xbrl_export.py |
| GET | `/api/v1/xbrl/ref/ingestion-stats` | `ref_ingestion_stats` | api/v1/routes/xbrl_export.py |
| GET | `/api/v1/xbrl/ref/csrd-xbrl-bridge` | `ref_csrd_xbrl_bridge` | api/v1/routes/xbrl_export.py |

### 2.3 Engine `xbrl_export_engine` (services/xbrl_export_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `XBRLExportEngine.export` | entity_name, entity_lei, period_start, period_end, data_points, currency | Generate XBRL export from data points. |
| `XBRLExportEngine.export_from_csrd_auto_populate` | auto_populate_result, entity_lei, period_start, period_end, currency, decimals | E2 pipeline: CSRD auto-populate output → XBRL iXBRL / XML. |
| `XBRLExportEngine._generate_ixbrl` | name, lei, start, end, facts, currency | Generate iXBRL HTML document. |
| `XBRLExportEngine._generate_xbrl_xml` | name, lei, start, end, facts, currency | Generate XBRL XML instance document. |
| `XBRLExportEngine._validate` | facts, lei, start, end | Run ESEF validation rules. |
| `XBRLExportEngine.get_taxonomy` |  |  |
| `XBRLExportEngine.get_validation_rules` |  |  |
| `XBRLExportEngine.get_supported_standards` |  |  |

### 2.3 Engine `xbrl_ingestion_engine` (services/xbrl_ingestion_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `XBRLIngestionEngine.ingest_ixbrl` | html_content | Parse an iXBRL (inline XBRL in HTML) document. |
| `XBRLIngestionEngine.ingest_xbrl_xml` | xml_content | Parse an XBRL XML instance document. |
| `XBRLIngestionEngine.ingest_auto` | content | Auto-detect format (iXBRL HTML vs XBRL XML) and parse. |
| `XBRLIngestionEngine._build_result` | fmt, entity_name, entity_id, period_start, period_end, facts | Build final ingestion result with coverage stats. |
| `XBRLIngestionEngine.get_supported_schemas` |  |  |
| `XBRLIngestionEngine.get_concept_mappings` |  |  |
| `XBRLIngestionEngine.get_mapped_concept_count` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `csrd_auto_populate`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `structured`, `typing` *(shared)*
**Frontend seed datasets:** `TABS`, `VALIDATION_RULES`, `XBRL_CONCEPTS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Elements Tagged | — | Tagging Engine | Proportion of mandatory ESRS/SEC elements mapped to XBRL taxonomy concepts. |
| Validation Errors | — | XBRL Validator | Current count of XBRL validation errors requiring correction before submission; target zero. |
| File Size | — | Export Engine | Size of generated iXBRL file; large files may require chunking for ESMA portal upload limits. |
- **ESG Disclosure Data, ESRS XBRL Taxonomy, SEC Taxonomy** → Element mapping + XBRL tagging + schema validation + iXBRL rendering → **iXBRL submission files, validation reports, tagging completeness scorecard**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/xbrl/ref/concept-mappings** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['esrs:GrossScope1GHGEmissions', 'esrs:GrossScope2GHGEmissionsLocationBased', 'esrs:GrossScope2GHGEmissionsMarketBased', 'esrs:TotalScope3GHGEmissions', 'esrs:TotalGHGEmissions', 'esrs:GHGInten`

**GET /api/v1/xbrl/ref/csrd-xbrl-bridge** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['bridge_map', 'total_mappings', 'note'], 'n_keys': 3}`

**GET /api/v1/xbrl/ref/ingestion-stats** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['supported_schemas', 'mapped_concepts', 'export_taxonomy_concepts', 'validation_rules'], 'n_keys': 4}`

**GET /api/v1/xbrl/ref/supported-schemas** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['esrs_2024', 'ifrs_s1s2_2024', 'ifrs_full_2024', 'us_gaap_2024', 'gri_2024', 'esef_lei'], 'n_keys': 6}`

**GET /api/v1/xbrl/ref/supported-standards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 6, 'item0_keys': None}`

## 5 · Intermediate Transformation Logic
**Methodology:** XBRL Tagging Completeness
**Headline formula:** `XTC = Tagged Elements / Required Elements × 100`
**Standards:** ['ESRS XBRL Taxonomy 2024', 'SEC Climate Disclosure Rule 2024']

**Engine `xbrl_ingestion_engine` — extracted transformation lines:**
```python
rate = (mapped_count / total * 100) if total > 0 else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).