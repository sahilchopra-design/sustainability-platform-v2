# CSRD iXBRL Tagger
**Module ID:** `csrd-ixbrl` · **Route:** `/csrd-ixbrl` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Applies ESRS XBRL taxonomy tags to quantitative and qualitative CSRD disclosures, validates tags against EFRAG taxonomy schema, and generates machine-readable iXBRL files for submission to European Single Access Point (ESAP). Supports multi-language tagging for multinational reporters.

> **Business value:** Enables sustainability reporting and finance teams to produce ESAP-ready iXBRL digital CSRD reports, meeting the machine-readability requirements that allow regulators, investors, and data platforms to automatically extract and compare sustainability data.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `BADGE`, `BASE_COVERAGE`, `ESRS_STANDARDS`, `FRAMEWORKS`, `FW_COLOR`, `MANUAL_FIELDS`, `MULTI_FW`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `factCount` | `Math.round(1111 * (filledCount / 5));` |
| `totalGHG` | `emissions.s1 + emissions.s2 + emissions.s3;` |
| `intensity` | `emissions.revenue > 0 ? (totalGHG / (emissions.revenue / 1e6)).toFixed(1) : '—';` |
| `coverageBarData` | `ESRS_STANDARDS.map(e => ({` |
| `allFWResults` | `compareAll ? FRAMEWORKS.map(fw => ({` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ESRS_STANDARDS`, `FRAMEWORKS`, `MANUAL_FIELDS`, `MULTI_FW`
**Shared context buses:** `TestDataContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Taxonomy Elements (ESRS Set 1) | — | EFRAG XBRL Taxonomy 2023 | Total number of XBRL elements in the ESRS taxonomy covering quantitative and qualitative disclosures |
| Mandatory Tag Coverage | — | ESRS XBRL Taxonomy | Regulatory expectation for coverage of mandatory quantitative data points with valid taxonomy tags |
| Validation Errors (target) | — | EFRAG/ESAP validator | Goal of zero schema validation errors before submission; warnings reviewed for materiality |
| Multi-Language Support | — | ESAP regulation | Languages supported for human-readable narrative labels in iXBRL file |
| iXBRL File Size | — | Technical estimate | Typical size of generated iXBRL sustainability report file for mid-to-large companies |
- **CSRD report draft (HTML/DOCX)** → Parse document structure, identify quantitative and qualitative disclosure sections → **Untagged disclosure element list**
- **EFRAG ESRS XBRL taxonomy database** → Semantic matching of disclosure elements to taxonomy IDs → **Suggested tag assignments per element**
- **EFRAG/ESAP validation schema** → Run conformance checks, generate error/warning report → **Validated iXBRL file for submission**

## 5 · Intermediate Transformation Logic
**Methodology:** ESRS XBRL Taxonomy Tagging
**Headline formula:** `Tag_coverage = Matched_datapoints / Total_quantitative_datapoints × 100%`
**Standards:** ['EFRAG ESRS XBRL Taxonomy 2023', 'ESEF Regulation (EU) 2019/815', 'ESAP Regulation (EU) 2023/2859']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).