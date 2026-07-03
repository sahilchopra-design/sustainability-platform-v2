# Green Jobs Pipeline
**Module ID:** `green-jobs-pipeline-tracker` · **Route:** `/green-jobs-pipeline-tracker` · **Tier:** B (frontend-computed) · **EP code:** EP-CO5 · **Sprint:** CO

## 1 · Overview
8 green sectors with 2025-2040 job projections, skills taxonomy, wage analysis, and geographic distribution.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `GEO_DIST`, `PALETTE`, `PIPELINE`, `POLICY`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Green Jobs Dashboard','Sector Pipeline 2025-2040','Skills Taxonomy','Wage Analysis','Geographic Distribution','Policy Incentives'];` |
| `totalJobs2040` | `SECTORS.reduce((s, sec) => s + sec.jobs2040, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GEO_DIST`, `PALETTE`, `PIPELINE`, `POLICY`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green Jobs 2030 | — | IRENA/ILO | Global projection across 8 sectors |
| Top Sector | — | IRENA | Largest employer in clean energy |

## 5 · Intermediate Transformation Logic
**Methodology:** Sector job projection model
**Headline formula:** `Jobs(sector, year) = Deployment(sector, year) × Jobs_per_unit(sector)`
**Standards:** ['IRENA Jobs Review', 'ILO']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).