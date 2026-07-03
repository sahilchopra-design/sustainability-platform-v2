# FI Transition Dashboard
**Module ID:** `fi-transition-dashboard` · **Route:** `/fi-transition-dashboard` · **Tier:** B (frontend-computed) · **EP code:** EP-CT6 · **Sprint:** CT

## 1 · Overview
FI executive dashboard with 6 KPIs, taxonomy drill-down, client risk scatter, regulatory readiness, and board report generator.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AVG_SCORE`, `CLIENTS`, `Card`, `RATING_COLORS`, `TABS`, `TOTAL_EXPOSURE`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TOTAL_EXPOSURE` | `CLIENTS.reduce((s, c) => s + c.exposure, 0);` |
| `AVG_SCORE` | `Math.round(CLIENTS.reduce((s, c) => s + c.score, 0) / CLIENTS.length);` |
| `fiTaxScores` | `useMemo(() => TAXONOMY_TREE.map((l1, i) => ({` |
| `regReadiness` | `useMemo(() => Object.entries(REGULATORY_REQUIREMENTS).map(([geo, req]) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Score | — | Aggregation | FI-wide transition assessment |
| Green Asset Ratio | — | EU Taxonomy | GAR for regulatory disclosure |
| Engagement Rate | — | Stewardship | Clients actively engaged on transition |

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-module KPI aggregation for FIs
**Headline formula:** `Portfolio_Score = exposure_weighted_avg(client_scores)`
**Standards:** ['TCFD', 'ECB', 'GFANZ']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).