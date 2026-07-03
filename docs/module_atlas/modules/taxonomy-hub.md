# Taxonomy Hub
**Module ID:** `taxonomy-hub` · **Route:** `/taxonomy-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Multi-jurisdictional taxonomy comparison and alignment tool covering EU Taxonomy, UK Green Taxonomy, ASEAN Taxonomy, China Green Bond Catalogue and other emerging frameworks.

> **Business value:** EU Taxonomy alignment is mandatory in NFRD/CSRD reporting; 38% average alignment among large EU companies in 2023 (EBA), with significant variation by sector and activity classification approach.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTIONS`, `Badge`, `Btn`, `COUNTRY_ADOPTION`, `Card`, `DATA_GAPS`, `DEADLINES`, `FRAMEWORK_COVERAGE`, `KPI`, `LS_KEY`, `LS_PORTFOLIO`, `MODULES`, `ProgressBar`, `SectionTitle`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`.replace(/"/g, '""')).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });` |
| `src` | `companies.length ? companies.slice(0, 80) : Array.from({ length: 40 }, (_, i) => ({ name: `Company ${i + 1}`, ticker: `C${i + 1}`, sector: ['Energy','` |
| `radarData` | `FRAMEWORK_COVERAGE.map(f => ({ framework: f.fw, compliance: f.compliance, fullMark: 100 }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACTIONS`, `COUNTRY_ADOPTION`, `DATA_GAPS`, `DEADLINES`, `FRAMEWORK_COVERAGE`, `MODULES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EU Taxonomy Aligned Revenue | — | Taxonomy Assessment | Share of total revenue from activities aligned with EU Taxonomy technical screening criteria. |
| UK Taxonomy Eligible Revenue | — | UK Green Taxonomy | Share of revenue from activities in scope of UK Green Taxonomy; alignment assessment pending final criteria. |
| Jurisdictions Covered | — | Framework Library | Number of active taxonomy frameworks mapped in the hub including EU, UK, ASEAN, China, Canada, South Africa. |
- **Business Activity Data, DNSH Assessment Records, Revenue/Capex/Opex Data** → Activity classification + DNSH + minimum safeguards engine → **Taxonomy alignment KPIs, CSRD Article 8 disclosures, investor reporting packages**

## 5 · Intermediate Transformation Logic
**Methodology:** Taxonomy Alignment Score
**Headline formula:** `TAS = Eligible Revenue / Total Revenue × Aligned Revenue / Eligible Revenue`
**Standards:** ['EU Taxonomy Regulation 2020/852', 'UK Green Taxonomy 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).