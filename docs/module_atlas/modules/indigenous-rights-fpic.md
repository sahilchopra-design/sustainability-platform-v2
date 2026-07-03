# Indigenous Rights & FPIC
**Module ID:** `indigenous-rights-fpic` · **Route:** `/indigenous-rights-fpic` · **Tier:** B (frontend-computed) · **EP code:** EP-CO4 · **Sprint:** CO

## 1 · Overview
20 projects in indigenous territories with consent tracking, rights framework compliance, and cultural heritage impact.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FPIC_COLORS`, `FPIC_DIST`, `PROJECTS`, `TABS`

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FPIC_COLORS`, `FPIC_DIST`, `PROJECTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Projects | — | Portfolio | In or near indigenous territories |
| FPIC Compliance | — | Assessment | Projects with adequate FPIC process |

## 5 · Intermediate Transformation Logic
**Methodology:** FPIC compliance scoring
**Headline formula:** `FPICScore = ConsentStatus(30) + ProcessQuality(25) + BenefitSharing(25) + GrievanceMech(20)`
**Standards:** ['UNDRIP', 'ILO C169', 'IFC PS7']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).