# Net Zero Credibility Index
**Module ID:** `net-zero-credibility-index` · **Route:** `/net-zero-credibility-index` · **Tier:** B (frontend-computed) · **EP code:** EP-CM3 · **Sprint:** CM

## 1 · Overview
15-KPI net zero credibility framework scoring 0-150 with A-E rating (A≥120, E<40).

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `KPIS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Credibility Index Dashboard','15-KPI Scorecard','CapEx Alignment','Lobbying Consistency','Executive Compensation','Peer Ranking'];` |
| `radarData` | `KPIS.map((k, i) => ({ kpi: k.length > 12 ? k.slice(0, 12) + '..' : k, score: selData.scores[i], max: 10 }));` |
| `ratingDist` | `['A', 'B', 'C', 'D', 'E'].map(r => ({ rating: r, count: COMPANIES.filter(c => nzRating(c.total) === r).length }));` |
| `capexData` | `COMPANIES.map(c => ({ name: c.name, capex: c.scores[1], total: c.total })).sort((a, b) => b.capex - a.capex);` |
| `lobbyData` | `COMPANIES.map(c => ({ name: c.name, lobby: c.scores[3], total: c.total })).sort((a, b) => b.lobby - a.lobby);` |
| `execData` | `COMPANIES.map(c => ({ name: c.name, exec: c.scores[4], board: c.scores[5] })).sort((a, b) => (b.exec + b.board) - (a.exec + a.board));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANIES`, `KPIS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| KPIs | — | Multi-source | Each scored 0-10 |
| Max Score | — | Composite | A≥120, B≥100, C≥70, D≥40, E<40 |

## 5 · Intermediate Transformation Logic
**Methodology:** 15-KPI composite credibility
**Headline formula:** `Score = Σ(KPI_i), each 0-10, total 0-150`
**Standards:** ['SBTi', 'CDP', 'InfluenceMap', 'RE100']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).