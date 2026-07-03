# Transition Risk Dashboard
**Module ID:** `transition-risk-dashboard` · **Route:** `/transition-risk-dashboard` · **Tier:** B (frontend-computed) · **EP code:** EP-CE2 · **Sprint:** CE

## 1 · Overview
Executive command centre with 6 KPI cards, sector heatmap, holdings monitor with CRITICAL/HIGH/MEDIUM/LOW/LEADER flags, regulatory readiness tracker, and engagement pipeline with escalation framework.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ENGAGEMENT`, `HOLDINGS`, `KPI_CARDS`, `Kpi`, `RADAR_DATA`, `REG_STATUS`, `SCORE_SERIES`, `SECTOR_HEAT`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `HOLDINGS` | `isIndiaMode() ? adaptForTransitionRisk().slice(0, 10).map(c => ({` |
| `total` | `fw.pillars.length * 4;` |
| `done` | `fw.complete.reduce((a, b) => a + b, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENGAGEMENT`, `KPI_CARDS`, `RADAR_DATA`, `REG_STATUS`, `SCORE_SERIES`, `SECTOR_HEAT`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio CVaR | `From EP-CE1` | Climate VaR Engine | Portfolio-level climate value-at-risk under NZ2050 |
| ITR | `From EP-CC1` | PACTA/GFANZ | Portfolio implied temperature rise |
| WACI | `From EP-CC2` | PCAF | Weighted average carbon intensity |
| Stranded Exposure | `From EP-CA2` | Carbon Tracker | Total stranded asset exposure under NZ2050 |
| GFANZ Alignment | `From EP-CC1` | Alliance databases | Portfolio percentage aligned with GFANZ commitments |
| Regulatory Readiness | `From EP-BZ3` | AI Compliance Agent | Framework-by-framework disclosure completeness |

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-module KPI aggregation
**Headline formula:** `Portfolio_Score = AUM_weighted_avg(entity_scores); Green_Bond_Pass_Rate = Pass_Count / Total_Count`
**Standards:** ['TCFD', 'ISSB S2', 'CSRD', 'GFANZ']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).