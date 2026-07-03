# Climate Bond Index Tracker
**Module ID:** `climate-bond-index-tracker` · **Route:** `/climate-bond-index-tracker` · **Tier:** B (frontend-computed) · **EP code:** EP-CQ4 · **Sprint:** CQ

## 1 · Overview
CBI certified bond universe with performance comparison vs conventional, sector allocation, and new issuance monitor.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `GEO`, `ISSUANCE`, `NEW_DEALS`, `PALETTE`, `PERF`, `SECTORS`, `TABS`

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GEO`, `ISSUANCE`, `NEW_DEALS`, `PALETTE`, `PERF`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CBI Universe | — | CBI | Total outstanding certified bonds |
| New Issuance | — | CBI | Annual green/sustainability issuance |

## 5 · Intermediate Transformation Logic
**Methodology:** Index performance tracking
**Headline formula:** `ExcessReturn = GreenBondIndex_return - BloombergAgg_return`
**Standards:** ['CBI', 'Bloomberg']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).