# Anomaly Detection
**Module ID:** `anomaly-detection` · **Route:** `/anomaly-detection` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ML-powered ESG data anomaly detection engine that flags statistical outliers, data entry errors, and implausible trend breaks across platform datasets. Uses isolation forest, z-score, and time-series decomposition models to surface quality alerts, enabling data stewards to investigate and remediate before they propagate into disclosures. Tracks anomaly resolution rates and data quality KPIs.

> **Business value:** Proactive anomaly detection prevents erroneous ESG data from flowing into regulatory disclosures, carbon accounting reports, and investment decisions. By catching implausible emissions spikes or carbon intensity inversions at ingestion, the engine reduces material misstatement risk and supports ISAE 3000 limited assurance engagements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COLORS`, `KpiCard`, `LS_ANOM`, `LS_PORT`, `MONITOR_FIELDS`, `Section`, `SortIcon`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `mean` | `valid.reduce((s, v) => s + v, 0) / valid.length;` |
| `std` | `Math.sqrt(valid.reduce((s, v) => s + (v - mean) ** 2, 0) / valid.length);` |
| `sorted` | `[...valid].sort((a, b) => a - b);` |
| `lower` | `q1 - multiplier * iqr;` |
| `upper` | `q3 + multiplier * iqr;` |
| `fields` | `MONITOR_FIELDS.map(f => f.key);` |
| `peerValues` | `sectorPeers.map(p => p[f]).filter(v => v !== undefined && v !== null && !isNaN(v));` |
| `mean` | `peerValues.reduce((s, v) => s + v, 0) / peerValues.length;` |
| `std` | `Math.sqrt(peerValues.reduce((s, v) => s + (v - mean) ** 2, 0) / peerValues.length) \|\| 1;` |
| `dev` | `Math.abs((val - mean) / std);` |
| `values` | `holdings.map(h => h[field.key]);` |
| `isoScores` | `holdings.map((h, i) => {` |
| `values` | `holdings.map(c => c[f.key]).filter(v => v !== null && v !== undefined && !isNaN(v));` |
| `mean` | `values.reduce((s, v) => s + v, 0) / values.length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `MONITOR_FIELDS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Anomaly Detection Rate | — | Platform ML pipeline | Frequency of anomalous observations per thousand ESG data points ingested |
| False Positive Rate | — | Data steward review | Proportion of model-flagged anomalies confirmed as legitimate on manual review |
| Resolution SLA | — | Platform governance policy | Target time for data stewards to investigate and resolve high-priority anomaly alerts |
- **Platform ESG data ingestion pipeline** → Apply z-score and Isolation Forest models; ensemble vote for alert threshold → **Prioritised anomaly alert queue with scores, source fields, and drill-down links**
- **Historical data quality review logs** → Train Isolation Forest on clean baseline; update model quarterly → **Updated anomaly model with recalibrated sensitivity thresholds**

## 5 · Intermediate Transformation Logic
**Methodology:** Isolation Forest + z-score ensemble
**Headline formula:** `z_score = (x – μ) / σ; AnomalyScore = avg(IsoForest_score, z_score_flag); IF_score = 2^(–E[h(x)]/c(n))`
**Standards:** ['ISO 8000 Data Quality', 'GHG Protocol Data Quality', 'PCAF DQ Scale']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).