# Template Manager
**Module ID:** `template-manager` · **Route:** `/template-manager` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG report template library management system enabling organisations to create, version, manage and deploy standardised report templates across GRI, CSRD, TCFD, SFDR and custom frameworks.

> **Business value:** Standardised template management reduces ESG report production time by 40–60% and improves inter-period comparability; version control is mandatory for CSRD reasonable assurance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COVER_STYLES`, `DEFAULT_TEMPLATES`, `LS_PORTFOLIO`, `LS_TEMPLATES`, `SECTION_CATEGORIES`, `SECTION_LIBRARY`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `SECTION_CATEGORIES` | `[...new Set(SECTION_LIBRARY.map(s => s.category))];` |
| `blob` | `new Blob([data], { type: 'application/json' });` |
| `customs` | `imported.filter(t => !DEFAULT_TEMPLATES.some(d => d.id === t.id)).map(t => ({ ...t, isDefault: false, id: t.id \|\| `imported_${Date.now()}_${sr(_sc++).` |
| `usageData` | `useMemo(() => allTemplates.map(t => ({ name: t.name.length > 16 ? t.name.slice(0, 16) + '...' : t.name, usage: t.usageCount \|\| 0, sections: (t.section` |
| `rows` | `[['Name','Description','Sections','Usage','Font','Primary Color','Created'].join(','), ...allTemplates.map(t => [t.name, `"${t.description}"`, (t.sect` |
| `blob` | `new Blob([rows.join('\n')], { type: 'text/csv' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COVER_STYLES`, `DEFAULT_TEMPLATES`, `PIE_COLORS`, `SECTION_CATEGORIES`, `SECTION_LIBRARY`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Templates in Library | — | Template Database | Total managed templates across all frameworks, jurisdictions and reporting cycles. |
| Avg Coverage Score | — | TCS Engine | Mean mandatory field completion rate across all active report templates. |
| Templates Published (YTD) | — | Workflow Log | Number of finalised reports generated from managed templates in current reporting year. |
- **Framework Disclosure Requirements, Internal ESG Data APIs, Historical Reports** → Field mapping + coverage scoring + version control engine → **Published ESG reports, template library, audit trail, coverage analytics**

## 5 · Intermediate Transformation Logic
**Methodology:** Template Coverage Score
**Headline formula:** `TCS = Populated Fields / Required Fields × 100`
**Standards:** ['GRI Universal Standards 2021', 'ESRS Set 1 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).