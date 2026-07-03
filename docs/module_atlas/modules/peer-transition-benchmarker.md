# Peer Transition Benchmarker
**Module ID:** `peer-transition-benchmarker` · **Route:** `/peer-transition-benchmarker` · **Tier:** B (frontend-computed) · **EP code:** EP-CM6 · **Sprint:** CM

## 1 · Overview
6 GICS sectors with 5 peer companies each. 6-pillar radar comparison, best-in-class identification, convergence analysis.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `PEER_GROUPS`, `PILLARS`, `PILLAR_WEIGHTS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sorted` | `peers.map(p => p.total).sort((a, b) => b - a);` |
| `rank` | `sorted.indexOf(score) + 1;` |
| `TABS` | `['Sector Peer Groups','Transition Score Comparison','Best-in-Class Identification','Laggard Screening','Convergence Analysis','Engagement Priority Mat` |
| `sorted` | `useMemo(() => [...peers].sort((a, b) => b.total - a.total), [sector]);` |
| `bestInClass` | `Object.entries(PEER_GROUPS).map(([s, p]) => {` |
| `best` | `[...p].sort((a, b) => b.total - a.total)[0];` |
| `laggards` | `Object.entries(PEER_GROUPS).flatMap(([s, p]) => p.filter(c => quartile(c.total, p) === 'Q4').map(c => ({ ...c, sector: s })));` |
| `convergenceData` | `['2020','2021','2022','2023','2024'].map(y => {` |
| `drift` | `(2024 - parseInt(y)) * (i % 2 === 0 ? 2.5 : -1.5);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PILLARS`, `PILLAR_WEIGHTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sectors | — | GICS | Energy, Materials, Utilities, Industrials, Consumer, Tech |
| Peers per Sector | — | Demo | 30 companies total |

## 5 · Intermediate Transformation Logic
**Methodology:** Sector peer benchmarking
**Headline formula:** `PeerRank = position in sector quartile (Q1=leaders, Q4=laggards)`
**Standards:** ['MSCI', 'Sustainalytics']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).