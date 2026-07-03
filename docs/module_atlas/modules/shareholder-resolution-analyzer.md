# Shareholder Resolution Analyzer
**Module ID:** `shareholder-resolution-analyzer` · **Route:** `/shareholder-resolution-analyzer` · **Tier:** B (frontend-computed) · **EP code:** EP-CP4 · **Sprint:** CP

## 1 · Overview
100 climate/ESG resolutions (2020-2025) with success rate trends, topic classification, filer analysis, and impact assessment.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FILERS`, `MGMT_RESP`, `RESOLUTIONS`, `RESP_COLORS`, `TABS`, `TOPICS`, `TREND_DATA`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `topics` | `[...new Set(RESOLUTIONS.map(r => r.topic))];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FILERS`, `MGMT_RESP`, `RESOLUTIONS`, `RESP_COLORS`, `TABS`, `TOPICS`, `TREND_DATA`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Resolutions | — | Proxy data | 5-year database |
| Avg Support | — | Market data | Average shareholder support for climate resolutions |

## 5 · Intermediate Transformation Logic
**Methodology:** Resolution success tracking
**Headline formula:** `SuccessRate = Resolutions_with_majority / Total_resolutions`
**Standards:** ['ProxyMonitor', 'ShareAction']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).