# Private Assets Transition Risk
**Module ID:** `private-assets-transition` · **Route:** `/private-assets-transition` · **Tier:** B (frontend-computed) · **EP code:** EP-CI2 · **Sprint:** CI

## 1 · Overview
PE/VC climate due diligence with LP look-through, GP engagement assessment, and exit value climate haircut.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DD_CHECKLIST`, `PE_FUNDS`, `PORTFOLIO_COS`, `SECTORS`, `SEC_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SECTORS` | `['Software', 'Healthcare', 'Manufacturing', 'Energy', 'Fintech', 'Consumer', 'Logistics', 'Clean Tech', 'Real Estate', 'Agri-Food'];` |
| `_sr` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `TABS` | `['Fund Portfolio Overview', 'Deal Climate Screening', 'LP Look-Through', 'GP Engagement Assessment', 'Exit Value Climate Adjustment', 'Vintage Transit` |
| `fundSummary` | `PE_FUNDS.map(f => {` |
| `exitData` | `filteredCos.slice(0, 20).map(c => ({` |
| `vintageData` | `[2018, 2019, 2020, 2021, 2022, 2023].map(v => {` |
| `total` | `PE_FUNDS.reduce((s, f) => s + f.aum, 0);` |
| `ddCats` | `[...new Set(DD_CHECKLIST.map(d => d.cat))];` |
| `gpRadar` | `gpDims.map(d => ({ dim: d, score: gpScores[d] \|\| 50 }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DD_CHECKLIST`, `PE_FUNDS`, `SECTORS`, `SEC_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Funds | — | Demo | PE funds with 50 underlying companies |
| DD Checklist | — | ILPA | Climate due diligence items |

## 5 · Intermediate Transformation Logic
**Methodology:** PE exit value climate adjustment
**Headline formula:** `ExitValue_adj = ExitMultiple × EBITDA × (1 - ClimateHaircut%)`
**Standards:** ['ILPA ESG', 'iCI', 'GRESB PE']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).