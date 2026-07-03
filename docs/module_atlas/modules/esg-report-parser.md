# ESG Report Parser
**Module ID:** `esg-report-parser` · **Route:** `/esg-report-parser` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
AI-powered extraction engine that automatically parses PDF and HTML sustainability reports, integrated annual reports, and CDP questionnaire responses to extract structured ESG KPIs, targets, and commitments. Uses LLM-based document intelligence to handle inconsistent report formats, multiple languages, and non-tabular disclosures. Outputs structured data to the ESG Ratings Hub and entity 360 profiles.

> **Business value:** Scales ESG data collection from hundreds to thousands of companies without proportional analyst headcount growth, dramatically reducing time-to-insight for ESG research teams while maintaining a documented, reproducible extraction audit trail for regulatory and client audit purposes.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_TOPICS`, `DEMO_TEXT`, `FRAMEWORKS`, `FRAMEWORK_MAPPING`, `HISTORY_ROWS`, `INTEGRATION_CARDS`, `NLP_QUALITY_TREND`, `OIL_MAJORS`, `PARSE_STEPS`, `PILLAR_COLORS`, `SHARED_KPIS`, `TOPIC_KEYWORDS`, `TOPIC_LABELS`, `TOPIC_PILLAR`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `FRAMEWORKS` | `['ESRS', 'ISSB S1/S2', 'TCFD', 'GRI', 'SASB', 'CDP'];` |
| `base` | `Math.min(0.95, 0.45 + matches.length * 0.06 + sr(i * 7) * 0.15);` |
| `val` | `m ? m[1].replace(/,/g, '') : (sr(i * 3) * 50 + 10).toFixed(1);` |
| `sentences` | `text.split(/[.!?]+/).filter(s => s.trim().length > 20).slice(0, 30);` |
| `numRe` | `/\b([\d,\.]+)\s*(million\|billion\|%\|Mt\|kt\|PJ\|TWh\|MWh\|GW\|MW\|Mm³\|m³\|USD\|tCO2e\|kgCO2e)?\b/g;` |
| `val` | `parseFloat(m[1].replace(/,/g, ''));` |
| `pill` | `(color, bg) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, background: bg, color, fontSize: 11, fontWeight: 600 });` |
| `covered` | `ALL_TOPICS.filter(t => FRAMEWORK_MAPPING[t]?.[fw] && FRAMEWORK_MAPPING[t][fw] !== 'n/a').length;` |
| `detected` | `filteredTopics.filter(t => FRAMEWORK_MAPPING[t.topic]?.[fw] && FRAMEWORK_MAPPING[t.topic][fw] !== 'n/a').length;` |
| `radarData` | `useMemo(() => ['Climate', 'Water', 'Biodiversity', 'Social', 'Governance', 'Disclosure'].map(dim => {` |
| `dot` | `dims.reduce((s, d) => s + a[d] * b[d], 0);` |
| `magA` | `Math.sqrt(dims.reduce((s, d) => s + a[d] ** 2, 0));` |
| `magB` | `Math.sqrt(dims.reduce((s, d) => s + b[d] ** 2, 0));` |
| `TABS` | `['Smart Parser', 'Framework Extraction', 'NER & KPI', 'Multi-Doc Compare', 'Export & Integrate'];` |
| `delta` | `(sr(i * 9) * 20 - 10).toFixed(1);` |
| `conf` | `sr(fi * 7 + ci * 3);` |
| `vals` | `selectedCompanies.map(c => row[c.id]);` |
| `delta` | `vals.length === 2 ? (vals[0] - vals[1]).toFixed(2) : null;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_TOPICS`, `FRAMEWORKS`, `HISTORY_ROWS`, `INTEGRATION_CARDS`, `NLP_QUALITY_TREND`, `OIL_MAJORS`, `PARSE_STEPS`, `RADAR_COLORS`, `SHARED_KPIS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| KPI Extraction Coverage (%) | — | Parser Output | Proportion of target ESG KPIs successfully extracted from document; benchmark: 70%+ for GRI-indexed reports. |
| Extraction Confidence Score (0â€“100) | — | LLM Confidence Model | Weighted average ECS across all extracted values; low scores indicate complex or non-standard disclosure forma |
| Multi-Value Conflict Rate (%) | — | Parser QC Module | Percentage of KPIs with conflicting values across report sections; high rate indicates disclosure inconsistenc |
| Assurance Level Flag | — | Report Metadata | Highest level of independent assurance applied to disclosures (None/Limited/Reasonable); affects downstream da |
- **Corporate sustainability report PDFs and HTML pages** → OCR scanned pages; split by section using heading detection; run LLM extraction with GRI/SASB KPI schema → **Structured KPI table with value, unit, year, page reference, and ECS**
- **CDP questionnaire XML/CSV responses** → Parse standard CDP response format; map module answers to GHG Protocol and TCFD disclosure taxonomy → **CDP-sourced KPIs with assurance flag and disclosure quality indicator**
- **EDGAR/SEDAR regulatory filings** → Extract climate risk disclosures from 10-K Item 1C; identify quantified vs. qualitative disclosures → **TCFD-mapped disclosures with narrative vs. quantitative classification**

## 5 · Intermediate Transformation Logic
**Methodology:** Extraction Confidence Score
**Headline formula:** `ECS = P(correct extraction) × (1 − Ambiguity) × SourceQuality`
**Standards:** ['GRI Universal Standards 2021', 'SASB Standards 2023', 'TCFD Framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).