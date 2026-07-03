# Data Validation Engine
**Module ID:** `data-validation` · **Route:** `/data-validation` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Rule-based validation of ESG data submissions that flags type errors, range breaches, cross-field inconsistencies, and regulatory format violations. Validation rules are versioned and mapped to framework requirements, enabling traceable error remediation. Batch and real-time validation modes are supported.

> **Business value:** Prevents erroneous ESG data from reaching disclosures and analytics by catching errors at the point of ingestion. Versioned rule libraries ensure validation standards stay aligned with evolving regulatory frameworks, supporting audit-ready data pipelines.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHECKS`, `COLORS`, `DEFAULT_RULES`, `LS_FIXES`, `LS_PORTFOLIO`, `LS_RULES`, `LS_SCAN_HIST`, `SEV_CLR`, `VALID_SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `total` | `companies.length * activeRules.length;` |
| `passed` | `total - violations;` |
| `fields` | `new Set(validationResults.map(v => v.field));` |
| `exchanges` | `new Set(companies.map(c => c._displayExchange \|\| 'N/A'));` |
| `sectors` | `[...new Set(companies.map(c => c.sector))];` |
| `vals` | `sectorCos.map(c => c[f]).filter(v => typeof v === 'number' && v > 0);` |
| `mean` | `vals.reduce((a, b) => a + b, 0) / vals.length;` |
| `std` | `Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);` |
| `catBarData` | `useMemo(() => Object.entries(stats.byCat).map(([k, v]) => ({ name: k, violations: v })).sort((a, b) => b.violations - a.violations), [stats]);` |
| `exchBarData` | `useMemo(() => Object.entries(stats.byExchange).map(([k, v]) => ({ name: k.length > 12 ? k.slice(0, 12) + '..' : k, violations: v })).sort((a, b) => b.` |
| `sectorBarData` | `useMemo(() => Object.entries(stats.bySector).map(([k, v]) => ({ name: k.length > 15 ? k.slice(0, 15) + '..' : k, violations: v })).sort((a, b) => b.vi` |
| `trendData` | `useMemo(() => Array.from({ length: 12 }, (_, i) => ({ month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i], passRate: M` |
| `vals` | `sectorCos.map(c => c[field]).filter(v => typeof v === 'number' && v > 0);` |
| `median` | `vals.length > 0 ? vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)] : 0;` |
| `fixVal` | `field === 'sbti_committed' ? false : median > 0 ? Math.round(median * 100) / 100 : 50;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `DEFAULT_RULES`, `TABS`, `VALID_SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Validation Pass Rate | — | Rule engine | Share of records passing all assigned validation rules without blocking errors |
| Blocking Errors | — | Error classification engine | Count of records with at least one error that must be resolved before acceptance |
| Warning Flags | — | Rule engine | Non-blocking anomalies surfaced for data owner review without halting ingestion |
| Rule Library Size | — | Rule registry | Total active validation rules across all frameworks and data domains |
- **ESG data submissions (file upload, API, SFTP)** → Atomic rule evaluation: type checks, range guards, regex patterns, cross-field logic → **Error and warning inventory with field-level attribution**
- **Framework rule libraries (ESRS, GRI, XBRL)** → Rule-to-framework mapping and version control → **Compliance gap report per framework**
- **Remediation workflow system** → Error dispatch to data owners with rule explanation and fix guidance → **Remediation audit trail with timestamps**

## 5 · Intermediate Transformation Logic
**Methodology:** Validation Pass Rate
**Headline formula:** `VPR = (Records − Errors) / Records × 100`
**Standards:** ['ESRS 2 BP-1', 'GRI 2-5', 'XBRL Taxonomy Validation']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).