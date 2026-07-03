# SBTi Credibility Scorer
**Module ID:** `sbti-credibility-scorer` · **Route:** `/sbti-credibility-scorer` · **Tier:** B (frontend-computed) · **EP code:** EP-CM1 · **Sprint:** CM

## 1 · Overview
30 companies scored on 5-pillar SBTi credibility framework with say-do gap quantification.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AMBITION`, `COMPANIES`, `INTERIM`, `SCOPE_COV`, `TABS`, `VALIDATION`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `VALIDATION` | `{ approved: 20, committed: 10, 'self-declared': 5 };` |
| `SCOPE_COV` | `{ '1+2+3': 25, '1+2': 15 };` |
| `INTERIM` | `{ met: 15, 'on-track': 10, behind: 5, 'no-interim': 0 };` |
| `TABS` | `['Credibility Dashboard','Validation Status Tracker','Target Ambition Analysis','Scope 3 Coverage Audit','Interim Milestone Tracking','Say-Do Gap Quan` |
| `sectors` | `['All', ...new Set(COMPANIES.map(c => c.sector))];` |
| `validationDist` | `Object.entries(VALIDATION).map(([k]) => ({` |
| `sectorAvgs` | `[...new Set(COMPANIES.map(c => c.sector))].map(s => {` |
| `ambitionDist` | `Object.entries(AMBITION).map(([k]) => ({` |
| `interimDist` | `Object.entries(INTERIM).map(([k]) => ({` |
| `gapData` | `COMPANIES.map(c => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Companies | — | SBTi Database | With target data |
| Say-Do Gap | `Target vs actual progress` | Proprietary | Difference between stated ambition and demonstrated action |

## 5 · Intermediate Transformation Logic
**Methodology:** 5-pillar credibility scoring
**Headline formula:** `Score = Validation(20) + Ambition(25) + Scope(25) + Interim(15) + CapEx(15)`
**Standards:** ['SBTi Corporate Standard', 'CDP']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).