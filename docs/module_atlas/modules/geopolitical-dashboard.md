# Geopolitical Dashboard
**Module ID:** `geopolitical-dashboard` · **Route:** `/geopolitical-dashboard` · **Tier:** B (frontend-computed) · **EP code:** EP-CV6 · **Sprint:** CV

## 1 · Overview
Executive dashboard with risk heatmap, top 10 exposures, sanctions alerts, mineral supply alerts, and board report.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CONFLICT_ALERTS`, `DIMS`, `HEATMAP_DATA`, `MINERAL_ALERTS`, `RISK_COLORS`, `SANCTIONS_ALERTS`, `SEV_BG`, `TABS`, `TOP10_EXPOSURES`

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CONFLICT_ALERTS`, `DIMS`, `HEATMAP_DATA`, `MINERAL_ALERTS`, `SANCTIONS_ALERTS`, `TABS`, `TOP10_EXPOSURES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Top Exposure | — | Portfolio | Highest geopolitical risk holding |

## 5 · Intermediate Transformation Logic
**Methodology:** Dashboard aggregation
**Headline formula:** `Aggregates outputs from EP-CV1 through CV5`
**Standards:** ['All Sprint CV modules']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).