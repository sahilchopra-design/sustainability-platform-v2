# Anomaly Detection Engine
**Module ID:** `anomaly-detection-engine` · **Route:** `/anomaly-detection-engine` · **Tier:** B (frontend-computed) · **EP code:** EP-CX3 · **Sprint:** CX

## 1 · Overview
Isolation Forest with configurable contamination, flagged entity investigation workflow, and false positive rate tracking.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERT_HISTORY`, `Badge`, `Card`, `ENTITIES`, `FPR_DATA`, `KPI`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `FPR_DATA` | `['2025-Q1','2025-Q2','2025-Q3','2025-Q4','2026-Q1'].map((q,i) => ({` |
| `scatterData` | `useMemo(() => ENTITIES.map(e => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FPR_DATA`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Contamination | — | Configurable | 5% expected anomaly rate |
| Flagged Entities | — | Detection | Entities with anomalous profiles |

## 5 · Intermediate Transformation Logic
**Methodology:** Isolation Forest anomaly detection
**Headline formula:** `AnomalyScore = avgPathLength(x) / avgPathLength(random); Flag if score > threshold`
**Standards:** ['Liu et al. (2008)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).