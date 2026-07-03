# Geopolitical Risk Index
**Module ID:** `geopolitical-risk-index` · **Route:** `/geopolitical-risk-index` · **Tier:** B (frontend-computed) · **EP code:** EP-CV1 · **Sprint:** CV

## 1 · Overview
50 countries with WGI 6 dimensions, sanctions exposure, conflict intensity, and custom weights.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `DIMS`, `REGIONS`, `TABS`, `WEIGHTS_DEFAULT`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['North America','Western Europe','Eastern Europe','Middle East','Sub-Saharan Africa','North Africa','South Asia','East Asia','Southeast Asia','Centra` |
| `totalW` | `Object.values(w).reduce((s, v) => s + v, 0);` |
| `govScore` | `(c.va * w.va + c.ps * w.ps + c.ge * w.ge + c.rq * w.rq + c.rl * w.rl + c.cc * w.cc) / (w.va + w.ps + w.ge + w.rq + w.rl + w.cc);` |
| `riskPenalty` | `(c.sanctions * w.sanctions + c.conflict * w.conflict + c.trade * w.trade) / (w.sanctions + w.conflict + w.trade);` |
| `TABS` | `['Global Risk Map','Country Rankings','6-Dimension Analysis','Trend & Forecast','Custom Weights','Regional Deep-Dive'];` |
| `regionData` | `REGIONS.map(r => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `DIMS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Countries | — | WGI | Covering 85% of global GDP |
| WGI Dimensions | — | World Bank | Annual governance indicators |

## 5 · Intermediate Transformation Logic
**Methodology:** Composite geopolitical scoring
**Headline formula:** `GeoRisk = Σ(dimension_i × weight_i)`
**Standards:** ['World Bank WGI', 'EIU', 'V-Dem']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).