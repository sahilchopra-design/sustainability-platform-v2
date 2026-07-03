# Carbon Accounting AI
**Module ID:** `carbon-accounting-ai` · **Route:** `/carbon-accounting-ai` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
LLM-powered extraction of emissions data from invoices, utility bills, supplier documents, and product datasheets using structured information extraction and confidence scoring. Automates Scope 1, 2, and 3 Category 1 data collection, reducing manual GHG inventory effort by 60–80%. Integrates extracted data directly into the platform GHG calculation engine with data quality flags.

> **Business value:** AI-powered carbon accounting addresses the primary bottleneck in enterprise Scope 3 data collection: the manual effort of extracting activity data from thousands of unstructured supplier documents. By automating 90%+ of extraction with human-in-the-loop validation for low-confidence cases, the engine accelerates GHG inventory closure from months to days.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTIVITY_CATS`, `API`, `Btn`, `CONSOLIDATION`, `Inp`, `KpiCard`, `REPORTING_STANDARDS`, `Row`, `Section`, `Sel`, `TABS`, `UNITS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `ghgScore` | `Math.round((ghgReqList.filter(r => r.status === 'Pass').length / ghgReqList.length) * 100);` |
| `cdpAvg` | `Math.round((parseFloat(govS) + parseFloat(riskS) + parseFloat(targS) + parseFloat(emisS) + parseFloat(enerS)) / 5);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|

### 2.3 Engine `carbon_accounting_ai_engine` (services/carbon_accounting_ai_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CarbonAccountingAIEngine.check_ghg_compliance` | d | Check completeness of GHG disclosures against GHG Protocol requirements. |
| `CarbonAccountingAIEngine.match_emission_factor` | query | Match an activity description to emission factor databases using keyword scoring. |
| `CarbonAccountingAIEngine.classify_scope3_category` | tx | Auto-classify a financial transaction into GHG Protocol Scope 3 Category 1-15. |
| `CarbonAccountingAIEngine.derive_dqs_score` | metadata_input | ML-based DQS (Data Quality Score) derivation from metadata. |
| `CarbonAccountingAIEngine.auto_tag_xbrl` | d | Map GHG disclosure fields to ESRS XBRL taxonomy tags. |
| `CarbonAccountingAIEngine.score_cdp_response` | cdp_input | Score CDP Climate questionnaire responses for A-list gap analysis. |
| `CarbonAccountingAIEngine.analyse_data_gaps` | d | Identify missing data fields, recommend proxy methodologies, |
| `CarbonAccountingAIEngine.full_assessment` | d | Run all Carbon Accounting AI sub-modules and return a consolidated result. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `GHG`, `Scope`, `exc` *(shared)*, `fastapi` *(shared)*, `metadata`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ACTIVITY_CATS`, `CONSOLIDATION`, `REPORTING_STANDARDS`, `TABS`, `UNITS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Extraction Accuracy | — | Human review benchmark | Percentage of LLM-extracted fields matching human-verified ground truth |
| Processing Speed | — | Platform throughput | Volume of supplier/utility documents processed per hour by the AI extraction pipeline |
| Scope 3 Cat 1 Coverage | — | GHG inventory completeness | Percentage of purchased goods/services spend with AI-extracted supplier emission data |
- **Supplier invoices, utility bills, product datasheets (PDF/image)** → LLM extraction of activity data fields; confidence scoring; route low-confidence to human review → **Structured emission activity records with confidence flags and source document links**
- **IPCC AR6 emission factor database** → Match extracted fuel/energy type to AR6 factor; compute GHG contribution → **Per-document GHG contribution integrated into Scope 1/2/3 inventory**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/carbon-accounting-ai/ref/cdp-questionnaire** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['questionnaire', 'total_sections', 'scoring_reference', 'a_list_threshold_pct', 'bands'], 'n_keys': 5}`

**GET /api/v1/carbon-accounting-ai/ref/ef-databases** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['databases', 'total_databases', 'total_activity_categories', 'note'], 'n_keys': 4}`

**GET /api/v1/carbon-accounting-ai/ref/scope3-classification-rules** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['categories', 'total_categories', 'reference', 'flag_note'], 'n_keys': 4}`

**GET /api/v1/carbon-accounting-ai/ref/xbrl-concepts** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_concepts', 'mandatory_count', 'optional_count', 'mandatory_concepts', 'optional_concepts', 'taxonomy_reference', 'format'], 'n_keys': 7}`

**POST /api/v1/carbon-accounting-ai/assess** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['entity_name', 'reporting_year', 'overall_readiness_score', 'priority_actions', 'ghg_compliance', 'ef_matching', 'scope3_classification', 'dqs_score', 'xbrl_tagging', 'cdp_scoring', 'data_gaps`

## 5 · Intermediate Transformation Logic
**Methodology:** LLM structured extraction with confidence scoring
**Headline formula:** `Extraction_confidence = P(field_correct | extracted_value, source_type); GHG_contribution = Activity_data × EF_IPCC_AR6`
**Standards:** ['GHG Protocol Corporate Standard', 'IPCC AR6 Emission Factors', 'ISO 14064-1']

**Engine `carbon_accounting_ai_engine` — extracted transformation lines:**
```python
score = matches / max(len(kws), 1)
confidence = min(best_score * 1.5, 0.95)
scores[rule_key] = kw_score * 0.7 + sic_score * 0.3
confidence = min(sorted_cats[0][1] * 1.2, 0.92)
coverage_score = coverage / 100.0
recency_score = max(0.0, 1.0 - recency * 0.15)
total = d.scope1_tco2e + d.scope2_location_tco2e + s3_total
coverage_pct = round(mandatory_tagged / max(mandatory_total, 1) * 100, 1)
section_score = completeness * 0.5 + quality * 0.35 + (0.15 if has_evidence else 0.0)
missing_critical = critical_cats - reported_cats
overall_gap_score = round(materiality_weighted_gap * 100, 1)
overall_readiness_score=round(readiness * 100, 1),
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **39** other module(s).

| Connected module | Shared via |
|---|---|
| `blended-finance` | table:exc |
| `biodiversity-credits` | table:exc |
| `transition-finance` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `just-transition-adaptation` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |
| `insurance-transition` | table:exc |
| `supply-chain-map` | table:exc |
| `crrem` | table:exc |