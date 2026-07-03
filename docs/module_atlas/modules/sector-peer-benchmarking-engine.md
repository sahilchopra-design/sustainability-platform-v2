# Sector Peer Benchmarking
**Module ID:** `sector-peer-benchmarking-engine` · **Route:** `/sector-peer-benchmarking-engine` · **Tier:** B (frontend-computed) · **EP code:** EP-CW2 · **Sprint:** CW

## 1 · Overview
6 sectors × 8 peers with quartile ranking, best-practice identification, and convergence analysis.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_PEERS`, `Badge`, `Card`, `KPI`, `Pill`, `SECTORS`, `SECTOR_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `peers` | `useMemo(() => ALL_PEERS.filter(p => p.sector === selSector).sort((a,b) => b.score-a.score), [selSector]);` |
| `median` | `useMemo(() => Math.round(peers[3]?.score \|\| 0), [peers]);` |
| `q3val` | `useMemo(() => Math.round(peers[5]?.score \|\| 0), [peers]);` |
| `distData` | `useMemo(() => SECTORS.map(s => {` |
| `scores` | `sp.map(p=>p.score).sort((a,b)=>a-b);` |
| `convData` | `useMemo(() => ['Q1-25','Q2-25','Q3-25','Q4-25','Q1-26'].map((q,qi) => {` |
| `laggards` | `peers.slice(-2);` |
| `engagementTargets` | `useMemo(() => peers.filter((_,i) => i >= 4).map(p => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Peers | — | 6×8 | Sector peer groups |
| Convergence | — | Trend | Some sectors converging, others diverging |

## 5 · Intermediate Transformation Logic
**Methodology:** Quartile benchmarking
**Headline formula:** `Quartile = rank(entity_score) within sector peer group`
**Standards:** ['MSCI', 'Sustainalytics']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).