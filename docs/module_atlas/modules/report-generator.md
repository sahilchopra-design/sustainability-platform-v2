# Report Generator
**Module ID:** `report-generator` · **Route:** `/report-generator` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Automated ESG and climate report generation from configurable templates, combining platform analytics outputs with narrative and regulatory-aligned disclosure formatting.

> **Business value:** Automates the last mile of ESG reporting by combining platform data with configurable templates, dramatically reducing manual report production effort while ensuring regulatory alignment.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_SECTIONS`, `COVERAGE_MATRIX`, `FW_COLORS`, `LS_HISTORY`, `LS_PORTFOLIO`, `LS_SCHEDULE`, `REPORT_TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `pick` | `(arr, n) => arr[Math.floor(sRand(n) * arr.length)];` |
| `topCompanies` | `companies.slice(0, 5).map((c, i) => ({` |
| `uniqueFrameworks` | `useMemo(() => ['All', ...new Set(REPORT_TYPES.map(r => r.framework))], []);` |
| `uniqueAudiences` | `useMemo(() => ['All', ...new Set(REPORT_TYPES.map(r => r.audience))], []);` |
| `uniqueFreqs` | `useMemo(() => ['All', ...new Set(REPORT_TYPES.map(r => r.frequency))], []);` |
| `blob` | `new Blob([content], { type: ext === 'html' ? 'text/html' : ext === 'json' ? 'application/json' : 'text/markdown' });` |
| `sectionsByReport` | `useMemo(() => REPORT_TYPES.map(r => ({ name: r.id.toUpperCase(), sections: r.sections.length, pages: r.pages_est })), []);` |
| `coverage` | `Math.round(60 + sRand(s) * 35);` |
| `records` | `Math.round(100 + sRand(s + 1) * 900);` |
| `quality` | `Math.round(70 + sRand(s + 2) * 25);` |
| `blob` | `new Blob([data], { type: 'application/json' });` |
| `rows` | `[['Name','Framework','Sections','Pages','Audience','Frequency','Modules'].join(','), ...REPORT_TYPES.map(r => [r.name, r.framework, r.sections.length,` |
| `blob` | `new Blob([rows.join('\n')], { type: 'text/csv' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_SECTIONS`, `COVERAGE_MATRIX`, `REPORT_TYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Report Templates Available | — | Template Library | Pre-built report templates covering TCFD, GRI, CSRD, SFDR, and CDP frameworks. |
| Avg Generation Time (min) | — | Performance Monitor | Mean time from report initiation to PDF/Word export completion. |
| Data Auto-Fill Rate (%) | — | Data Connector | Share of report data fields automatically populated from platform analytics without manual input. |
- **Platform analytics outputs + template library + user narrative inputs** → Data field mapping; narrative assembly; format rendering → **Published ESG report in PDF/DOCX/XBRL with version control and audit trail**

## 5 · Intermediate Transformation Logic
**Methodology:** Report Completeness Index
**Headline formula:** `RC = completed_sections / total_required_sections × 100`
**Standards:** ['GRI Standards 2021', 'TCFD Recommendations', 'ESRS Set 1']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).