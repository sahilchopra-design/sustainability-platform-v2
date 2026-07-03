# Stranded Recovery Pathways
**Module ID:** `stranded-recovery-pathways` · **Route:** `/stranded-recovery-pathways` · **Tier:** B (frontend-computed) · **EP code:** EP-CK3 · **Sprint:** CK

## 1 · Overview
10 repurposing pathways for stranded assets with conversion CapEx and IRR.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CASE_STUDIES`, `Card`, `KPI`, `PATHWAYS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalCapex` | `PATHWAYS.reduce((s,p)=>s+p.capex,0);` |
| `totalJobs` | `PATHWAYS.reduce((s,p)=>s+p.jobs,0);` |
| `avgIRR` | `PATHWAYS.reduce((s,p)=>s+p.irr,0)/PATHWAYS.length;` |
| `totalSaved` | `PATHWAYS.reduce((s,p)=>s+p.savedEmissions,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CASE_STUDIES`, `PATHWAYS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Pathways | — | Analysis | Conversion options per asset type |
| Best IRR | `Coal→battery` | Model | Highest return on conversion investment |

## 5 · Intermediate Transformation Logic
**Methodology:** Conversion IRR analysis
**Headline formula:** `IRR = rate where NPV(conversion_cash_flows) = 0`
**Standards:** ['Sector studies', 'IEA']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).