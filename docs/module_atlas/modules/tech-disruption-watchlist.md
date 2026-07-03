# Tech Disruption Watchlist
**Module ID:** `tech-disruption-watchlist` · **Route:** `/tech-disruption-watchlist` · **Tier:** B (frontend-computed) · **EP code:** EP-CL6 · **Sprint:** CL

## 1 · Overview
15 technology disruptions tracked with TRL, patent trends, VC funding, cost crossover countdown, and portfolio exposure.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DISRUPTIONS`, `KPI`, `PORTFOLIO_COMPANIES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Disruption Signal Dashboard','Patent Trend Analysis','VC/PE Investment Tracker','Cost Crossover Countdown','Adoption Tipping Points','Portfolio Expo` |
| `totalVC` | `DISRUPTIONS.reduce((s,d)=>s+d.vcFunding,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DISRUPTIONS`, `PORTFOLIO_COMPANIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Disruptions Tracked | — | Research | Across energy, transport, industry, food |
| Nearest Crossover | `Solid-state batteries` | BNEF | Cost parity with current Li-ion by 2028 |

## 5 · Intermediate Transformation Logic
**Methodology:** Technology readiness tracking
**Headline formula:** `DisruptionScore = TRL × PatentGrowth × VCFunding × (1/YearsToCrossover)`
**Standards:** ['EPO/USPTO', 'PitchBook']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).