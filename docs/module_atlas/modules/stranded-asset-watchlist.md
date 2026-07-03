# Stranded Asset Watchlist
**Module ID:** `stranded-asset-watchlist` · **Route:** `/stranded-asset-watchlist` · **Tier:** B (frontend-computed) · **EP code:** EP-CK5 · **Sprint:** CK

## 1 · Overview
20-asset interactive watchlist with configurable alert triggers and engagement tracking.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERT_TYPES`, `Badge`, `Card`, `KPI`, `TABS`, `TRIGGERS`, `WATCHLIST`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `_sr` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `totalExposure` | `WATCHLIST.reduce((s,w)=>s+w.exposure,0);` |
| `avgRisk` | `Math.round(WATCHLIST.reduce((s,w)=>s+w.strandingRisk,0)/WATCHLIST.length);` |
| `sectors` | `[...new Set(WATCHLIST.map(w=>w.sector))];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERT_TYPES`, `TABS`, `TRIGGERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Watchlist Assets | — | User-curated | Assets monitored for stranding signals |
| Alert Types | — | Configurable | Carbon price, tech, regulatory, rating, covenant, peer |

## 5 · Intermediate Transformation Logic
**Methodology:** Threshold-based alert system
**Headline formula:** `Alert = condition_met(carbon_price, rating_change, tech_crossover, regulation)`
**Standards:** ['User-configurable']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).