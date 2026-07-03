# Critical Mineral Geo Risk
**Module ID:** `critical-mineral-geo-risk` · **Route:** `/critical-mineral-geo-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-CV3 · **Sprint:** CV

## 1 · Overview
8 minerals with processing concentration, friendshoring index, and export control scenarios.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FRIENDSHORING`, `MINERALS`, `PORTFOLIO_IMPACT`, `PRICE_TREND`, `PROCESSING_CONC`, `SCENARIOS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PROCESSING_CONC` | `MINERALS.map(m => ({ mineral: m.name, china: m.processing_china, other: 100 - m.processing_china }));` |
| `FRIENDSHORING` | `MINERALS.map(m => ({ mineral: m.name, oecd: m.oecd_share, nonOecd: 100 - m.oecd_share }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MINERALS`, `PORTFOLIO_IMPACT`, `PRICE_TREND`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Minerals | — | USGS | Li, Co, Ni, Cu, REE, graphite, Mn, PGMs |

## 5 · Intermediate Transformation Logic
**Methodology:** Mineral supply chain geopolitical risk
**Headline formula:** `GeoRisk = SupplyConcentration × ProcessingConcentration × GeopoliticalInstability`
**Standards:** ['USGS', 'IEA']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).