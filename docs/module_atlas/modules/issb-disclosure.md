# ISSB Disclosure Engine
**Module ID:** `issb-disclosure` · **Route:** `/issb-disclosure` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
End-to-end preparation engine for IFRS S1 general sustainability disclosure and IFRS S2 climate-related disclosure requirements, covering governance, strategy, risk management, and metrics and targets pillars. Automates gap analysis against disclosure requirements, generates tagged XBRL output, and tracks filing readiness across reporting periods. Incorporates TCFD-aligned scenario analysis templates and cross-referencing to ESRS and SEC climate rules.

> **Business value:** Enables listed companies and large entities to achieve compliant, consistent IFRS S2 disclosure aligned with ISSB requirements, reducing regulatory risk and meeting investor expectations for comparable climate-related financial information.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `ADOPTION`, `CONNECTIVITY`, `GAP_ITEMS`, `KPI`, `PAGE_SIZE`, `PIECLRS`, `S1_PILLARS`, `S2_REQUIREMENTS`, `SASB_INDUSTRIES`, `SCENARIO_SET`, `SectionHead`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))]` |
| `allReqs` | `[...S1_PILLARS.flatMap(p=>p.reqs.map(r=>({...r,pillar:p.pillar,standard:'IFRS S1'}))),...S2_REQUIREMENTS.map(r=>({code:`S2-${r.id}`,label:r.title,stat` |
| `totalReqs` | `S1_PILLARS.reduce((s,p)=>s+p.reqs.length,0);` |
| `complete` | `S1_PILLARS.reduce((s,p)=>s+p.reqs.filter(r=>r.status==='Complete').length,0);` |
| `radarData` | `S1_PILLARS.map(p=>({pillar:p.pillar,score:p.score}));` |
| `avgScore` | `Math.round(S2_REQUIREMENTS.reduce((s,r)=>s+r.score,0)/ Math.max(1, S2_REQUIREMENTS.length));` |
| `cpData` | `SCENARIO_SET.map(s=>({name:s.name,cp2030:s.carbonPrice2030,cp2050:s.carbonPrice2050}));` |
| `sasbSectors` | `['All',...new Set(SASB_INDUSTRIES.map(i=>i.sector))];` |
| `avgQuality` | `Math.round(GAP_ITEMS.reduce((s,g)=>s+g.quality,0)/ Math.max(1, GAP_ITEMS.length));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ADOPTION`, `CONNECTIVITY`, `PIECLRS`, `S1_PILLARS`, `S2_REQUIREMENTS`, `SCENARIO_SET`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| IFRS S2 Requirements Coverage (%) | — | ISSB IFRS S2 checklist | Proportion of S2 paragraphs addressed in current draft disclosure |
| Cross-reference Conflicts | — | Automated XBRL tag validator | Number of tagged data points with value inconsistencies across disclosure sections |
| Scenario Analysis Completeness | — | IFRS S2 para 22–44 | Whether strategy disclosure addresses both transition and physical scenarios under S2(b) |
| Transition Plan Disclosure | — | IFRS S2 requirements | Whether transition plan is disclosed under Strategy pillar paragraph 14(b), not 14(c) |
- **Prior year sustainability / TCFD report** → Extract existing disclosures; map to S1/S2 requirement paragraphs; score completeness → **Pillar-level gap analysis with priority ranking**
- **Climate scenario model outputs** → Structure under S2 Strategy paras 22–44; ensure 1.5°C and physical scenario coverage → **Narrative and quantitative scenario disclosure per S2 requirements**
- **Financial statements and audit trail** → Cross-reference climate-related financial impacts to P&L/balance sheet notes; validate consistency → **Auditable evidence package for external assurance provider**

## 5 · Intermediate Transformation Logic
**Methodology:** Disclosure Completeness Index
**Headline formula:** `DCI = Completed Requirements / Total Applicable Requirements × 100`
**Standards:** ['IFRS S1 General Requirements for Disclosure of Sustainability-related Financial Information', 'IFRS S2 Climate-related Disclosures', 'TCFD Recommendations 2017', 'ISSB Transition Relief Provisions 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).