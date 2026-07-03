# Regional Economic Impact
**Module ID:** `regional-economic-impact` · **Route:** `/regional-economic-impact` · **Tier:** B (frontend-computed) · **EP code:** EP-CO3 · **Sprint:** CO

## 1 · Overview
10 fossil-dependent regions with I/O multiplier analysis, fiscal impact, migration dynamics, and inequality measures.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DIVERSIFICATION`, `MIGRATION_PROJ`, `MULTIPLIER_DATA`, `REGIONS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Regional Economy Dashboard','Input-Output Model','Fiscal Impact (Lost Royalties)','Diversification Pathways','Migration Dynamics','Inequality Analys` |
| `totalDirect` | `filtered.reduce((s, r) => s + r.directJobs, 0);` |
| `totalRoyalties` | `filtered.reduce((s, r) => s + r.royaltiesLost, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DIVERSIFICATION`, `MIGRATION_PROJ`, `MULTIPLIER_DATA`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Regions | — | Analysis | Fossil-dependent regions globally |
| Avg I/O Multiplier | — | Model | Each direct job loss impacts 2.4 indirect/induced jobs |

## 5 · Intermediate Transformation Logic
**Methodology:** Input-output regional modelling
**Headline formula:** `TotalImpact = DirectJobs × IOMultiplier; FiscalImpact = LostRoyalties - NewGreenTax`
**Standards:** ['ILO', 'World Bank WDI']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).